import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { MainMenuScreenController } from "./screens/MainMenuScreen/MainMenuScreenController.ts";
import { FarmScreenController } from "./screens/FarmScreen/FarmScreenController.ts";
import { HuntingScreenController } from "./screens/HuntingScreen/HuntingScreenContoller.ts";
import { HuntingIntroScreenController } from "./screens/HuntingIntroScreen/HuntingIntroScreenController.ts";
import { HuntingEndScreenController } from "./screens/HuntingEndScreen/HuntingEndScreenController.ts";
import { GameOverScreenController } from "./screens/GameOverScreen/GameOverScreenController.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";
import { GameStatusController } from "./controllers/GameStatusController.ts";
import { MorningEventsScreenController } from "./screens/MorningEventsScreen/MorningEventsScreenController.ts";
import { AudioManager } from "./services/AudioManager.ts";
import { RaidController } from "./screens/RaidScreen/RaidController.ts";
import { GameIntroController } from "./screens/GameIntroScreen/GameIntroScreenController";

class App implements ScreenSwitcher {
	private stage: Konva.Stage;
	private layer: Konva.Layer;

	private gameStatusController: GameStatusController;
	private audioManager: AudioManager;
	private menuController: MainMenuScreenController;
	private farmController: FarmScreenController | null = null;
	private introController: GameIntroController | null = null;

	constructor() {
		this.stage = new Konva.Stage({
			container: "container",
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
		});

		this.layer = new Konva.Layer();
		this.stage.add(this.layer);

		this.audioManager = new AudioManager();
		this.gameStatusController = new GameStatusController();

		// Initialize menu controller
		this.menuController = new MainMenuScreenController(this);
		
		// Start with the main menu
		this.switchToScreen({ type: "main_menu" });
	}

	// Implement ScreenSwitcher interface
	switchToScreen(screen: Screen): void {
		this.layer.destroyChildren();
		
		switch (screen.type) {
			case "main_menu":
				this.layer.add(this.menuController.getView().getGroup());
				this.menuController.show();
				break;
			case "farm":
				if (!this.farmController) {
					this.farmController = new FarmScreenController(this, this.gameStatusController, this.audioManager, this.stage);
				}
				this.layer.add(this.farmController.getView().getGroup());
				this.farmController.show();
				break;
			case "morning":
				const morningController = new MorningEventsScreenController(this, this.gameStatusController, this.audioManager);
				this.layer.add(morningController.getView().getGroup());
				morningController.show();
				break;
			case "minigame2_intro":
				const huntingIntroController = new HuntingIntroScreenController(this);
				this.layer.add(huntingIntroController.getView().getGroup());
				huntingIntroController.show();
				break;
			case "minigame2":
				const huntingController = new HuntingScreenController(this);
				this.layer.add(huntingController.getView().getGroup());
				huntingController.show();
				break;
			case "minigame2_end":
				const huntingEndController = new HuntingEndScreenController(this);
				this.layer.add(huntingEndController.getView().getGroup());
				huntingEndController.show();
				break;
			case "game_over":
				const gameOverController = new GameOverScreenController(this, this.audioManager);
				this.layer.add(gameOverController.getView().getGroup());
				gameOverController.show();
				break;
			case "minigame1_raid":
				const raidController = new RaidController(this, this.gameStatusController, this.audioManager);
				this.layer.add(raidController.getView().getGroup());
				raidController.show();
				break;
			default:
				console.error(`Unknown screen type`);
		}
		
		this.layer.draw();
	}

	// Show intro screen, then call the callback when complete
	switchToIntroThen(onComplete: () => void): void {
		// Clear layer
		this.layer.destroyChildren();
		
		if (this.introController) {
			this.introController.destroy();
		}
		
		this.introController = new GameIntroController(this.stage, () => {
			// After intro completes, call the callback
			onComplete();
		});
	}
}

const app = new App();
