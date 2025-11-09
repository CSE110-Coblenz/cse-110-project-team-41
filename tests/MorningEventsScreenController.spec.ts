import { describe, expect, it, vi } from "vitest";
import type { ScreenSwitcher } from "../src/types.ts";
import { GameStatusController } from "../src/controllers/GameStatusController.ts";
import type { AudioManager } from "../src/services/AudioManager.ts";
import type { View } from "../src/types.ts";

class FakeGroup {
	private visibleState = false;

	visible(next?: boolean): boolean {
		if (typeof next === "boolean") {
			this.visibleState = next;
		}
		return this.visibleState;
	}

	getLayer(): { draw: () => void } {
		return {
			draw: () => {
				// no-op
			},
		};
	}
}

class FakeView implements View {
	private group = new FakeGroup();
	updateDay = vi.fn();
	updateMoney = vi.fn();
	updateInventory = vi.fn();
	setInfoText = vi.fn();
	clearQuiz = vi.fn();

	show(): void {
		this.group.visible(true);
	}

	hide(): void {
		this.group.visible(false);
	}

	getGroup(): FakeGroup {
		return this.group;
	}
}

let latestView: FakeView | null = null;

vi.mock("../src/screens/MorningEventsScreen/MorningEventsScreenView.ts", () => ({
	MorningEventsScreenView: vi.fn(() => {
		latestView = new FakeView();
		return latestView;
	}),
}));

vi.mock("../src/controllers/QuizController.ts", () => ({
	QuizController: vi.fn(() => ({
		ensureFactForDay: vi.fn(() => ({
			fact: "Test fact",
			question: "Test question?",
			choices: ["A", "B", "C", "D"],
			correctIndex: 0,
		})),
		getDueQuiz: vi.fn(() => null),
		completeQuiz: vi.fn(),
	})),
}));

import { MorningEventsScreenController } from "../src/screens/MorningEventsScreen/MorningEventsScreenController.ts";

const createAudioStub = (): AudioManager =>
	({
		playSfx: vi.fn(),
		playBgm: vi.fn(),
		setBgmPath: vi.fn(),
		setMusicVolume: vi.fn(),
		getMusicVolume: vi.fn(),
		setSfxVolume: vi.fn(),
		getSfxVolume: vi.fn(),
		stopBgm: vi.fn(),
	}) as unknown as AudioManager;

const createController = () => {
	const switcher: ScreenSwitcher = {
		switchToScreen: vi.fn(),
	};
	const status = new GameStatusController();
	const audio = createAudioStub();
	const controller = new MorningEventsScreenController(switcher, status, audio);
	return { controller, status, switcher, audio };
};

describe("MorningEventsScreenController", () => {
	it("buys crops when affordable", () => {
		const { controller, status } = createController();
		status.addMoney(20);
		(controller as unknown as { handleBuy(): void }).handleBuy();
		expect(status.getMoney()).toBe(10);
		expect(status.getItemCount("crop")).toBe(1);
	});

	it("sells crops when available", () => {
		const { controller, status } = createController();
		status.addToInventory("crop", 2);
		(controller as unknown as { handleSell(): void }).handleSell();
		expect(status.getItemCount("crop")).toBe(1);
		expect(status.getMoney()).toBe(5);
	});

	it("calls overlay close callback when continuing from overlay", () => {
		const { controller } = createController();
		const onClose = vi.fn();

		controller.showOverlay(onClose);
		(controller as unknown as { handleContinue(): void }).handleContinue();

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(controller.getView().getGroup().visible()).toBe(false);
	});
});

