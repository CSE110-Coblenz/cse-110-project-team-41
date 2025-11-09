import { beforeEach } from "vitest";

class AudioStub {
	loop = false;
	volume = 1;
	play(): Promise<void> {
		return Promise.resolve();
	}
	pause(): void {
		// no-op for tests
	}
}

Object.defineProperty(globalThis, "Audio", {
	value: AudioStub,
});

beforeEach(() => {
	localStorage.clear();
});

