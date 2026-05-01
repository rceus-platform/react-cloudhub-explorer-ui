/**
 * Shared state for tracking if we should be actively monitoring background sync.
 * This prevents unnecessary polling of the sync status until a sync is actually triggered.
 */

class SyncStateManager {
    private isMonitoring = false;
    private listeners: ((state: boolean) => void)[] = [];

    getIsMonitoring() {
        return this.isMonitoring;
    }

    startMonitoring() {
        this.isMonitoring = true;
        this.notify();
    }

    stopMonitoring() {
        this.isMonitoring = false;
        this.notify();
    }

    subscribe(listener: (state: boolean) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.isMonitoring));
    }
}

export const syncStateManager = new SyncStateManager();
