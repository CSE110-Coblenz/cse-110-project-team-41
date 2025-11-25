import type { Image as KonvaImage } from "konva/lib/shapes/Image";
import type { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { FarmEmuController } from "../../components/FarmEmuComponent/FarmEmuController.ts";
import type { FarmPlanterController } from "../../components/FarmPlanterComponent/FarmPlanterController.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import { AudioManager } from "../../services/AudioManager.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { ScreenController } from "../../types.ts";
import type { MorningEventsScreenController } from "../MorningEventsScreen/MorningEventsScreenController.ts";
import { FarmScreenModel } from "./FarmScreenModel.ts";
import { FarmScreenView } from "./FarmScreenView.ts";
import { GAME_DURATION } from "../../constants.ts";

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class FarmScreenController extends ScreenController {
	private model: FarmScreenModel;
	private view: FarmScreenView;
	private gameTimer: number | null = null;
	private timeRemaining: number = GAME_DURATION;

	private status: GameStatusController;
	private audio: AudioManager;
	private emus: FarmEmuController[] = [];
	private planters: FarmPlanterController[] = [];
	private morning: MorningEventsScreenController | null = null;
	private screenSwitcher: ScreenSwitcher;

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
			() => this.handleEndDay(),
			() => this.endGame(),
			(emu: FarmEmuController) => this.registerEmu(emu),
			() => this.removeEmus(),
			(planter: FarmPlanterController) => this.registerPlanter(planter),
		);
		this.view.setMenuButtonHandler(() => this.handleMenuButton());
		this.view.setMenuOptionHandlers(
			() => this.handleMenuSaveAndExit(),
			() => this.handleMenuResume(),
		);

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

	private gameLoop = (): void => {
		this.checkMineCollisions();

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

		// Update view
		this.view.updateScore(this.model.getScore());
		this.view.hideMenuOverlay();
		this.resetMines();
		this.view.spawnEmus(this.model.getSpawn());
		this.view.updateTimer(this.timeRemaining); //updateTimer/ TIMER needs to be impmlemented
		this.updateCropDisplay();
		this.view.show();
	}

	/**
	 * Start the round
	 */
	startRound(): void {
		// Update view
		this.view.updateScore(this.model.getScore());
		this.updateCropDisplay();
		this.timeRemaining = GAME_DURATION;
		this.view.updateTimer(this.timeRemaining);
		this.view.updateRound(this.status.getDay());
		this.view.hideMenuOverlay();
		this.view.show();

		this.startTimer();
	}

	/**
	 * Handle mine placement
	 */
    private handleKeydown(event: KeyboardEvent): void {
        const key = event.key;
        switch (key) {
            case "m": this.handleDeployMine(); break;
        }
        event.preventDefault();
    }

	/**
	 * Start day
	 */
	private handleEndDay(): void {
		this.endRound();
	}

	//Timer implementation:

	/**
	 * Start the countdown timer for the main game
	 */
	private startTimer(): void {
		this.stopTimer();
		const timerId = setInterval(() => {
			if (this.timeRemaining <= 0){
				this.endRound();
				return;
			}
			this.timeRemaining = Math.max(0, this.timeRemaining - 1);
			this.view.updateTimer(this.timeRemaining);
			// if (this.timeRemaining <= 0){
			// 	this.endRound();
			// }
		}, 1000) as unknown as number;
		this.gameTimer = timerId;
	}

	/**
	 * Stop the countdown timer for the main game
	 */
	private stopTimer(): void{
		if (!this.gameTimer) {return;}
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
		this.view.spawnEmus(this.model.getSpawn());
		this.resetMines();
		this.updateCropDisplay();

		if (this.planters.length > 0) {
			for (let i = 0; i < this.emus.length; i++) {
				const planter = this.planters[Math.floor(Math.random() * this.planters.length)];
				const target = planter?.getView();
				if (!target) {
					continue;
				}
				this.emus[i].setTarget(target);
			}
		}

		this.startRound();
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
		planter.setOnHarvest(() => {
			this.status.addToInventory("crop", 1);
			this.audio.playSfx("harvest");
			this.updateCropDisplay();
		});
	}

	private handleMenuButton(): void {
		this.view.showMenuOverlay();
	}

	//Handling options in the hunt menu:
	private handleHuntCont(): void {
		this.status.saveState();
		this.screenSwitcher.switchToScreen({ type: "minigame2_intro" });
		this.view.hideHuntMenuOverlay();
	}

	//Handling options in the egg menu:
	private handleEggCont(): void {
		this.status.saveState();
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
		this.view.hideMenuOverlay();
		this.status.saveState();
		this.screenSwitcher.switchToScreen({ type: "main_menu" });
	}

	private handleMenuResume(): void {
		this.view.hideMenuOverlay();
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
        this.view.updateCropCount(this.status.getItemCount("crop"));
        this.view.updateMineCount(this.status.getItemCount("mine"));
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

	private resetMines(): void {
		this.activeMines = [];
		this.view.clearMines();
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

	private handleDeployMine(): void {
		if (this.status.getItemCount("mine") <= 0) {
			return;
		}
		const placement = this.view.deployMineAtMouse();
		if (!placement) {
			return;
		}
		const ok = this.status.removeFromInventory("mine", 1);
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
