export type BgmKey = "menu" | "farm" | "morning" | "gameover";
export type SfxKey = "squeeze" | "harvest" | "buy" | "sell" | "gameover"|"run"|"shoot";

/**
 * Centralized audio manager for background music and sound effects.
 * - Persists volume settings in localStorage
 * - Gracefully no-ops if an asset path is not provided
 */
export class AudioManager {
    private static SFX_VOLUME_KEY = "audio:sfxVolume";
    private static MUSIC_VOLUME_KEY = "audio:musicVolume";

    private sfxVolume: number;
    private musicVolume: number;

    private bgmEl: HTMLAudioElement | null = null;
    private currentBgmKey: BgmKey | null = null;
    private runningSfxEl: HTMLAudioElement | null = null;

    // Map scene keys to bgm paths. Replace with real assets when available.
    private bgmPaths: Partial<Record<BgmKey, string>> = {
        // "menu": "/menu-bgm.mp3",
        // "farm": "/farm-bgm.mp3",
        // "morning": "/morning-bgm.mp3",
        // "gameover": "/gameover-bgm.mp3",
    };

    // Map sfx keys to asset paths (reusing placeholders for now)
    private sfxPaths: Record<SfxKey, string> = {
        squeeze: "/squeeze.mp3",
        harvest: "/squeeze.mp3",
        buy: "/squeeze.mp3",
        sell: "/squeeze.mp3",
        gameover: "/gameover.mp3",
        run: "/running.wav",
        shoot: "/shoot.mp3",
    };

    constructor() {
        const sfx = Number(localStorage.getItem(AudioManager.SFX_VOLUME_KEY));
        const music = Number(localStorage.getItem(AudioManager.MUSIC_VOLUME_KEY));
        this.sfxVolume = isNaN(sfx) ? 0.7 : Math.min(Math.max(sfx, 0.1), 1);
        this.musicVolume = isNaN(music) ? 0.5 : Math.min(Math.max(music, 0.1), 1);
    }

    setMusicVolume(v: number): void {
        this.musicVolume = Math.min(Math.max(v, 0), 1);
        localStorage.setItem(AudioManager.MUSIC_VOLUME_KEY, String(this.musicVolume));
        if (this.bgmEl) {
            this.bgmEl.volume = this.musicVolume;
        }
    }

    getMusicVolume(): number { return this.musicVolume; }

    setSfxVolume(v: number): void {
        this.sfxVolume = Math.min(Math.max(v, 0), 1);
        localStorage.setItem(AudioManager.SFX_VOLUME_KEY, String(this.sfxVolume));
    }

    getSfxVolume(): number { return this.sfxVolume; }

    setBgmPath(key: BgmKey, path: string): void {
        this.bgmPaths[key] = path;
    }

    playBgm(key: BgmKey): void {
        if (this.currentBgmKey === key) {
            return;
        }
        this.stopBgm();
        const path = this.bgmPaths[key];
        if (!path) {
            this.currentBgmKey = null;
            return; // No bgm configured
        }
        const el = new Audio(path);
        el.loop = true;
        el.volume = this.musicVolume;
        // Autoplay may be blocked until user interaction; that's fine.
        el.play().catch(() => { /* ignore autoplay errors */ });
        this.bgmEl = el;
        this.currentBgmKey = key;
    }

    stopBgm(): void {
        if (this.bgmEl) {
            try { this.bgmEl.pause(); } catch {}
        }
        this.bgmEl = null;
        this.currentBgmKey = null;
    }

    playSfx(key: SfxKey): void {
        const path = this.sfxPaths[key];
        if (!path) return;
        const el = new Audio(path);
        el.volume = this.sfxVolume;
        el.play().catch(() => { /* ignore */ });
    }
    startSfxLoop(key: SfxKey): void {
        if (this.runningSfxEl) {
            return; // Already playing
        }
        
        const path = this.sfxPaths[key];
        if (!path) return;
        
        const el = new Audio(path);
        el.loop = true;
        
        el.play().catch(() => { });
        this.runningSfxEl = el;
    }

    stopSfxLoop(): void {
        if (this.runningSfxEl) {
            try { this.runningSfxEl.pause(); } catch {}
            this.runningSfxEl = null;
        }
    }
}

