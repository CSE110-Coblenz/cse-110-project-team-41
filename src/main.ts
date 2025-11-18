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
	private farmController: FarmScreenController;
	private introController: GameIntroController;

	constructor() {
		this.stage = new Konva.Stage({
			container: "game-container",
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
		});

		this.layer = new Konva.Layer();
		this.stage.add(this.layer);

		this.audioManager = new AudioManager();
		this.gameStatusController = new GameStatusController();

		// Initialize controllers
		this.menuController = new MainMenuScreenController(this);
		this.farmController = new FarmScreenController(this.stage);
		this.introController = new GameIntroController(this.stage, () => {
			this.switchTo("market");
		});

		// Start with the main menu
		this.switchTo("menu");
	}

	// Switch between screens
	switchTo(screen: string): void {
		this.layer.destroyChildren(); // Clear the current screen

		switch (screen) {
			case "menu":
				this.menuController.onStartGameClick = this.menuController.onStartGameClick.bind(this);
				this.menuController.onStartGameClick();
				break;

			case "intro":
				this.introController.render();
				break;

			case "market":
				console.log("Switching to the market screen...");
				// Add logic to initialize and render the market screen
				break;

			default:
				console.error(`Unknown screen: ${screen}`);
		}
	}
}

const app = new App("container");