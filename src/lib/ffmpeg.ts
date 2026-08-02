import { FFmpeg } from '@ffmpeg/ffmpeg';

const coreURL = '/ffmpeg/ffmpeg-core.js?url';
const wasmURL = '/ffmpeg/ffmpeg-core.wasm?url';

export class FFmpegManager {
  private static instance: FFmpegManager;
  private ffmpeg: FFmpeg | null = null;
  private loadPromise: Promise<FFmpeg> | null = null;
  private fsMutex: Promise<void> = Promise.resolve();
  private loadedSources = new Set<string>();
  private activeMounts = new Set<string>();

  private constructor() {}

  public static getInstance(): FFmpegManager {
    if (!FFmpegManager.instance) {
      FFmpegManager.instance = new FFmpegManager();
    }
    return FFmpegManager.instance;
  }

  public async getFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const ff = new FFmpeg();
        console.log("Loading FFmpeg singleton...");
        try {
          await ff.load({
            coreURL,
            wasmURL,
          });
          this.ffmpeg = ff;
          return ff;
        } catch (e: any) {
          throw new Error(`ff.load error: ${e.message}`);
        }
      })();
    }

    const ff = await this.loadPromise;
    if (onProgress) {
        // clear previous progress listeners to avoid memory leaks if setting a new one
        ff.off('progress', () => {}); 
        ff.on('progress', ({ progress }) => {
            onProgress(Math.round(progress * 100));
        });
    }
    return ff;
  }

  public async cleanupStaleMounts(ff: FFmpeg) {
    if (this.activeMounts.size === 0) return;
    console.log(`Cleaning up ${this.activeMounts.size} stale WORKERFS mounts...`);
    for (const mount of Array.from(this.activeMounts)) {
      try {
        await ff.unmount(mount);
        await ff.deleteDir(mount);
      } catch (e) {
        console.warn(`Failed to cleanup stale mount ${mount}`, e);
      }
    }
    this.activeMounts.clear();
  }

  public async mountWorkerFs(ff: FFmpeg, file: File): Promise<string> {
    const workerFsMountPoint = `/mnt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Attempting WORKERFS mount for: ${file.name} at ${workerFsMountPoint}`);
    await ff.createDir(workerFsMountPoint);
    await ff.mount("WORKERFS" as any, { files: [file] }, workerFsMountPoint);
    this.activeMounts.add(workerFsMountPoint);
    return workerFsMountPoint;
  }

  public async unmountWorkerFs(ff: FFmpeg, mountPoint: string) {
    if (!this.activeMounts.has(mountPoint)) return;
    try {
      await ff.unmount(mountPoint);
      await ff.deleteDir(mountPoint);
      this.activeMounts.delete(mountPoint);
    } catch (e) {
      console.warn(`Failed to unmount WORKERFS at ${mountPoint}`, e);
    }
  }

  // Queue FS operations
  public async enqueueFS<T>(operation: (ff: FFmpeg) => Promise<T>): Promise<T> {
    const ff = await this.getFFmpeg();
    
    const task = this.fsMutex.then(async () => {
      await this.cleanupStaleMounts(ff);
      return operation(ff);
    });
    this.fsMutex = task.catch(() => {}) as Promise<void>;
    return task;
  }

  public isSourceLoaded(sourceId: string): boolean {
    return this.loadedSources.has(sourceId);
  }

  public markSourceLoaded(sourceId: string) {
    this.loadedSources.add(sourceId);
  }
}
