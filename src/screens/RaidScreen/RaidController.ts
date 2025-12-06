import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { GameStatusController } from "../../controllers/GameStatusController";
import {
	RaidModel,
	TILE_TYPE,
	EGG_COUNT,
	MAZE_WIDTH,
	MAZE_HEIGHT,
} from "./RaidModel";
import { RaidView } from "./RaidView";

export class RaidController extends ScreenController {
	private model: RaidModel;
	private view: RaidView;
	private screenSwitcher: ScreenSwitcher;
	private gameStatus: GameStatusController;
	private gameTimer: number | null = null;
	private isGameActive: boolean = false; // Blocks input during intro/popups

	constructor(
		screenSwitcher: ScreenSwitcher,
		gameStatus: GameStatusController,
	) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.gameStatus = gameStatus;
		this.model = new RaidModel();
		
		// Pass the callback for when the user clicks "Start Raid" on the intro
		this.view = new RaidView(() => this.handleIntroStart());

		window.addEventListener("keydown", (e) => this.handleKeyDown(e));
	}

	/**
	 * Called when user clicks "Start Raid" on the intro screen
	 */
	private handleIntroStart(): void {
		this.view.hideIntro();
		this.isGameActive = true;
		this.startTimer();
	}

	/**
	 * Generates a maze with RANDOM scatter (The "Old" Logic).
	 * This creates unreachable areas that require wall breaking.
	 */
	private generateRandomMaze(): void {
		this.model.reset();
		const layout = this.model.mazeLayout;

		// 1. Randomly scatter walls (30% chance per tile)
		for (let y = 0; y < MAZE_HEIGHT; y++) {
			for (let x = 0; x < MAZE_WIDTH; x++) {
				// Keep border walls
				if (x === 0 || x === MAZE_WIDTH - 1 || y === 0 || y === MAZE_HEIGHT - 1) {
					layout[y][x] = TILE_TYPE.WALL;
				} else {
					// Random chance to be a wall
					if (Math.random() < 0.3) {
						layout[y][x] = TILE_TYPE.WALL;
					} else {
						layout[y][x] = TILE_TYPE.PATH;
					}
				}
			}
		}

		// 2. Ensure Start Area is clear
		layout[1][1] = TILE_TYPE.START;
		layout[1][2] = TILE_TYPE.PATH;
		layout[2][1] = TILE_TYPE.PATH;
		this.model.playerPosition = { x: 1, y: 1 };

		// 3. Set Exit (Bottom-Right)
		layout[MAZE_HEIGHT - 2][MAZE_WIDTH - 2] = TILE_TYPE.EXIT;
		layout[MAZE_HEIGHT - 2][MAZE_WIDTH - 3] = TILE_TYPE.PATH;
		layout[MAZE_HEIGHT - 3][MAZE_WIDTH - 2] = TILE_TYPE.PATH;

		// 4. Randomly place eggs (Safe Loop)
		let eggsPlaced = 0;
		let attempts = 0;
		while (eggsPlaced < EGG_COUNT && attempts < 1000) {
			attempts++;
			const x = Math.floor(Math.random() * (MAZE_WIDTH - 2)) + 1;
			const y = Math.floor(Math.random() * (MAZE_HEIGHT - 2)) + 1;

			// Only place on paths to avoid immediate soft-locks, 
			// but they might still be behind walls!
			if (layout[y][x] === TILE_TYPE.PATH) {
				layout[y][x] = TILE_TYPE.EGG;
				eggsPlaced++;
			}
		}
	}

	public startGame(): void {
		this.isGameActive = false; // Wait for intro
		this.generateRandomMaze();
		this.view.drawMaze(this.model.mazeLayout);
		this.view.updatePlayerPosition(
			this.model.playerPosition.x,
			this.model.playerPosition.y,
		);
		this.view.updateTimer(this.model.timeRemaining);
		this.view.updateEggCount(this.model.eggsCollected);
		
		this.view.show();
		this.view.showIntro(); // Show instructions first!
	}

	private startTimer(): void {
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
		}
		this.gameTimer = setInterval(() => {
			this.model.timeRemaining--;
			this.view.updateTimer(this.model.timeRemaining);

			if (this.model.timeRemaining <= 0) {
				this.endGame(false); // Time's up
			}
		}, 1000);
	}

	private handleKeyDown(e: KeyboardEvent): void {
		// Don't allow movement if game isn't active (intro or popup showing)
		if (!this.view.getGroup().visible() || !this.isGameActive) return;

		const { x, y } = this.model.playerPosition;

		// --- WALL BREAKING (Spacebar) ---
		if (e.key === " ") {
			this.breakAdjacentWalls(x, y);
			return; 
		}

		let newX = x;
		let newY = y;

		// --- CHANGED: WASD Controls ---
		const key = e.key.toLowerCase();
		switch (key) {
			case "w": newY--; break;
			case "s": newY++; break;
			case "a": newX--; break;
			case "d": newX++; break;
			default: return;
		}
		// ------------------------------
		
		e.preventDefault();

		if (newY < 0 || newY >= MAZE_HEIGHT || newX < 0 || newX >= MAZE_WIDTH) return;

		const tile = this.model.mazeLayout[newY][newX];

		if (tile !== TILE_TYPE.WALL) {
			this.model.playerPosition = { x: newX, y: newY };
			this.view.updatePlayerPosition(newX, newY);

			if (tile === TILE_TYPE.EGG) {
				this.model.eggsCollected++;
				this.view.updateEggCount(this.model.eggsCollected);
				this.model.mazeLayout[newY][newX] = TILE_TYPE.PATH;
				this.view.drawMaze(this.model.mazeLayout);
			}

			if (tile === TILE_TYPE.EXIT) {
				this.endGame(true);
			}
		}
	}

	private breakAdjacentWalls(x: number, y: number): void {
		const layout = this.model.mazeLayout;
		const directions = [
			{ dx: 0, dy: -1 }, { dx: 0, dy: 1 },
			{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }
		];

		let wallBroken = false;
		for (const dir of directions) {
			const nx = x + dir.dx;
			const ny = y + dir.dy;
			if (nx > 0 && nx < MAZE_WIDTH - 1 && ny > 0 && ny < MAZE_HEIGHT - 1) {
				if (layout[ny][nx] === TILE_TYPE.WALL) {
					layout[ny][nx] = TILE_TYPE.PATH;
					wallBroken = true;
				}
			}
		}
		if (wallBroken) {
			this.view.drawMaze(this.model.mazeLayout);
		}
	}

	private endGame(didWin: boolean): void {
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
		}
		this.isGameActive = false; // Stop movement

		if (didWin) {
			// --- WIN CONDITION: Add eggs to inventory ---
			this.gameStatus.addEmuEggs(this.model.eggsCollected);
			this.view.showEndPopup(
				`MISSION COMPLETE!\n\nYou reached the exit with\n${this.model.eggsCollected} eggs!`,
			);
		} else {
			// --- LOSS CONDITION: Do NOT add eggs (they are lost) ---
			this.view.showEndPopup(
				`TIME'S UP!\n\nYou collected ${this.model.eggsCollected} eggs,\nbut you got caught by the emus\nand dropped all your eggs to run!`,
			);
		}

		setTimeout(() => {
			this.view.hide();
			this.screenSwitcher.switchToScreen({ type: "farm", newgame:false });
		}, 5000);
	}

	getView(): RaidView {
		return this.view;
	}
}