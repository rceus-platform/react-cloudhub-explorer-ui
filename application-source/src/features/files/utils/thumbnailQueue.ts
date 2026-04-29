/**
 * Global Thumbnail Generation Queue
 *
 * Responsibilities:
 * - Process thumbnail generation with provider-aware rate limiting
 * - Protect MEGA accounts from blocks (strict 1-at-a-time + cooldown)
 * - Allow fast parallel generation for safe providers (GDrive)
 */

import { captureVideoFrame, resizeImage } from "./thumbnailGenerator";
import { updateThumbnail } from "../services/fileService";

type Task = {
    fileId: string;
    provider: string;
    streamUrl: string;
    isVideo: boolean;
    onComplete: () => void;
    onError: (err: Error) => void;
};

/** Per-provider concurrency and cooldown configuration */
const PROVIDER_LIMITS: Record<string, { concurrency: number; cooldownMs: number }> = {
    mega:   { concurrency: 1, cooldownMs: 2000 },
    gdrive: { concurrency: 6, cooldownMs: 0 },
};

const DEFAULT_LIMIT = { concurrency: 2, cooldownMs: 1000 };

class ThumbnailQueue {
    private queues = new Map<string, Task[]>();
    private activeCounts = new Map<string, number>();
    private failedFileIds = new Set<string>();
    private consecutiveFailures = new Map<string, number>();

    async add(task: Task) {
        if (this.failedFileIds.has(task.fileId)) return;

        const queue = this.queues.get(task.provider) ?? [];
        if (queue.find(t => t.fileId === task.fileId)) return;

        queue.push(task);
        this.queues.set(task.provider, queue);
        this.processProvider(task.provider);
    }

    private async processProvider(provider: string) {
        const limit = PROVIDER_LIMITS[provider] ?? DEFAULT_LIMIT;
        const queue = this.queues.get(provider) ?? [];
        const active = this.activeCounts.get(provider) ?? 0;

        if (active >= limit.concurrency || queue.length === 0) return;

        const task = queue.shift()!;
        this.activeCounts.set(provider, active + 1);

        try {
            // Use the right capture method: <img> for images, <video> for videos
            let resultBlob: Blob;
            let resultDuration: number | undefined;

            if (task.isVideo) {
                const capture = await Promise.race([
                    captureVideoFrame(task.streamUrl, 10),
                    new Promise<{blob: Blob, duration: number}>((_, reject) =>
                        setTimeout(() => reject(new Error("Generation Timeout")), 20000)
                    ),
                ]);
                resultBlob = capture.blob;
                resultDuration = capture.duration;
            } else {
                resultBlob = await Promise.race([
                    resizeImage(task.streamUrl),
                    new Promise<Blob>((_, reject) =>
                        setTimeout(() => reject(new Error("Generation Timeout")), 20000)
                    ),
                ]);
            }

            const uploadFile = new File([resultBlob], "thumb.jpg", { type: "image/jpeg" });
            await updateThumbnail(task.fileId, task.provider, { file: uploadFile, duration: resultDuration });
            task.onComplete();
            // Reset consecutive failures on success
            this.consecutiveFailures.set(provider, 0);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(`[ThumbnailQueue] ${provider}/${task.fileId}:`, error.message);
            this.failedFileIds.add(task.fileId);
            task.onError(error);

            // Track consecutive failures — back off with longer cooldowns
            const failures = (this.consecutiveFailures.get(provider) ?? 0) + 1;
            this.consecutiveFailures.set(provider, failures);
            if (failures >= 3) {
                console.warn(`[ThumbnailQueue] ${provider}: ${failures} consecutive failures, increasing cooldown`);
            }
        } finally {
            this.activeCounts.set(provider, (this.activeCounts.get(provider) ?? 1) - 1);

            // Apply cooldown — increases after consecutive failures (backoff)
            const failures = this.consecutiveFailures.get(provider) ?? 0;
            const baseCooldown = (PROVIDER_LIMITS[provider] ?? DEFAULT_LIMIT).cooldownMs;
            const cooldown = failures >= 3 ? Math.min(baseCooldown * failures, 30000) : baseCooldown;

            if (cooldown > 0) {
                setTimeout(() => this.processProvider(provider), cooldown);
            } else {
                this.processProvider(provider);
            }
        }
    }
}

export const thumbnailQueue = new ThumbnailQueue();
