import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScreenSwitcher } from "../src/types.ts";
import { GameStatusController } from "../src/controllers/GameStatusController.ts";
import type { AudioManager } from "../src/services/AudioManager.ts";
import type { FarmPlanterController } from "../src/components/FarmPlanterComponent/FarmPlanterController.ts";
import type { EmuController } from "../src/components/EmuComponent/EmuController.ts";
import type { MorningEventsScreenController } from "../src/screens/MorningEventsScreen/MorningEventsScreenController.ts";

class FakeFarmScreenView {
	private handleStartDay: () => void;
	private registerEmu: (emu: EmuController) => void;
	private removeEmus: () => void;
	spawnEmusMock = vi.fn();
	clearEmusMock = vi.fn();
	spawnedEmus: Array<{ setTarget: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }> = [];
	planters: Array<{
		setOnHarvest: ReturnType<typeof vi.fn>;
		advanceDay: ReturnType<typeof vi.fn>;
		getView: ReturnType<typeof vi.fn>;
	}> = [];
	menuButtonHandler: (() => void) | null = null;
	menuSaveHandler: (() => void) | null = null;
	menuBackHandler: (() => void) | null = null;
	showMenuOverlay = vi.fn();
	hideMenuOverlay = vi.fn();
	deployMineAtMouse = vi.fn();
	clearMines = vi.fn();

	constructor(
		_handleKeydown: (event: KeyboardEvent) => void,
		_handleKeyup: (event: KeyboardEvent) => void,
		handleStartDay: () => void,
		registerEmu: (emu: EmuController) => void,
		removeEmus: () => void,
		registerPlanter: (planter: FarmPlanterController) => void,
	) {
		this.handleStartDay = handleStartDay;
		this.registerEmu = registerEmu;
		this.removeEmus = removeEmus;

		const planterTarget = { id: "planter" };
		const planter = {
			setOnHarvest: vi.fn(),
			advanceDay: vi.fn(),
			getView: vi.fn(() => planterTarget),
			setStatus: vi.fn(),
			setOnPlant: vi.fn(),
		};
		this.planters.push(planter);
		registerPlanter(planter as unknown as FarmPlanterController);
	}

	triggerEndDay(): void {
		this.handleStartDay();
	}

	updateScore = vi.fn();
	updateTimer = vi.fn();
	updateRound = vi.fn();
	updateCropCount = vi.fn();
	updateMineCount = vi.fn();
	movePlayerDelta = vi.fn();
	show = vi.fn();

	getGroup(): { getLayer: () => { draw: () => void } } {
		return {
			getLayer: () => ({ draw: vi.fn() }),
		};
	}

	spawnEmus(count: number): void {
		this.spawnEmusMock(count);
		this.spawnedEmus = [];
		for (let i = 0; i < count; i++) {
			const emu = {
				setTarget: vi.fn(),
				remove: vi.fn(),
			};
			this.spawnedEmus.push(emu);
			this.registerEmu(emu as unknown as EmuController);
		}
	}

	clearEmus(): void {
		this.clearEmusMock();
		this.removeEmus();
	}

	setMenuButtonHandler = vi.fn((handler: () => void) => {
		this.menuButtonHandler = handler;
	});

	setMenuOptionHandlers = vi.fn((onSave: () => void, onBack: () => void) => {
		this.menuSaveHandler = onSave;
		this.menuBackHandler = onBack;
	});

	setDefensePlaceClickHandler = vi.fn();
	setPlanningPhaseMode = vi.fn();
	addDefense = vi.fn();
	clearDefenses = vi.fn();
	setPlacementHint = vi.fn();
	setPlacementCursor = vi.fn();
	getDefensesLayer = vi.fn(() => ({
		add: vi.fn(),
		draw: vi.fn(),
	}));
}

let latestView: FakeFarmScreenView | null = null;

vi.mock("../src/screens/FarmScreen/FarmScreenView.ts", () => ({
	FarmScreenView: vi.fn((
		handleKeydown: (event: KeyboardEvent) => void,
		handleKeyup: (event: KeyboardEvent) => void,
		handleStartDay: () => void,
		registerEmu: (emu: EmuController) => void,
		removeEmus: () => void,
		registerPlanter: (planter: FarmPlanterController) => void,
	) => {
		latestView = new FakeFarmScreenView(handleKeydown, handleKeyup, handleStartDay, registerEmu, removeEmus, registerPlanter);
		return latestView;
	}),
}));

vi.mock("../src/screens/PlanningPhaseScreen/PlanningPhaseController.ts", () => ({
	PlanningPhaseController: vi.fn(() => ({
		getView: vi.fn(() => ({
			getGroup: vi.fn(() => ({
				visible: vi.fn(),
			})),
		})),
		show: vi.fn(),
		hide: vi.fn(),
		setDefenseInventory: vi.fn(),
		setOnDefenseSelected: vi.fn(),
		setOnStartRound: vi.fn(),
		deselectAll: vi.fn(),
		clearSelection: vi.fn(),
	})),
}));

import { FarmScreenController } from "../src/screens/FarmScreen/FarmScreenController.ts";

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
	const controller = new FarmScreenController(switcher, status, audio);
	return { controller, status, audio, switcher };
};

describe("FarmScreenController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		if (typeof localStorage !== "undefined") {
			localStorage.clear();
		}
		latestView = null;
		globalThis.requestAnimationFrame = vi.fn().mockReturnValue(0) as unknown as typeof requestAnimationFrame;
	});

	it("shows the morning overlay at round end and resumes the game after closing", () => {
		const { controller, audio, status } = createController();

		let storedClose: (() => void) | null = null;
		const morningStub = {
			showOverlay: vi.fn((close: () => void) => {
				storedClose = close;
			}),
			setDisplayDayOverride: vi.fn(),
		} as unknown as MorningEventsScreenController;

		controller.setMorningController(morningStub);

		expect(latestView).not.toBeNull();
		expect(latestView?.planters[0]?.setOnHarvest).toHaveBeenCalledTimes(1);

		(controller as unknown as { handleEndDay(): void }).handleEndDay();

		expect(morningStub.showOverlay).toHaveBeenCalledTimes(1);
		expect(audio.playBgm).toHaveBeenNthCalledWith(1, "morning");
		expect(status.getDay()).toBe(2);
		expect(latestView?.spawnEmusMock).toHaveBeenCalledTimes(0);

		expect(storedClose).not.toBeNull();
		storedClose?.();

		// After morning overlay closes, planning phase is shown
		// The test now verifies that the planning phase flow is triggered
		expect(latestView?.planters[0]?.advanceDay).toHaveBeenCalledTimes(1);
		const cropCountMock = latestView?.updateCropCount;
		expect(cropCountMock).toBeDefined();
		expect(cropCountMock?.mock.calls.length ?? 0).toBeGreaterThanOrEqual(1);
	});

	it("returns to menu when the pause overlay exit option is selected", () => {
		const { switcher } = createController();
		expect(latestView).not.toBeNull();

		latestView?.menuButtonHandler?.();
		expect(latestView?.showMenuOverlay).toHaveBeenCalledTimes(1);
		latestView?.menuSaveHandler?.();
		expect(latestView?.hideMenuOverlay).toHaveBeenCalledTimes(1);
		expect(switcher.switchToScreen).toHaveBeenCalledWith({ type: "main_menu" });
	});

	it("resumes the game when the pause overlay back option is selected", () => {
		const { switcher } = createController();
		expect(latestView).not.toBeNull();

		latestView?.menuButtonHandler?.();
		expect(latestView?.showMenuOverlay).toHaveBeenCalledTimes(1);
		latestView?.menuBackHandler?.();
		expect(latestView?.hideMenuOverlay).toHaveBeenCalledTimes(1);
		expect(switcher.switchToScreen).not.toHaveBeenCalled();
	});

	it("deploys a mine when M is pressed and the player has one available", () => {
		const { controller, status } = createController();
		expect(latestView).not.toBeNull();

		status.addToInventory("mine", 1);

		// Mock deployMineAtMouse to return a valid placement
		const mockPlacement = { node: { x: vi.fn(), y: vi.fn() }, size: 30 };
		latestView!.deployMineAtMouse = vi.fn(() => mockPlacement);

		const keyHandler = controller as unknown as { handleKeydown(event: KeyboardEvent): void };
		keyHandler.handleKeydown(new KeyboardEvent("keydown", { key: "m" }));

		expect(status.getItemCount("mine")).toBe(0);
		expect(latestView?.deployMineAtMouse).toHaveBeenCalledTimes(1);
		expect(latestView?.updateMineCount).toHaveBeenCalledWith(0);
	});
});
