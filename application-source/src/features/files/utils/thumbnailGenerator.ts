/**
 * Thumbnail Generator Utility
 * 
 * Responsibilities:
 * - Load media streams (video/image) in the browser
 * - Capture frames at specific timestamps using Canvas
 * - Convert captures to Blobs for uploading
 */

/**
 * Capture a frame from a video URL at a specific timestamp
 */
export const captureVideoFrame = (
    url: string,
    timestamp: number
): Promise<{blob: Blob, duration: number}> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = url;
        video.currentTime = timestamp;
        video.muted = true;
        // Optimization: don't preload the whole thing
        video.preload = "metadata";

        const handleCapture = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // Limit maximum size to 1280px width
                if (canvas.width > 1280) {
                    canvas.height = (1280 / canvas.width) * canvas.height;
                    canvas.width = 1280;
                }

                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Could not get canvas context");
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    if (blob) resolve({blob, duration: video.duration});
                    else reject(new Error("Canvas to Blob conversion failed"));
                    cleanup();
                }, "image/jpeg", 0.85);
            } catch (err) {
                reject(err);
                cleanup();
            }
        };

        const onMetadataLoaded = () => {
            // Clamp timestamp to duration (with a small buffer)
            const targetTime = Math.min(timestamp, Math.max(0, video.duration - 0.5));
            video.currentTime = targetTime;
        };

        const cleanup = () => {
            video.removeEventListener("loadedmetadata", onMetadataLoaded);
            video.removeEventListener("seeked", handleCapture);
            video.removeEventListener("error", handleError);
            video.src = "";
            video.load();
        };

        const handleError = () => {
            reject(new Error(`Video load error: ${video.error?.message || "Unknown error"}`));
            cleanup();
        };

        video.addEventListener("loadedmetadata", onMetadataLoaded);
        video.addEventListener("seeked", handleCapture);
        video.addEventListener("error", handleError as EventListener);
        
        // Start loading
        video.load();
    });
};

/**
 * Resize an image from a URL
 */
export const resizeImage = (url: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > 1280) {
                    height = (1280 / width) * height;
                    width = 1280;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Could not get canvas context");

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas to Blob conversion failed"));
                }, "image/jpeg", 0.85);
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => {
            reject(new Error("Image load error"));
        };
    });
};
