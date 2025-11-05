import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { MainMenuScreenController } from "./screens/MainMenuScreen/MainMenuScreenController.ts";
import { FarmScreenController } from "./screens/FarmScreen/FarmScreenController.ts";
import { Game2ScreenController } from "./screens/Game2Screen/Game2ScreenContoller.ts";
import { GameOverScreenController } from "./screens/GameOverScreen/GameOverScreenController.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";
import { GameStatusController } from "./controllers/GameStatusController.ts";
import { MorningEventsScreenController } from "./screens/MorningEventsScreen/MorningEventsScreenController.ts";
import { AudioManager } from "./services/AudioManager.ts";

/**
 * Main Application - Coordinates all screens
 *
 * This class demonstrates screen management using Konva Groups.
 * Each screen (Menu, Game, Results) has its own Konva.Group that can be
 * shown or hidden independently.
 *
 * Key concept: All screens are added to the same layer, but only one is
 * visible at a time. This is managed by the switchToScreen() method.
 */
class App implements ScreenSwitcher {
	private stage: Konva.Stage;
	private layer: Konva.Layer;

	private gameStatusController: GameStatusController;
	private audioManager: AudioManager;
	private menuController: MainMenuScreenController;
	private gameController: FarmScreenController;
	private game2Controller: Game2ScreenController;
	private resultsController: GameOverScreenController;
	private morningController: MorningEventsScreenController;

	constructor(container: string) {
		// Initialize Konva stage (the main canvas)
		this.stage = new Konva.Stage({
			container,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
		});

		// Create a layer (screens will be added to this layer)
		this.layer = new Konva.Layer();
		this.stage.add(this.layer);

		// Initialize all screen controllers
		// Each controller manages a Model, View, and handles user interactions
		this.gameStatusController = new GameStatusController();
		this.audioManager = new AudioManager();
		this.menuController = new MainMenuScreenController(this);
		this.game2Controller = new Game2ScreenController(this);
		this.gameController = new FarmScreenController(this, this.gameStatusController, this.audioManager);
		this.resultsController = new GameOverScreenController(this, this.audioManager);
		this.morningController = new MorningEventsScreenController(this, this.gameStatusController, this.audioManager);

		// Add all screen groups to the layer
		// All screens exist simultaneously but only one is visible at a time
		this.layer.add(this.menuController.getView().getGroup());
		this.layer.add(this.gameController.getView().getGroup());
		this.layer.add(this.game2Controller.getView().getGroup());
		this.layer.add(this.resultsController.getView().getGroup());
		this.layer.add(this.morningController.getView().getGroup());

		// Draw the layer (render everything to the canvas)
		this.layer.draw();

		// Start with menu screen visible
		this.menuController.getView().show();
		this.audioManager.playBgm("menu");
	}

	/**
	 * Switch to a different screen
	 *
	 * This method implements screen management by:
	 * 1. Hiding all screens (setting their Groups to invisible)
	 * 2. Showing only the requested screen
	 *
	 * This pattern ensures only one screen is visible at a time.
	 */
	switchToScreen(screen: Screen): void {
		// Hide all screens first by setting their Groups to invisible
		this.menuController.hide();
		this.gameController.hide();
		this.resultsController.hide();

		// Show the requested screen based on the screen type
		switch (screen.type) {
			case "main_menu":
				this.menuController.show();
				break;

			case "farm":
				// Start the game (which also shows the game screen)
				this.audioManager.playBgm("farm");
				this.gameController.startGame();
				break;

			case "minigame2":
				// Start the second minigame
				this.game2Controller.startGame2();
				break;

			case "morning":
				this.audioManager.playBgm("morning");
				this.morningController.show();
				break;

			case "game_over":
				// Show results with the final score
				this.audioManager.playBgm("gameover");
				this.resultsController.showResults(screen.score);
				break;
		}
	}
}

// Initialize the application
new App("container");
