/**
 * ImageViewer Feature Module
 *
 * Responsibilities:
 * - Provide a high-performance image viewing experience with zoom, pan, and rotation.
 * - Manage image preloading and caching for smooth navigation.
 * - Handle fullscreen and keyboard interactions.
 *
 * Boundaries:
 * - Does not handle file system operations directly; relies on provided item metadata and tokens.
 */

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

export interface ImageViewerItem {
    id: string;
    name: string;
    provider: string;
}

interface ImageViewerProps {
    isOpen: boolean;
    items: ImageViewerItem[];
    initialIndex?: number;
    token?: string;
    onClose: () => void;
}

interface ViewerState {
    index: number;
    loading: boolean;
    error: string | null;
}

type ViewerAction =
    | { type: "SET_INDEX"; payload: number }
    | { type: "LOAD_START" }
    | { type: "LOAD_SUCCESS" }
    | { type: "LOAD_ERROR"; payload: string };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

interface FitMetrics {
    baseW: number;
    baseH: number;
    maxX: number;
    maxY: number;
    stageW: number;
    stageH: number;
}

interface CachedImageEntry {
    status: "loading" | "loaded" | "error";
    img?: HTMLImageElement;
    lastUsed: number;
}

function reducer(state: ViewerState, action: ViewerAction): ViewerState {
    switch (action.type) {
        case "SET_INDEX":
            return { ...state, index: action.payload, loading: true, error: null };
        case "LOAD_START":
            return { ...state, loading: true, error: null };
        case "LOAD_SUCCESS":
            return { ...state, loading: false, error: null };
        case "LOAD_ERROR":
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
    isOpen,
    items,
    initialIndex = 0,
    token,
    onClose,
}) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDistanceRef = useRef<number | null>(null);
    const pinchStartScaleRef = useRef<number>(1);
    const dragRef = useRef<{ active: boolean; pointerId: number | null; lastX: number; lastY: number }>({
        active: false,
        pointerId: null,
        lastX: 0,
        lastY: 0,
    });
    const transformRef = useRef({ scale: 1, x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullscreenActive, setIsFullscreenActive] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const hideControlsTimerRef = useRef<number | null>(null);
    const imageCacheRef = useRef<Map<string, CachedImageEntry>>(new Map());
    const pendingIdleHandlesRef = useRef<number[]>([]);
    const objectUrlRef = useRef<string | null>(null);
    const blobFallbackTriedRef = useRef<Set<string>>(new Set());
    const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
    const [prevUrl, setPrevUrl] = useState("");

    const [state, dispatch] = useReducer(reducer, {
        index: initialIndex,
        loading: true,
        error: null,
    });

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    /** Calculate fit metrics for the current image and stage dimensions. */
    const getFitMetrics = useCallback((scale: number): FitMetrics => {
        const stage = stageRef.current;
        const image = imageRef.current;
        if (!stage || !image || image.naturalWidth === 0 || image.naturalHeight === 0) {
            return { baseW: 0, baseH: 0, maxX: 0, maxY: 0, stageW: 0, stageH: 0 };
        }

        const stageW = stage.clientWidth;
        const stageH = stage.clientHeight;
        const isVerticalRotation = rotation % 180 !== 0;
        const naturalW = isVerticalRotation ? image.naturalHeight : image.naturalWidth;
        const naturalH = isVerticalRotation ? image.naturalWidth : image.naturalHeight;
        const fitRatio = Math.min(stageW / naturalW, stageH / naturalH);
        const baseW = naturalW * fitRatio;
        const baseH = naturalH * fitRatio;
        const maxX = Math.max(0, ((baseW * scale) - baseW) / 2);
        const maxY = Math.max(0, ((baseH * scale) - baseH) / 2);
        return { baseW, baseH, maxX, maxY, stageW, stageH };
    }, [rotation]);

    /** Apply CSS transformations to the image element. */
    const applyTransform = useCallback((nextScale: number, nextX: number, nextY: number) => {
        const image = imageRef.current;
        if (!image) return;

        const boundedScale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
        const { baseW, baseH, maxX, maxY } = getFitMetrics(boundedScale);
        const boundedX = clamp(nextX, -maxX, maxX);
        const boundedY = clamp(nextY, -maxY, maxY);

        transformRef.current = { scale: boundedScale, x: boundedX, y: boundedY };
        if (baseW > 0 && baseH > 0) {
            image.style.width = `${baseW}px`;
            image.style.height = `${baseH}px`;
            image.style.maxWidth = "100%";
            image.style.maxHeight = "100%";
            image.style.objectFit = "contain";
        }
        image.style.transform = `translate3d(${boundedX}px, ${boundedY}px, 0) scale(${boundedScale}) rotate(${rotation}deg)`;
        setZoomLevel(boundedScale);
    }, [getFitMetrics, rotation]);

    /** Reset the image to its base scale and position. */
    const resetTransform = useCallback(() => {
        applyTransform(1, 0, 0);
    }, [applyTransform]);

    /** Reset the rotation and view state of the image. */
    const resetViewState = useCallback(() => {
        requestAnimationFrame(() => {
            setRotation(0);
            applyTransform(1, 0, 0);
        });
    }, [applyTransform]);

    /** Zoom into the image at a specific screen point. */
    const zoomAtPoint = useCallback((clientX: number, clientY: number, deltaScale: number) => {
        const stage = stageRef.current;
        if (!stage) return;

        const rect = stage.getBoundingClientRect();
        const pointX = clientX - rect.left - rect.width / 2;
        const pointY = clientY - rect.top - rect.height / 2;

        const current = transformRef.current;
        const nextScale = clamp(current.scale + deltaScale, MIN_ZOOM, MAX_ZOOM);
        const ratio = nextScale / current.scale;
        const nextX = pointX - (pointX - current.x) * ratio;
        const nextY = pointY - (pointY - current.y) * ratio;
        applyTransform(nextScale, nextX, nextY);
    }, [applyTransform]);

    useEffect(() => {
        if (isOpen) {
            dispatch({ type: "SET_INDEX", payload: Math.max(0, Math.min(initialIndex, items.length - 1)) });
            resetViewState();
        }
    }, [isOpen, initialIndex, items.length, resetViewState]);

    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    /** Exit fullscreen mode if active. */
    const exitFullscreenIfNeeded = useCallback(async () => {
        const docWithWebkit = document as Document & {
            webkitExitFullscreen?: () => Promise<void> | void;
            webkitFullscreenElement?: Element | null;
        };
        const activeElement = document.fullscreenElement || docWithWebkit.webkitFullscreenElement;
        if (!activeElement) return;

        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (docWithWebkit.webkitExitFullscreen) {
                await docWithWebkit.webkitExitFullscreen();
            }
        } catch {
            // Fallback to overlay-only close flow
        }
    }, []);

    /** Close the image viewer and exit fullscreen. */
    const handleClose = useCallback(async () => {
        await exitFullscreenIfNeeded();
        onClose();
    }, [exitFullscreenIfNeeded, onClose]);

    /** Enter fullscreen mode if supported by the browser. */
    const enterFullscreenIfPossible = useCallback(async () => {
        const element = viewerRef.current as (HTMLDivElement & {
            webkitRequestFullscreen?: () => Promise<void> | void;
        }) | null;
        if (!element) return;

        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            }
        } catch {
            // Keep overlay fallback if browser rejects fullscreen.
        }
    }, []);

    /** Toggle between fullscreen and windowed mode. */
    const toggleFullscreen = useCallback(async () => {
        if (isFullscreenActive) {
            await exitFullscreenIfNeeded();
            return;
        }
        await enterFullscreenIfPossible();
    }, [isFullscreenActive, exitFullscreenIfNeeded, enterFullscreenIfPossible]);

    useEffect(() => {
        if (!isOpen) return;

        const element = viewerRef.current as (HTMLDivElement & {
            webkitRequestFullscreen?: () => Promise<void> | void;
        }) | null;
        const docWithWebkit = document as Document & {
            webkitFullscreenElement?: Element | null;
        };

        const onFullscreenChange = () => {
            const activeElement = document.fullscreenElement || docWithWebkit.webkitFullscreenElement;
            const active = activeElement === element;
            setIsFullscreenActive(active);
            if (!active) {
                onClose();
            }
        };

        void enterFullscreenIfPossible();
        document.addEventListener("fullscreenchange", onFullscreenChange);
        document.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);

        return () => {
            document.removeEventListener("fullscreenchange", onFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
            void exitFullscreenIfNeeded();
        };
    }, [isOpen, onClose, enterFullscreenIfPossible, exitFullscreenIfNeeded]);

    const current = items[state.index];
    const hasItems = items.length > 0;

    /** Generate the API URL for a given image item. */
    const getImageUrl = useCallback((item: ImageViewerItem) => {
        const base = import.meta.env.VITE_API_BASE_URL;
        const query = new URLSearchParams({
            provider: item.provider,
            file_name: item.name,
        });
        if (token) query.set("token", token);
        return `${base}/images/${encodeURIComponent(item.id)}?${query.toString()}`;
    }, [token]);

    const touchCache = (url: string) => {
        const existing = imageCacheRef.current.get(url);
        if (!existing) return;
        existing.lastUsed = Date.now();
        imageCacheRef.current.set(url, existing);
    };

    /** Preload an image URL into the cache. */
    const preloadImage = useCallback((url: string): Promise<void> => {
        const existing = imageCacheRef.current.get(url);
        if (existing?.status === "loaded") {
            touchCache(url);
            return Promise.resolve();
        }
        if (existing?.status === "loading") {
            touchCache(url);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const img = new Image();
            imageCacheRef.current.set(url, {
                status: "loading",
                img,
                lastUsed: Date.now(),
            });

            img.onload = () => {
                imageCacheRef.current.set(url, {
                    status: "loaded",
                    img,
                    lastUsed: Date.now(),
                });
                resolve();
            };
            img.onerror = () => {
                imageCacheRef.current.set(url, {
                    status: "error",
                    lastUsed: Date.now(),
                });
                resolve();
            };

            img.src = url;
        });
    }, []);

    /** Schedule a task to run during idle time or as a microtask. */
    const scheduleIdle = useCallback((task: () => void) => {
        type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;
        const win = window as Window & {
            requestIdleCallback?: (cb: IdleCallback) => number;
        };

        if (typeof win.requestIdleCallback === "function") {
            const handle = win.requestIdleCallback(() => task());
            pendingIdleHandlesRef.current.push(handle);
            return;
        }

        const timeoutHandle = window.setTimeout(task, 0);
        pendingIdleHandlesRef.current.push(timeoutHandle);
    }, []);

    const currentUrl = useMemo(() => {
        if (!current) return "";
        return getImageUrl(current);
    }, [current, getImageUrl]);

    if (prevUrl !== currentUrl) {
        setPrevUrl(currentUrl);
        setFallbackUrl(null);
    }

    const displaySrc = fallbackUrl || currentUrl;

    useEffect(() => {
        if (!isOpen || !hasItems) return;
        const start = Math.max(0, state.index - 5);
        const end = Math.min(items.length - 1, state.index + 5);
        const preloadTargets: string[] = [];
        for (let i = start; i <= end; i += 1) {
            if (i === state.index) continue;
            preloadTargets.push(getImageUrl(items[i]));
        }

        scheduleIdle(() => {
            preloadTargets.forEach((url) => {
                if (!imageCacheRef.current.has(url)) {
                    void preloadImage(url);
                } else {
                    touchCache(url);
                }
            });
        });

        return () => {
            pendingIdleHandlesRef.current.forEach((handle) => window.clearTimeout(handle));
            pendingIdleHandlesRef.current = [];
        };
    }, [isOpen, hasItems, items, state.index, getImageUrl, preloadImage, scheduleIdle]);

    useEffect(() => {
        if (!isOpen || !currentUrl) return;

        let cancelled = false;
        const cached = imageCacheRef.current.get(currentUrl);
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        if (cached?.status === "loaded") {
            touchCache(currentUrl);
            dispatch({ type: "LOAD_SUCCESS" });
            return;
        }

        dispatch({ type: "LOAD_START" });
        void preloadImage(currentUrl).then(() => {
            if (cancelled) return;
            const entry = imageCacheRef.current.get(currentUrl);
            if (entry?.status === "loaded") {
                dispatch({ type: "LOAD_SUCCESS" });
            } else {
                dispatch({ type: "LOAD_ERROR", payload: "Failed to load image" });
            }
        });

        return () => {
            cancelled = true;
        };
    }, [isOpen, currentUrl, preloadImage]);

    useEffect(() => {
        if (!isOpen) return;
        resetViewState();
        blobFallbackTriedRef.current.delete(currentUrl);
    }, [state.index, isOpen, currentUrl, resetViewState]);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        applyTransform(transformRef.current.scale, transformRef.current.x, transformRef.current.y);
    }, [rotation, isOpen, applyTransform]);

    /** Navigate to the next image in the collection. */
    const handleNext = useCallback(() => {
        if (state.index >= items.length - 1) return;
        resetViewState();
        dispatch({ type: "SET_INDEX", payload: state.index + 1 });
    }, [state.index, items.length, resetViewState]);

    /** Navigate to the previous image in the collection. */
    const handlePrev = useCallback(() => {
        if (state.index <= 0) return;
        resetViewState();
        dispatch({ type: "SET_INDEX", payload: state.index - 1 });
    }, [state.index, resetViewState]);

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                void handleClose();
                return;
            }
            if (event.key === "ArrowRight" && state.index < items.length - 1) {
                handleNext();
            }
            if (event.key === "ArrowLeft" && state.index > 0) {
                handlePrev();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, state.index, items.length, handleClose, handleNext, handlePrev]);

    const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
        if (!event.ctrlKey) return;
        event.preventDefault();
        const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        zoomAtPoint(event.clientX, event.clientY, delta);
    };

    const handlePointerDown: React.PointerEventHandler<HTMLImageElement> = (event) => {
        if (!current) return;
        pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (pointersRef.current.size === 2) {
            const values = Array.from(pointersRef.current.values());
            const dx = values[0].x - values[1].x;
            const dy = values[0].y - values[1].y;
            pinchStartDistanceRef.current = Math.hypot(dx, dy);
            pinchStartScaleRef.current = transformRef.current.scale;
        }

        if (transformRef.current.scale > 1) {
            dragRef.current = {
                active: true,
                pointerId: event.pointerId,
                lastX: event.clientX,
                lastY: event.clientY,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
        }
    };

    const handlePointerMove: React.PointerEventHandler<HTMLImageElement> = (event) => {
        if (!current) return;

        if (pointersRef.current.has(event.pointerId)) {
            pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }

        if (pointersRef.current.size === 2 && pinchStartDistanceRef.current) {
            const values = Array.from(pointersRef.current.values());
            const dx = values[0].x - values[1].x;
            const dy = values[0].y - values[1].y;
            const distance = Math.hypot(dx, dy);
            const scaleMultiplier = distance / pinchStartDistanceRef.current;
            const nextScale = clamp(pinchStartScaleRef.current * scaleMultiplier, MIN_ZOOM, MAX_ZOOM);
            applyTransform(nextScale, transformRef.current.x, transformRef.current.y);
            return;
        }

        if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;
        if (transformRef.current.scale <= 1) return;

        const dx = event.clientX - dragRef.current.lastX;
        const dy = event.clientY - dragRef.current.lastY;
        dragRef.current.lastX = event.clientX;
        dragRef.current.lastY = event.clientY;

        const currentTransform = transformRef.current;
        applyTransform(currentTransform.scale, currentTransform.x + dx, currentTransform.y + dy);
    };

    const clearPointer = (pointerId: number) => {
        pointersRef.current.delete(pointerId);
        if (pointersRef.current.size < 2) {
            pinchStartDistanceRef.current = null;
        }
        if (dragRef.current.pointerId === pointerId) {
            dragRef.current.active = false;
            dragRef.current.pointerId = null;
        }
    };

    const handlePointerUp: React.PointerEventHandler<HTMLImageElement> = (event) => {
        clearPointer(event.pointerId);
    };

    const handleDoubleClick: React.MouseEventHandler<HTMLImageElement> = (event) => {
        const targetScale = transformRef.current.scale > 1 ? 1 : 2;
        const delta = targetScale - transformRef.current.scale;
        zoomAtPoint(event.clientX, event.clientY, delta);
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    /** Attempt to fetch the image as a blob if the direct URL fails. */
    const tryBlobFallback = useCallback(async (url: string) => {
        if (!url || blobFallbackTriedRef.current.has(url)) return;
        blobFallbackTriedRef.current.add(url);

        try {
            const response = await fetch(url, { method: "GET" });
            if (!response.ok) {
                console.error("[ImageViewer] Blob fallback failed with status", response.status, url);
                return;
            }

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.startsWith("image/")) {
                console.error("[ImageViewer] Blob fallback content-type is not image", contentType, url);
                return;
            }

            const blob = await response.blob();
            if (blob.size <= 0) {
                console.error("[ImageViewer] Blob fallback returned empty payload", url);
                return;
            }

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
            const objectUrl = URL.createObjectURL(blob);
            objectUrlRef.current = objectUrl;
            setFallbackUrl(objectUrl);
            dispatch({ type: "LOAD_START" });
        } catch (error) {
            console.error("[ImageViewer] Blob fallback error", error);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const showControls = () => {
            setIsControlsVisible(true);
            if (hideControlsTimerRef.current) {
                window.clearTimeout(hideControlsTimerRef.current);
            }
            hideControlsTimerRef.current = window.setTimeout(() => {
                setIsControlsVisible(false);
            }, 1800);
        };

        const onMouseMove = (event: MouseEvent) => {
            if (event.clientY <= 80) {
                showControls();
                return;
            }
            showControls();
        };

        showControls();
        window.addEventListener("mousemove", onMouseMove);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            if (hideControlsTimerRef.current) {
                window.clearTimeout(hideControlsTimerRef.current);
                hideControlsTimerRef.current = null;
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            ref={viewerRef}
            role="dialog"
            aria-modal="true"
            onClick={() => void handleClose()}
            style={{
                position: "fixed",
                inset: 0,
                background: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3000,
                opacity: 1,
                animation: "imageViewerFadeIn 180ms ease",
                transition: "opacity 180ms ease",
            }}
        >
            <style>
                {`
                @keyframes imageViewerFadeIn { from { opacity: 0; } to { opacity: 1; } }
                .viewer-controls {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 16px;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 180ms ease;
                    z-index: 10000;
                }
                .viewer-controls.visible {
                    opacity: 1;
                    pointer-events: auto;
                }
                .viewer-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .viewer-icon-btn {
                    width: 34px;
                    height: 34px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255,255,255,0.25);
                    border-radius: 8px;
                    background: rgba(22,22,22,0.78);
                    color: #f3f6ff;
                    font-size: 18px;
                    cursor: pointer;
                }
                .viewer-icon-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .viewer-counter {
                    color: #f3f6ff;
                    font-size: 13px;
                    min-width: 72px;
                    text-align: center;
                }
                `}
            </style>
            <div
                className="viewer-shell"
                onClick={(e) => e.stopPropagation()}
                style={{ width: "100vw", height: "100vh", position: "relative" }}
            >
                <div className={`viewer-controls ${isControlsVisible ? "visible" : ""}`} onClick={(e) => e.stopPropagation()}>
                    <div className="viewer-group">
                        <button className="viewer-icon-btn" aria-label="Close" onClick={(e) => { e.stopPropagation(); void handleClose(); }}>✕</button>
                        <button className="viewer-icon-btn" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={state.index === 0}>←</button>
                        <button className="viewer-icon-btn" aria-label="Next image" onClick={(e) => { e.stopPropagation(); handleNext(); }} disabled={state.index >= items.length - 1}>→</button>
                    </div>
                    <div className="viewer-group">
                        <button className="viewer-icon-btn" aria-label="Zoom out" onClick={(e) => { e.stopPropagation(); applyTransform(transformRef.current.scale - ZOOM_STEP, transformRef.current.x, transformRef.current.y); }}>−</button>
                        <button className="viewer-icon-btn" aria-label="Zoom in" onClick={(e) => { e.stopPropagation(); applyTransform(transformRef.current.scale + ZOOM_STEP, transformRef.current.x, transformRef.current.y); }}>+</button>
                        <button className="viewer-icon-btn" aria-label="Reset transform" onClick={(e) => { e.stopPropagation(); resetTransform(); setRotation(0); }}>⟳</button>
                        <button className="viewer-icon-btn" aria-label="Rotate clockwise" onClick={(e) => { e.stopPropagation(); handleRotate(); }}>↻</button>
                    </div>
                    <div className="viewer-group">
                        <span className="viewer-counter">{hasItems ? `${state.index + 1} / ${items.length}` : "0 / 0"}</span>
                        <button className="viewer-icon-btn" aria-label="Toggle fullscreen" onClick={(e) => { e.stopPropagation(); void toggleFullscreen(); }}>
                            {isFullscreenActive ? "⤢" : "⤢"}
                        </button>
                    </div>
                </div>

                <div
                    ref={stageRef}
                    onWheel={handleWheel}
                    style={{
                        width: "100vw",
                        height: "100vh",
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 0,
                        background: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        touchAction: "none",
                    }}
                >
                    {state.loading && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#d9e4ff" }}>
                            Loading image...
                        </div>
                    )}
                    {state.error && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffb4b4" }}>
                            {state.error}
                        </div>
                    )}
                    {current && (
                        <img
                            ref={imageRef}
                            key={current.id}
                            src={displaySrc || currentUrl}
                            alt={current.name}
                            loading="lazy"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            onDoubleClick={handleDoubleClick}
                            onLoad={() => {
                                resetTransform();
                                requestAnimationFrame(() => applyTransform(1, 0, 0));
                                dispatch({ type: "LOAD_SUCCESS" });
                            }}
                            onError={() => {
                                console.error("[ImageViewer] Image failed", {
                                    url: displaySrc || currentUrl,
                                    currentUrl,
                                });
                                void tryBlobFallback(currentUrl);
                                dispatch({ type: "LOAD_ERROR", payload: "Failed to load image" });
                            }}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                                transform: `translate3d(0px, 0px, 0) scale(1) rotate(${rotation}deg)`,
                                transformOrigin: "center center",
                                transition: "transform 140ms ease-out, opacity 180ms ease",
                                opacity: state.loading ? 0 : 1,
                                willChange: "transform",
                                cursor: zoomLevel > 1 ? "grab" : "zoom-in",
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
