/**
 * Video Player Feature Types
 *
 * Responsibilities:
 * - Define types for playback state and player parameters
 *
 * Boundaries:
 * - Does not include file library or application-wide types
 */

/** Playback state persisted in the backend */
export interface PlaybackState {
    current_time: number;
    duration: number;
}

/** Parameters required to initialize a stream session */
export interface PlayerParams {
    provider: string;
    fileId: string;
    fileName: string;
    fullPath?: string;
}
