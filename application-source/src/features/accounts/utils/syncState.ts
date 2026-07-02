/**
 * Shared state for tracking active sync operations across the app.
 * Extended to support multiple concurrent sync types (incremental, deep, maintenance, thumbnails).
 */

type SyncType = 'thumbnails' | 'incremental' | 'deep' | 'maintenance';

class SyncStateManager {
    private activeSyncTypes: Set<SyncType> = new Set();
    private listeners: ((isActive: boolean) => void)[] = [];

    getIsMonitoring(): boolean {
        return this.activeSyncTypes.size > 0;
    }

    startMonitoring(type: SyncType): void {
        this.activeSyncTypes.add(type);
        this.notify();
    }

    stopMonitoring(type: SyncType): void {
        this.activeSyncTypes.delete(type);
        this.notify();
    }

    isTypeActive(type: SyncType): boolean {
        return this.activeSyncTypes.has(type);
    }

    subscribe(listener: (isActive: boolean) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify(): void {
        const isActive = this.activeSyncTypes.size > 0;
        this.listeners.forEach(l => l(isActive));
    }
}

export const syncStateManager = new SyncStateManager();
