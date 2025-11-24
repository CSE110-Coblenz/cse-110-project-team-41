import { FarmEmuController } from "../../components/FarmEmuComponent/FarmEmuController.ts";
import type { FarmPlanterController } from "../../components/FarmPlanterComponent/FarmPlanterController.ts";
import { GAME_DURATION, ONE_OVER_ROOT_TWO, PLAYER_SPEED, GameItem } from "../../constants.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import { AudioManager } from "../../services/AudioManager.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { ScreenController } from "../../types.ts";
import { FarmScreenModel } from "./FarmScreenModel.ts";
import { FarmScreenView } from "./FarmScreenView.ts";
import type { MorningEventsScreenController } from "../MorningEventsScreen/MorningEventsScreenController.ts";
import { PlanningPhaseController } from "../PlanningPhaseScreen/PlanningPhaseController.ts";
import { DefenseController } from "../../components/DefenseComponent/DefenseController.ts";
import type { DefenseType } from "../../components/DefenseComponent/DefenseModel.ts";
import type { Image as KonvaImage } from "konva/lib/shapes/Image";
import type { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import Konva from "konva";

// Helper: Map DefenseType to GameItem
function defenseTypeToGameItem(type: DefenseType): GameItem {
	const mapping: Record<DefenseType, GameItem> = {
		'barbed_wire': GameItem.BarbedWire,
		'sandbag': GameItem.Sandbag,
		'machine_gun': GameItem.MachineGun,
		'mine': GameItem.Mine,
	};
	return mapping[type];
}

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class FarmScreenController extends ScreenController {
	private model: FarmScreenModel;
	private view: FarmScreenView;
	private gameTimer: number | null = null;
	private lastTickTime: number = 0;
	private timeRemaining: number = GAME_DURATION;

	private status: GameStatusController;
	private audio: AudioManager;
	private emus: FarmEmuController[] = [];
	private planters: FarmPlanterController[] = [];
	private morning: MorningEventsScreenController | null = null;
	private planningPhase: PlanningPhaseController | null = null;
	private screenSwitcher: ScreenSwitcher;
	private defenses: DefenseController[] = [];
	private isPlanningPhase: boolean = false;
	private selectedDefenseType: DefenseType | null = null;
	private readonly planningHint = "Select a defense, then press T to place it at the cursor.";

	private playerDirectionX: number = 0;
	private playerDirectionY: number = 0;
	private activeMines: ActiveMine[] = [];

	// private squeezeSound: HTMLAudioElement;

	constructor(_screenSwitcher: ScreenSwitcher, status: GameStatusController, audio: AudioManager) {
		super();
		this.status = status;
		this.audio = audio;
		this.screenSwitcher = _screenSwitcher;

		this.model = new FarmScreenModel();
		this.view = new FarmScreenView(
			(event: KeyboardEvent) => this.handleKeydown(event),
			(event: KeyboardEvent) => this.handleKeyup(event),
			() => this.handleEndDay(),
			() => this.handleEndGame(),
			(emu: FarmEmuController) => this.registerEmu(emu),
			() => this.removeEmus(),
			(planter: FarmPlanterController) => this.registerPlanter(planter),
		);
		this.view.setMenuButtonHandler(() => this.handleMenuButton());
		this.view.setMenuOptionHandlers(
			() => this.handleMenuExit(),
			() => this.handleMenuResume(),
		);

		// Initialize planning phase
		this.planningPhase = new PlanningPhaseController();
		this.planningPhase.setOnStartRound(() => this.handleStartRound());
		this.planningPhase.setOnDefenseSelected((type) => {
			this.handleDefenseSelection(type);
		});

		// Set up defense placement click handler
		this.view.setDefensePlaceClickHandler((x, y) => this.handleDefensePlaceClick(x, y));

		requestAnimationFrame(this.gameLoop);
	}

	setMorningController(controller: MorningEventsScreenController): void {
		this.morning = controller;
	}

	private gameLoop = (timestamp: number): void => {
		const deltaTime: number = (timestamp - this.lastTickTime) * 0.001;
		this.lastTickTime = timestamp;

		if (Math.abs(this.playerDirectionX) + Math.abs(this.playerDirectionY) == 2) {
			this.view.movePlayerDelta(
				this.playerDirectionX * PLAYER_SPEED * deltaTime * ONE_OVER_ROOT_TWO,
				this.playerDirectionY * PLAYER_SPEED * deltaTime * ONE_OVER_ROOT_TWO
			);
		} else {
			this.view.movePlayerDelta(
				this.playerDirectionX * PLAYER_SPEED * deltaTime,
				this.playerDirectionY * PLAYER_SPEED * deltaTime
			);
		}

		this.checkMineCollisions();
		this.checkEmuCropCollisions();
		this.checkDefenseEmuInteractions(deltaTime);

		// Request the next frame
		requestAnimationFrame(this.gameLoop);
	}

	/**
	 * Start the game
	 */
	startGame(): void {
		// Reset game status (day, money, inventory, etc.)
		this.status.reset();
		
		// Reset model state
		this.model.reset();
		this.timeRemaining = GAME_DURATION;
		this.defenses = [];
		this.view.clearDefenses();
		this.emus = [];
		this.view.clearEmus();
		this.selectedDefenseType = null;
		this.isPlanningPhase = false;

		// Reset all planters to empty state
		this.planters.forEach((planter) => {
			// Reset planter to empty if it has a crop
			if (!planter.isEmpty()) {
				planter.destroyCrop();
			}
		});

		// Update view
		this.view.updateScore(this.model.getScore());
		this.view.hideMenuOverlay();
		this.resetMines();
		this.view.updateTimer(this.timeRemaining);
		this.updateCropDisplay();
		this.view.show();
		this.view.setPlacementHint();

		// Show morning screen first, then planning phase
		this.handleOpenMarket(() => this.prepareFirstRound());
	}

	private prepareFirstRound(): void {
		// After morning screen closes, prepare for round 1
		this.planters.forEach((planter) => planter.advanceDay());
		this.model.updateSpawn();
		this.resetMines();
		this.updateCropDisplay();
		
		// Now show planning phase
		this.showPlanningPhase();
	}

	private showPlanningPhase(): void {
		this.isPlanningPhase = true;
		this.stopTimer();
		this.view.setPlanningPhaseMode(true);
		this.view.setPlacementCursor(false);
		this.view.setPlacementHint(this.planningHint);
		if (this.planningPhase) {
			this.updatePlanningInventoryDisplay();
			this.planningPhase.clearSelection();
			this.planningPhase.show();
		} else {
			this.selectedDefenseType = null;
		}
	}

	private handleStartRound(): void {
		this.isPlanningPhase = false;
		this.view.setPlanningPhaseMode(false);
		this.view.setPlacementCursor(false);
		this.view.setPlacementHint();
		this.selectedDefenseType = null;
		if (this.planningPhase) {
			this.planningPhase.hide();
		}
		this.startRound();
	}

	private handleDefensePlaceClick(x: number, y: number): void {
		if (!this.isPlanningPhase || !this.selectedDefenseType) {
			return;
		}
		if (this.placeDefenseAt(this.selectedDefenseType, x - 15, y - 15)) {
			this.onDefensePlacedDuringPlanning();
		}
	}

	private handleDefenseSelection(type: DefenseType | null): void {
		if (!this.isPlanningPhase) {
			this.selectedDefenseType = null;
			return;
		}

		if (type && this.status.getItemCount(defenseTypeToGameItem(type)) <= 0) {
			this.view.setPlacementHint(`No ${this.formatDefenseName(type)} remaining. Buy more in the shop.`);
			this.planningPhase?.clearSelection();
			this.view.setPlacementCursor(false);
			this.selectedDefenseType = null;
			return;
		}

		this.selectedDefenseType = type;

		if (type) {
			this.planningPhase?.hide();
			this.view.setPlacementCursor(true);
			this.view.setPlacementHint(`Press T to place ${this.formatDefenseName(type)} at the cursor.`);
		} else {
			this.view.setPlacementCursor(false);
			this.view.setPlacementHint(this.planningHint);
			this.planningPhase?.show();
		}
	}

	private attemptDefensePlacementAtCursor(): void {
		if (!this.isPlanningPhase || !this.selectedDefenseType) {
			return;
		}
		const pointer = this.view.getMousePosition();
		if (!pointer) {
			return;
		}
		if (this.placeDefenseAt(this.selectedDefenseType, pointer.x - 15, pointer.y - 15)) {
			this.onDefensePlacedDuringPlanning();
		}
	}

	private cancelDefensePlacement(): void {
		if (!this.isPlanningPhase || !this.selectedDefenseType) {
			return;
		}
		this.selectedDefenseType = null;
		this.view.setPlacementCursor(false);
		this.view.setPlacementHint(this.planningHint);
		if (this.planningPhase) {
			this.planningPhase.clearSelection();
			this.planningPhase.show();
		}
	}

	private placeDefenseAt(type: DefenseType, x: number, y: number): boolean {
		const item = defenseTypeToGameItem(type);
		if (this.status.getItemCount(item) <= 0) {
			return false;
		}

		const defense = new DefenseController(
			this.view.getDefensesLayer(),
			type,
			x,
			y
		);

		if (this.status.removeFromInventory(item, 1)) {
			this.defenses.push(defense);
			this.view.addDefense(defense.getView());
			this.updatePlanningInventoryDisplay();
			return true;
		}

		defense.remove();
		return false;
	}

	private onDefensePlacedDuringPlanning(): void {
		this.selectedDefenseType = null;
		this.view.setPlacementCursor(false);
		this.view.setPlacementHint(this.planningHint);
		if (this.planningPhase && this.isPlanningPhase) {
			this.planningPhase.clearSelection();
			this.planningPhase.show();
		}
	}

	private updatePlanningInventoryDisplay(): void {
		if (!this.planningPhase) {
			return;
		}
		const defenseInventory: Record<string, number> = {
			barbed_wire: this.status.getItemCount(GameItem.BarbedWire),
			sandbag: this.status.getItemCount(GameItem.Sandbag),
			machine_gun: this.status.getItemCount(GameItem.MachineGun),
		};
		this.planningPhase.setDefenseInventory(defenseInventory);
	}

	/**
	 * Start the round
	 */
	startRound(): void {
		// Update view
		this.view.updateScore(this.model.getScore());
		this.updateCropDisplay();
		this.timeRemaining = GAME_DURATION;
		this.view.hideMenuOverlay();
		this.view.updateTimer(this.timeRemaining);
		this.view.updateRound(this.status.getDay());
		this.view.show();

		this.spawnEmusForCurrentRound();
		this.startTimer();
	}

	/**
	 * Handle player movement
	 */
    private handleKeydown(event: KeyboardEvent): void {
        const key = event.key;
        switch (key) {
            case "w": this.playerDirectionY = -1; break;
            case "s": this.playerDirectionY = 1; break;
            case "d": this.playerDirectionX = 1; break;
            case "a": this.playerDirectionX = -1; break;
            case "m": this.handleDeployMine(); break;
			case "t": this.attemptDefensePlacementAtCursor(); break;
			case "Escape": this.cancelDefensePlacement(); break;
        }
        event.preventDefault();
    }

	/**
	 * Handle player movement
	 */
	private handleKeyup(event: KeyboardEvent): void {
		const key = event.key;
		if (["w", "s"].includes(key)) {
			this.playerDirectionY = 0;
		}
		if (["a", "d"].includes(key)) {
			this.playerDirectionX = 0;
		}
		event.preventDefault();
	}

	/**
	 * Start day
	 */
	private handleEndDay(): void {
		this.endRound();
	}

	private handleEndGame(): void {
		// End game button - trigger game over
		this.stopTimer();
		this.screenSwitcher.switchToScreen({ type: "game_over", score: this.status.getFinalScore() });
	}

	/**
	 * Start the countdown timer
	 */
	private startTimer(): void {
		this.stopTimer();
		const timerId = setInterval(() => {
			if (this.timeRemaining <= 0) {
				this.endRound();
				return;
			}
			this.timeRemaining = Math.max(0, this.timeRemaining - 1);
			this.view.updateTimer(this.timeRemaining);
			if (this.timeRemaining <= 0) {
				this.endRound();
			}
		}, 1000) as unknown as number;
		this.gameTimer = timerId;
	}

	/**
	 * Stop the timer
	 */
	private stopTimer(): void {
		if (!this.gameTimer) {
			return;
		}
		clearInterval(this.gameTimer);
		this.gameTimer = null;
	}

	/**
	 * End the game
	 */
    private endRound(): void {
        this.stopTimer();
        this.view.clearEmus();
        this.status.endDay();
        const newDay = this.status.getDay();
        this.morning?.setDisplayDayOverride(newDay);
        this.handleOpenMarket(() => this.prepareNextRound());
    }

	private prepareNextRound(): void {
		this.planters.forEach((planter) => planter.advanceDay());
		this.model.updateSpawn();
		this.resetMines();
		this.updateCropDisplay();
		this.showPlanningPhase();
	}

	private registerEmu(emu: FarmEmuController): void {
		this.emus.push(emu);
	}

	private removeEmus(): void {
		while(this.emus.length > 0){
			const emu = this.emus.pop();
			if (emu){
				emu.remove();
			}
		}
	}

	private registerPlanter(planter: FarmPlanterController): void {
		this.planters.push(planter);
		planter.setStatus(this.status);
		planter.setOnHarvest(() => {
			this.status.addToInventory(GameItem.Crop, 1);
			this.audio.playSfx("harvest");
			this.updateCropDisplay();
		});
		planter.setOnPlant(() => {
			this.updateCropDisplay();
		});
	}

	private handleMenuButton(): void {
		this.stopTimer();
		this.view.showMenuOverlay();
	}

	private handleMenuExit(): void {
		this.view.hideMenuOverlay();
		this.stopTimer();
		this.screenSwitcher.switchToScreen({ type: "main_menu" });
	}

	private handleMenuResume(): void {
		this.view.hideMenuOverlay();
		if (this.timeRemaining <= 0) {
			this.endRound();
			return;
		}
		this.view.updateTimer(this.timeRemaining);
		this.startTimer();
	}

	private handleOpenMarket(onClose?: () => void): void {
		if (!this.morning) {
			this.handleCloseMarket(onClose);
			return;
		}
		this.audio.playBgm("morning");
		this.morning.showOverlay(() => this.handleCloseMarket(onClose));
	}

	private handleCloseMarket(onClosed?: () => void): void {
		this.audio.playBgm("farm");
		this.updateCropDisplay();
		onClosed?.();
	}

	private spawnEmusForCurrentRound(): void {
		this.view.clearEmus();
		this.view.spawnEmus(this.model.getSpawn());
		if (!this.planters.length) {
			return;
		}

		for (const emu of this.emus) {
			const planter = this.planters[Math.floor(Math.random() * this.planters.length)];
			const target = planter?.getView();
			if (target) {
				emu.setTarget(target);
			}
		}
	}

    private updateCropDisplay(): void {
        this.view.updateCropCount(this.status.getItemCount(GameItem.Crop));
        this.view.updateMineCount(this.status.getItemCount(GameItem.Mine));
    }

	private checkMineCollisions(): void {
		if (!this.activeMines.length || !this.emus.length) {
			return;
		}

		const survivingEmus: FarmEmuController[] = [];
		const triggeredMines = new Set<ActiveMine>();

		for (const emu of this.emus) {
			const emuShape = emu.getView();
			if (!emuShape) {
				continue;
			}

			const mine = this.findCollidingMine(emuShape);
			if (mine) {
				triggeredMines.add(mine);
				emu.remove();
			} else {
				survivingEmus.push(emu);
			}
		}

		if (!triggeredMines.size) {
			return;
		}

		this.emus = survivingEmus;
		const remainingMines: ActiveMine[] = [];
		for (const mine of this.activeMines) {
			if (triggeredMines.has(mine)) {
				this.view.removeMineSprite(mine.node);
			} else {
				remainingMines.push(mine);
			}
		}

		this.activeMines = remainingMines;
	}

	private findCollidingMine(emuShape: KonvaRect | KonvaImage): ActiveMine | null {
		for (const mine of this.activeMines) {
			if (this.rectsOverlap(emuShape, mine)) {
				return mine;
			}
		}
		return null;
	}

	private rectsOverlap(emuShape: KonvaRect | KonvaImage, mine: ActiveMine): boolean {
		const mineX = mine.node.x();
		const mineY = mine.node.y();
		const mineSize = mine.size;
		const emuX = emuShape.x();
		const emuY = emuShape.y();
		const emuWidth = emuShape.width();
		const emuHeight = emuShape.height();

		return !(
			emuX + emuWidth < mineX ||
			emuX > mineX + mineSize ||
			emuY + emuHeight < mineY ||
			emuY > mineY + mineSize
		);
	}

	private checkEmuCropCollisions(): void {
		if (!this.emus.length || !this.planters.length) {
			return;
		}

		for (const emu of this.emus) {
			const emuShape = emu.getView();
			if (!emuShape) {
				continue;
			}

			const emuX = emuShape.x();
			const emuY = emuShape.y();
			const emuWidth = emuShape.width();
			const emuHeight = emuShape.height();

			for (const planter of this.planters) {
				// Skip if planter is empty
				if (planter.isEmpty()) {
					continue;
				}

				const planterRect = planter.getView();
				if (!planterRect) {
					continue;
				}

				const planterX = planterRect.x();
				const planterY = planterRect.y();
				const planterWidth = planterRect.width();
				const planterHeight = planterRect.height();

				// Check collision
				if (
					emuX < planterX + planterWidth &&
					emuX + emuWidth > planterX &&
					emuY < planterY + planterHeight &&
					emuY + emuHeight > planterY
				) {
					// Emu is touching planter - destroy the crop
					planter.destroyCrop();
					this.audio.playSfx("harvest"); // Use harvest sound for crop destruction
				}
			}
		}
	}

	private checkDefenseEmuInteractions(_deltaTime: number): void {
		if (!this.defenses.length || !this.emus.length || this.isPlanningPhase) {
			return;
		}

		// Track active defenses (remove destroyed ones)
		const activeDefenses: DefenseController[] = [];
		const emusToRemove: FarmEmuController[] = [];

		for (const defense of this.defenses) {
			if (!defense.isActive()) {
				continue;
			}
			activeDefenses.push(defense);

			const defenseView = defense.getView();
			if (!defenseView) continue;

			const defenseX = defenseView.x();
			const defenseY = defenseView.y();
			const defenseSize = 30; // Defense size

			for (const emu of this.emus) {
				const emuShape = emu.getView();
				if (!emuShape) continue;

				const emuX = emuShape.x();
				const emuY = emuShape.y();
				const emuWidth = emuShape.width();
				const emuHeight = emuShape.height();

				// Check collision
				const isColliding = (
					emuX < defenseX + defenseSize &&
					emuX + emuWidth > defenseX &&
					emuY < defenseY + defenseSize &&
					emuY + emuHeight > defenseY
				);

				if (!isColliding) continue;

				const defenseType = defense.getType();

				switch (defenseType) {
					case "barbed_wire":
						// Slows emus - handled by reducing movement in emu controller
						// For now, we'll apply a speed reduction effect
						// This is a simple implementation - emus will move slower when touching barbed wire
						break;

					case "sandbag":
						// Blocks emus - emu must destroy it
						defense.takeDamage(1);
						if (!defense.isActive()) {
							// Sandbag destroyed
							defense.remove();
						}
						// Emu is blocked (can't move past)
						break;

					case "machine_gun":
						// Auto-shoots nearby emus
						// Simple implementation: instant kill on contact
						emu.remove();
						emusToRemove.push(emu);
						defense.takeDamage(1);
						if (!defense.isActive()) {
							defense.remove();
						}
						break;

					case "mine":
						// Handled separately in checkMineCollisions
						break;
				}
			}
		}

		// Remove destroyed emus
		for (const emu of emusToRemove) {
			const index = this.emus.indexOf(emu);
			if (index > -1) {
				this.emus.splice(index, 1);
			}
		}

		// Update defenses list (remove destroyed ones)
		this.defenses = activeDefenses.filter(d => d.isActive());
	}

	private resetMines(): void {
		this.activeMines = [];
		this.view.clearMines();
	}

	private formatDefenseName(type: DefenseType): string {
		return type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
	}

	/**
	 * Get final score
	 */
	getFinalScore(): number {
		return this.model.getScore();
	}

	/**
	 * Get the view group
	 */
    getView(): FarmScreenView {
        return this.view;
    }

	/**
	 * Get the planning phase view group
	 */
	getPlanningPhaseView(): Konva.Group | null {
		return this.planningPhase?.getView().getGroup() || null;
	}

	private handleDeployMine(): void {
		if (this.status.getItemCount(GameItem.Mine) <= 0) {
			return;
		}
		const placement = this.view.deployMineAtMouse();
		if (!placement) {
			return;
		}
		const ok = this.status.removeFromInventory(GameItem.Mine, 1);
		if (!ok) {
			this.view.removeMineSprite(placement.node);
			return;
		}
		this.activeMines.push({ node: placement.node, size: placement.size });
		this.updateCropDisplay();
	}
}

type ActiveMine = {
	node: KonvaImage;
	size: number;
};
