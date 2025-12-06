import Konva from "konva";
import type { Image as KonvaImage } from "konva/lib/shapes/Image";
import type { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { DefenseController } from "../../components/DefenseComponent/DefenseController.ts";
import type { DefenseType } from "../../components/DefenseComponent/DefenseModel.ts";
import { FarmEmuController } from "../../components/FarmEmuComponent/FarmEmuController.ts";
import type { FarmPlanterController } from "../../components/FarmPlanterComponent/FarmPlanterController.ts";
import { GAME_DURATION, GameItem } from "../../constants.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import { AudioManager } from "../../services/AudioManager.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { ScreenController } from "../../types.ts";
import type { MorningEventsScreenController } from "../MorningEventsScreen/MorningEventsScreenController.ts";
import { PlanningPhaseController } from "../PlanningPhaseScreen/PlanningPhaseController.ts";
import { FarmScreenModel } from "./FarmScreenModel.ts";
import { FarmScreenView } from "./FarmScreenView.ts";

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
	private emuTargets = new Map<FarmEmuController, FarmPlanterController | null>;
	private numStillStanding: number = 0;
	private planters: FarmPlanterController[] = [];
	private morning: MorningEventsScreenController | null = null;
	private planningPhase: PlanningPhaseController | null = null;
	private screenSwitcher: ScreenSwitcher;
	private defenses: DefenseController[] = [];
	private isPlanningPhase: boolean = false;
	private isDefensePlacementMode: boolean = false;
	private selectedDefenseType: DefenseType | null = null;
	private readonly planningHint = "Select a defense, then press T to place it at the cursor.";

	private activeMines: ActiveMine[] = [];

	// private squeezeSound: HTMLAudioElement;

	constructor(_screenSwitcher: ScreenSwitcher, status: GameStatusController, audio: AudioManager) {
		super();
		this.status = status;
		this.audio = audio;
		this.screenSwitcher = _screenSwitcher;

		this.model = new FarmScreenModel(this.status);
		this.view = new FarmScreenView(
			(event: KeyboardEvent) => this.handleKeydown(event),
			() => this.handleEndGame(),
			(emu: FarmEmuController) => this.registerEmu(emu),
			() => this.removeEmus(),
			(planter: FarmPlanterController) => this.registerPlanter(planter),
		);
		this.view.setMenuButtonHandler(() => this.handleMenuButton());
		this.view.setMenuOptionHandlers(
			() => this.handleMenuSaveAndExit(),
			() => this.handleMenuResume(),
		);
		this.view.setStartRoundHandler(() => this.startRound());

		// Initialize planning phase
		this.planningPhase = new PlanningPhaseController();
		this.planningPhase.setOnPlaceDefenses(() => this.handlePlaceDefenses());
		this.planningPhase.setOnDefenseSelected((type) => {
			this.handleDefenseSelection(type);
		});

		// Set up defense placement click handler
		this.view.setDefensePlaceClickHandler((x, y) => this.handleDefensePlaceClick(x, y));
		//For the hunting menu:
		this.view.setHuntMenuOptionHandlers(
			() => this.handleSkipHunt(),
			() => this.handleHuntCont()
		)

		//For the egg menu:
		this.view.setEggMenuOptionHandlers(
			() => this.handleSkipEgg(),
			() => this.handleEggCont()
		)

		requestAnimationFrame(this.gameLoop);
	}

	setMorningController(controller: MorningEventsScreenController): void {
		this.morning = controller;
	}

	private gameLoop = (timestamp: number): void => {
		const deltaTime: number = (timestamp - this.lastTickTime) * 0.001;
		this.lastTickTime = timestamp;

		this.checkMineCollisions();
		this.checkEmuCropCollisions(deltaTime);
		this.checkDefenseEmuInteractions(deltaTime);
		this.assignTargetsToAllEmus();

		if (this.lastTickTime == null){
			this.lastTickTime = timestamp;
		}

		// Request the next frame
		requestAnimationFrame(this.gameLoop);
	}

	/**
	 * Start the game
	 */
	startGame(): void {		
		// Reset model state
		this.model.reset();
		this.timeRemaining = GAME_DURATION;
		this.defenses = [];
		this.view.clearDefenses();
		this.emus = [];
		this.view.clearEmus();
		this.selectedDefenseType = null;
		this.isPlanningPhase = false;
		this.isDefensePlacementMode = false;

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
		this.isDefensePlacementMode = false;
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

	private handlePlaceDefenses(): void {
		this.isPlanningPhase = false;
		this.isDefensePlacementMode = true;
		this.view.setPlanningPhaseMode(false);
		if (this.planningPhase) {
			this.planningPhase.hide();
		}
		if (this.selectedDefenseType) {
			this.view.setPlacementCursor(true);
			this.view.setPlacementHint(`Press T to place ${this.formatDefenseName(this.selectedDefenseType)} at the cursor.`);
		} else {
			this.view.setPlacementCursor(false);
			this.view.setPlacementHint();
		}
	}

	private handleDefensePlaceClick(x: number, y: number): void {
		if ((!this.isPlanningPhase && !this.isDefensePlacementMode) || !this.selectedDefenseType) {
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
		this.view.setPlacementCursor(false);
		this.view.setPlacementHint(this.planningHint);
	}

	private attemptDefensePlacementAtCursor(): void {
		if ((!this.isPlanningPhase && !this.isDefensePlacementMode) || !this.selectedDefenseType) {
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
		if ((!this.isPlanningPhase && !this.isDefensePlacementMode) || !this.selectedDefenseType) {
			return;
		}
		this.selectedDefenseType = null;
		this.view.setPlacementCursor(false);
		if (this.isPlanningPhase) {
			this.view.setPlacementHint(this.planningHint);
			if (this.planningPhase) {
				this.planningPhase.clearSelection();
				this.planningPhase.show();
			}
		} else {
			this.view.setPlacementHint();
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
		if (this.isDefensePlacementMode && this.selectedDefenseType) {
			const item = defenseTypeToGameItem(this.selectedDefenseType);
			if (this.status.getItemCount(item) <= 0) {
				this.selectedDefenseType = null;
				this.view.setPlacementCursor(false);
				this.view.setPlacementHint("No more defenses of this type. Select another defense.");
			} else {
				this.view.setPlacementHint(`Press T to place ${this.formatDefenseName(this.selectedDefenseType)} at the cursor.`);
			}
		} else {
			this.selectedDefenseType = null;
			this.view.setPlacementCursor(false);
			this.view.setPlacementHint(this.planningHint);
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
		this.isDefensePlacementMode = false;
		this.selectedDefenseType = null;
		this.view.setPlacementCursor(false);
		this.view.setPlacementHint();
		this.view.updateScore(this.model.getScore());
		this.updateCropDisplay();
		this.timeRemaining = GAME_DURATION;
		this.view.updateTimer(this.timeRemaining);
		this.view.updateRound(this.status.getDay());
		this.view.hideMenuOverlay();
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
            case "m": this.handleDeployMine(); break;
			case "t": this.attemptDefensePlacementAtCursor(); break;
			case "Escape": this.cancelDefensePlacement(); break;
        }
        event.preventDefault();
    }

	private handleEndGame(): void {
		// End game button - trigger game over
		this.stopTimer();
		this.screenSwitcher.switchToScreen({ type: "game_over",survivalDays:this.status.getSurvivalDay() ,score: this.status.getFinalScore() });
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
		this.handleMiniGames(this.status.getDay());
		this.planters.forEach((planter) => planter.advanceDay());
		this.model.updateSpawn();
		this.showPlanningPhase();
		this.resetMines();
		this.updateCropDisplay();

		this.assignTargetsToAllEmus();

		this.startRound();
	}

	private registerEmu(emu: FarmEmuController): void {
		this.emus.push(emu);
		this.emuTargets.set(emu, null);
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

	//For Emu crop interactions:

	private getPlantersWithCrop(): FarmPlanterController[] {
		return this.planters.filter(p => !p.isEmpty());
	}

	private assignTargetToEmu(emu: FarmEmuController): void {
		const candidates = this.getPlantersWithCrop();
		if (!candidates.length) {
			// No crops left – game is over!!!!:
			this.endGame();
			this.emuTargets.set(emu, null);
			return;
		}

		const planter = candidates[Math.floor(Math.random() * candidates.length)];
		const target = planter.getView();
		if (target) {
			emu.setTarget(target);
			this.emuTargets.set(emu, planter);
		}
	}

	private assignTargetsToAllEmus(): void {
		const candidates = this.getPlantersWithCrop();
		if (!candidates.length) {
			for (const emu of this.emus){
				this.emuTargets.set(emu, null);
			}
			return;
		}

		for (const emu of this.emus) {
			if (emu.hasTarget()) {
				return;
			}

			const planter = candidates[Math.floor(Math.random() * candidates.length)];
			const target = planter.getView();
			if (target) {
				emu.setTarget(target);
				this.emuTargets.set(emu, planter);
			}
		}
	}

	private checkEmuCropCollisions(deltaTime: number): void {
		if (!this.emus.length || !this.planters.length) {
			return;
		}

		for (const emu of this.emus) {
			if (!emu.isActive()) {
				continue;
			}

			const emuShape = emu.getView();
			if (!emuShape) {
				continue;
			}

			const emuX = emuShape.x();
			const emuY = emuShape.y();
			const emuWidth = emuShape.width();
			const emuHeight = emuShape.height();

			for (const planter of this.planters) {
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

				const isColliding =
					emuX < planterX + planterWidth &&
					emuX + emuWidth > planterX &&
					emuY < planterY + planterHeight &&
					emuY + emuHeight > planterY;

				if (!isColliding) {
					continue;
				}

				//Emu is “attacking” this crop
				const dps = emu.getDamage();
				const damageThisFrame = dps * deltaTime;

				const cropDied = planter.takeDamage(damageThisFrame);

				if (cropDied) {
					this.audio.playSfx("harvest");
					this.updateCropDisplay();
					this.numStillStanding--;
					//Retarget all emus targeted on this crop to the next non-destroyed crop
					for (const otherEmu of this.emus){
						const target = this.emuTargets.get(otherEmu);
						if (target === planter){
							this.assignTargetToEmu(otherEmu);
						}
					}
				}

				break;
			}
		}
	}


	private handleMenuButton(): void {
		this.stopTimer();
		this.view.showMenuOverlay();
	}

	//Handling options in the hunt menu:
	private handleHuntCont(): void {
		this.status.save();
		this.screenSwitcher.switchToScreen({ type: "minigame2_intro" });
		this.view.hideHuntMenuOverlay();
	}

	//Handling options in the egg menu:
	private handleEggCont(): void {
		this.status.save();
		this.screenSwitcher.switchToScreen({ type: "minigame1_raid" });
		this.view.hideEggMenuOverlay();
	}

	//Skip for both hunt and egg games are the same:
	private handleSkipHunt(): void {
		this.view.hideHuntMenuOverlay();
	}

	private handleSkipEgg(): void {
		this.view.hideEggMenuOverlay();
	}

	private handleMenuSaveAndExit(): void {
		this.status.reset();
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
		this.assignTargetsToAllEmus();
	}

	//For integration of minigames into the main game:

	private handleMiniGames(day: number): void {
		if(day % 4 == 1 || day % 3 == 2){
			//Make a menu screen appear
			//Switch screen to hunting game
			//Run the game
			this.view.showHuntMenuOverlay();
		}else if(day % 3 == 1){
			//Make a manu screen appear
			//Switch screen to egg game
			//Run the game
			this.view.showEggMenuOverlay();
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


	private checkDefenseEmuInteractions(deltaTime: number): void {
		if (!this.defenses.length || !this.emus.length || this.isPlanningPhase || this.isDefensePlacementMode) {
			return;
		}

		for (const emu of this.emus) {
			emu.setSpeedModifier(1.0);
			emu.setBlocked(false);
		}

		const activeDefenses: DefenseController[] = [];
		const emusToRemove: FarmEmuController[] = [];
		const machineGunCooldowns = new Map<DefenseController, number>();

		for (const defense of this.defenses) {
			if (!defense.isActive()) {
				continue;
			}
			activeDefenses.push(defense);

			const defenseView = defense.getView();
			if (!defenseView) continue;

			const defenseX = defenseView.x();
			const defenseY = defenseView.y();
			const defenseSize = 30;
			const defenseType = defense.getType();

			if (defenseType === "machine_gun") {
				const lastShot = machineGunCooldowns.get(defense) || 0;
				const cooldown = 0.5;
				const canShoot = lastShot <= 0;

				if (canShoot) {
					let nearestEmu: FarmEmuController | null = null;
					let nearestDistance = 100;

					for (const emu of this.emus) {
						const emuShape = emu.getView();
						if (!emuShape) continue;

						const emuX = emuShape.x();
						const emuY = emuShape.y();
						const dx = emuX - defenseX;
						const dy = emuY - defenseY;
						const distance = Math.sqrt(dx * dx + dy * dy);

						if (distance < nearestDistance) {
							nearestEmu = emu;
							nearestDistance = distance;
						}
					}

					if (nearestEmu && nearestDistance <= 100) {
						nearestEmu.remove();
						emusToRemove.push(nearestEmu);
						defense.takeDamage(1);
						machineGunCooldowns.set(defense, cooldown);
						if (!defense.isActive()) {
							defense.remove();
						}
					}
				} else {
					machineGunCooldowns.set(defense, Math.max(0, lastShot - deltaTime));
				}
				continue;
			}

			for (const emu of this.emus) {
				const emuShape = emu.getView();
				if (!emuShape) continue;

				const emuX = emuShape.x();
				const emuY = emuShape.y();
				const emuWidth = emuShape.width();
				const emuHeight = emuShape.height();

				const isColliding = (
					emuX < defenseX + defenseSize &&
					emuX + emuWidth > defenseX &&
					emuY < defenseY + defenseSize &&
					emuY + emuHeight > defenseY
				);

				if (!isColliding) continue;

				switch (defenseType) {
					case "barbed_wire":
						emu.setSpeedModifier(0.3);
						break;

					case "sandbag":
						emu.setBlocked(true);
						defense.takeDamage(1 * deltaTime);
						if (!defense.isActive()) {
							defense.remove();
							emu.setBlocked(false);
						}
						break;

					case "mine":
						break;
				}
			}
		}

		for (const emu of emusToRemove) {
			const index = this.emus.indexOf(emu);
			if (index > -1) {
				this.emus.splice(index, 1);
			}
		}

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

	/**
	 * End the game (called when player's crops are taken out)
	 * Should be called in game loop
	 */
	endGame(): void {
        this.view.clearEmus();
		this.screenSwitcher.switchToScreen({ 
			type: "game_over", 
			survivalDays: this.status.getDay(),
			score: this.getFinalScore() 
		});
	}
}

type ActiveMine = {
	node: KonvaImage;
	size: number;
};
