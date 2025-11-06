import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import {
	Minigame1RaidModel,
	TILE_TYPE,
	EGG_COUNT,
	MAZE_WIDTH,
	MAZE_HEIGHT,
} from "./Minigame1RaidModel.ts";
import { Minigame1RaidView } from "./Minigame1RaidView.ts";

export class Minigame1RaidController extends ScreenController {
	private model: Minigame1RaidModel;
	private view: Minigame1RaidView;
	private screenSwitcher: ScreenSwitcher;
	private gameStatus: GameStatusController; 
	private gameTimer: number | null = null;

	constructor(
		screenSwitcher: ScreenSwitcher,
		gameStatus: GameStatusController, 
	) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.gameStatus = gameStatus; 
		this.model = new Minigame1RaidModel();
		this.view = new Minigame1RaidView();

		window.addEventListener("keydown", (e) => this.handleKeyDown(e));
	}

	/**
	 * Generates a new random maze and places eggs.
	 */
	private generateRandomMaze(): void {
		// --- TODO: Replace with a real maze algorithm (e.g., Recursive Backtracking) ---
		// For now, let's make a simple test maze:
		this.model.reset();
		const layout = this.model.mazeLayout;
		layout[1][1] = TILE_TYPE.START;
		layout[1][2] = TILE_TYPE.PATH;
		layout[1][3] = TILE_TYPE.PATH;
		layout[2][3] = TILE_TYPE.PATH;
		layout[3][3] = TILE_TYPE.EXIT;
		this.model.playerPosition = { x: 1, y: 1 };
		// --- End of test maze ---

		// --- ADDED: Randomly place eggs on path tiles ---
		let eggsPlaced = 0;
		while (eggsPlaced < EGG_COUNT) {
			const x = Math.floor(Math.random() * MAZE_WIDTH);
			const y = Math.floor(Math.random() * MAZE_HEIGHT);

			// Place an egg if the tile is a path and not start/exit
			if (
				y < layout.length &&
				x < layout[y].length &&
				layout[y][x] === TILE_TYPE.PATH
			) {
				layout[y][x] = TILE_TYPE.EGG;
				eggsPlaced++;
			}
		}
	}

	public startGame(): void {
		this.model.reset();
		this.generateRandomMaze();
		this.view.drawMaze(this.model.mazeLayout);
		this.view.updatePlayerPosition(
			this.model.playerPosition.x,
			this.model.playerPosition.y,
		);
		this.view.updateTimer(this.model.timeRemaining);
		this.view.updateEggCount(this.model.eggsCollected);
		this.view.show();
		this.startTimer();
	}

	private startTimer(): void {
		this.stopTimer();
		this.gameTimer = setInterval(() => {
			this.model.timeRemaining--;
			this.view.updateTimer(this.model.timeRemaining);

			if (this.model.timeRemaining <= 0) {
				this.endGame(false); // Time's up
			}
		}, 1000);
	}

	private stopTimer(): void {
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
			this.gameTimer = null;
		}
	}

	private handleKeyDown(e: KeyboardEvent): void {
		if (!this.view.getGroup().visible()) return; // Don't move if minigame isn't active

		let { x, y } = this.model.playerPosition;
		let newX = x;
		let newY = y;

		switch (e.key) {
			case "ArrowUp":
				newY--;
				break;
			case "ArrowDown":
				newY++;
				break;
			case "ArrowLeft":
				newX--;
				break;
			case "ArrowRight":
				newX++;
				break;
			default:
				return;
		}
		e.preventDefault();

		// Check boundaries
		if (
			newY < 0 ||
			newY >= MAZE_HEIGHT ||
			newX < 0 ||
			newX >= MAZE_WIDTH
		) {
			return; // Out of bounds
		}

		const tile = this.model.mazeLayout[newY][newX];

		if (tile !== TILE_TYPE.WALL) {
			this.model.playerPosition = { x: newX, y: newY };
			this.view.updatePlayerPosition(newX, newY);

			// --- ADDED: Collection Logic ---
			if (tile === TILE_TYPE.EGG) {
				this.model.eggsCollected++;
				this.view.updateEggCount(this.model.eggsCollected);
				// Remove the egg from the model and redraw the maze
				this.model.mazeLayout[newY][newX] = TILE_TYPE.PATH;
				this.view.drawMaze(this.model.mazeLayout);
			}

			if (tile === TILE_TYPE.EXIT) {
				this.endGame(true); // Player reached the exit!
			}
		}
	}

	private endGame(didWin: boolean): void {
		this.stopTimer();

		// --- MODIFIED: Show popup and transfer resources ---
		const eggs = this.model.eggsCollected;

		if (didWin) {
			console.log("Minigame 1 Won! You get an emu egg!");
			// We can add the exit egg as a bonus
			// this.gameStatus.addEmuEggs(eggs + 1);
			// this.view.showEndPopup(eggs + 1);
		} else {
			console.log("Minigame 1 Lost. Time ran out.");
		}

		// Show popup and transfer eggs
		this.gameStatus.addEmuEggs(eggs);
		this.view.showEndPopup(eggs);

		// Pause for 3 seconds to let the player read the popup
		setTimeout(() => {
			this.view.hide();
			// Switch back to the main game
			this.screenSwitcher.switchToScreen({ type: "farm" });
		}, 3000); // 3000ms = 3 seconds
	}



	getView(): Minigame1RaidView {
		return this.view;
	}
}