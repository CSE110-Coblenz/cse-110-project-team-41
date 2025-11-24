import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { MainMenuScreenController } from "./screens/MainMenuScreen/MainMenuScreenController.ts";
import { FarmScreenController } from "./screens/FarmScreen/FarmScreenController.ts";
import { HuntingScreenController } from "./screens/HuntingScreen/HuntingScreenContoller.ts";
import { HuntingIntroScreenController } from "./screens/HuntingIntroScreen/HuntingIntroScreenController.ts";
import { HuntingEndScreenController } from "./screens/HuntingEndScreen/HuntingEndScreenController.ts";
import { GameOverScreenController } from "./screens/GameOverScreen/GameOverScreenController.ts";
import { GameIntroController } from "./screens/GameIntroScreen/GameIntroScreenController.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";
import { GameStatusController } from "./controllers/GameStatusController.ts";
import { MorningEventsScreenController } from "./screens/MorningEventsScreen/MorningEventsScreenController.ts";
import { AudioManager } from "./services/AudioManager.ts";
import { RaidController } from "./screens/RaidScreen/RaidController.ts";

class App implements ScreenSwitcher {
	private stage: Konva.Stage;
	private layer: Konva.Layer;

	private gameStatusController: GameStatusController;
	private audioManager: AudioManager;
	private menuController: MainMenuScreenController;
	private farmController: FarmScreenController;
	private huntingController: HuntingScreenController;
	private huntingIntroController: HuntingIntroScreenController;
	private huntingEndController: HuntingEndScreenController;
	private resultsController: GameOverScreenController;
	private morningController: MorningEventsScreenController;
	private raidController: RaidController;
	private introController: GameIntroController;

	constructor(container: string) {
		this.stage = new Konva.Stage({
			container,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
		});

		this.layer = new Konva.Layer();
		this.stage.add(this.layer);

		this.gameStatusController = new GameStatusController();
		this.audioManager = new AudioManager();
		this.menuController = new MainMenuScreenController(this);
		this.huntingController = new HuntingScreenController(this);
		this.huntingIntroController = new HuntingIntroScreenController(this);
		this.huntingEndController = new HuntingEndScreenController(this);
		this.farmController = new FarmScreenController(this, this.gameStatusController, this.audioManager);
		this.resultsController = new GameOverScreenController(this, this.gameStatusController, this.audioManager);
		this.morningController = new MorningEventsScreenController(this, this.gameStatusController, this.audioManager);
		this.farmController.setMorningController(this.morningController);
		this.raidController = new RaidController(
			this,
			this.gameStatusController
		);
		this.introController = new GameIntroController(this);

		this.layer.add(this.menuController.getView().getGroup());
		this.layer.add(this.farmController.getView().getGroup());
		const planningPhaseView = this.farmController.getPlanningPhaseView();
		if (planningPhaseView) {
			this.layer.add(planningPhaseView);
		}
		this.layer.add(this.huntingController.getView().getGroup());
		this.layer.add(this.huntingIntroController.getView().getGroup());
		this.layer.add(this.huntingEndController.getView().getGroup());
		this.layer.add(this.resultsController.getView().getGroup());
		this.layer.add(this.morningController.getView().getGroup());
		this.layer.add(this.raidController.getView().getGroup());
		this.layer.add(this.introController.getView().getGroup());

		this.layer.draw();

		// Start with menu screen visible
		this.menuController.getView().show();
		this.audioManager.playBgm("menu");
	}

	switchToScreen(screen: Screen): void {
		this.menuController.hide();
		this.farmController.hide();
		this.resultsController.hide();
		this.huntingController.hide();
		this.huntingIntroController.hide();
		this.huntingEndController.hide();
		this.morningController.hide();
		this.raidController.hide();
		this.introController.hide();

		switch (screen.type) {
			case "main_menu":
				this.menuController.show();
				break;

			case "game_intro": 
				this.introController.show();
				break;

			case "farm":
				// Start the game (which also shows the game screen)
				this.audioManager.playBgm("farm");
				this.farmController.startGame();
				// startGame() will call startRound() or show planning phase
				break;

			case "minigame2_intro":
				// Show the introduction screen for minigame 2
				this.huntingIntroController.show();
				break;

			case "minigame2":
				// Start the second minigame
				this.huntingController.startHuntingGame();
				break;

			case "minigame2_end":
				// Show the end screen for minigame 2
				this.huntingEndController.showResults(screen.emusKilled, screen.reason);
				break;

			case "morning":
				this.audioManager.playBgm("morning");
				this.morningController.show();
				break;

			case "game_over":
				// Show results with the final score
				this.audioManager.playBgm("gameover");
				this.resultsController.showFinalResults(screen.survivalDays, screen.score);
				break;

			case "minigame1_raid":
				this.raidController.startGame();
				break;
		}
	}
}

new App("container");