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

	constructor(
		screenSwitcher: ScreenSwitcher,
		gameStatus: GameStatusController,
	) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.gameStatus = gameStatus;
		this.model = new RaidModel();
		this.view = new RaidView();

		window.addEventListener("keydown", (e) => this.handleKeyDown(e));
	}

	private generateRandomMaze(): void {
		this.model.reset();
		const layout = this.model.mazeLayout;
		const stack: { x: number; y: number }[] = [];
		const start = { x: 1, y: 1 };
		layout[start.y][start.x] = TILE_TYPE.PATH;
		stack.push(start);

		while (stack.length > 0) {
			const current = stack[stack.length - 1];
			const neighbors = [];
			const directions = [
				{ dx: 0, dy: -2 },
				{ dx: 0, dy: 2 },
				{ dx: -2, dy: 0 },
				{ dx: 2, dy: 0 },
			];
			for (const dir of directions) {
				const nx = current.x + dir.dx;
				const ny = current.y + dir.dy;
				if (
					nx > 0 &&
					nx < MAZE_WIDTH - 1 &&
					ny > 0 &&
					ny < MAZE_HEIGHT - 1 &&
					layout[ny][nx] === TILE_TYPE.WALL
				) {
					neighbors.push({ x: nx, y: ny, px: dir.dx / 2, py: dir.dy / 2 });
				}
			}
			if (neighbors.length > 0) {
				const next = neighbors[Math.floor(Math.random() * neighbors.length)];
				layout[current.y + next.py][current.x + next.px] = TILE_TYPE.PATH;
				layout[next.y][next.x] = TILE_TYPE.PATH;
				stack.push({ x: next.x, y: next.y });
			} else {
				stack.pop();
			}
		}

		layout[1][1] = TILE_TYPE.START;
		let exitSet = false;
		for (let y = MAZE_HEIGHT - 2; y > MAZE_HEIGHT / 2 && !exitSet; y--) {
			for (let x = MAZE_WIDTH - 2; x > MAZE_WIDTH / 2 && !exitSet; x--) {
				if (layout[y][x] === TILE_TYPE.PATH) {
					layout[y][x] = TILE_TYPE.EXIT;
					exitSet = true;
				}
			}
		}
		this.model.playerPosition = { x: 1, y: 1 };

		let eggsPlaced = 0;
		let attempts = 0;
		while (eggsPlaced < EGG_COUNT && attempts < 1000) {
			attempts++;
			const x = Math.floor(Math.random() * MAZE_WIDTH);
			const y = Math.floor(Math.random() * MAZE_HEIGHT);
			if (layout[y][x] === TILE_TYPE.PATH) {
				layout[y][x] = TILE_TYPE.EGG;
				eggsPlaced++;
			}
		}
	}

	public startGame(): void {
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
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
		}
		this.gameTimer = setInterval(() => {
			this.model.timeRemaining--;
			this.view.updateTimer(this.model.timeRemaining);

			if (this.model.timeRemaining <= 0) {
				this.endGame(false); // Time's up!
			}
		}, 1000);
	}

	private handleKeyDown(e: KeyboardEvent): void {
		if (!this.view.getGroup().visible()) return;
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
		if (
			newY < 0 ||
			newY >= MAZE_HEIGHT ||
			newX < 0 ||
			newX >= MAZE_WIDTH
		)
			return;
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

	private endGame(didWin: boolean): void {
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
		}

		if (didWin) {
			// ONLY add eggs if they won!
			this.gameStatus.addEmuEggs(this.model.eggsCollected);
			this.view.showEndPopup(
				`MISSION COMPLETE!\n\nYou reached the exit with\n${this.model.eggsCollected} eggs!`,
			);
		} else {
			// NO eggs added here. They lost them all!
			this.view.showEndPopup(
				`TIME'S UP!\n\nYou collected ${this.model.eggsCollected} eggs,\nbut you got caught by the emus\nand dropped all your eggs to run!`,
			);
		}

		setTimeout(() => {
			this.view.hide();
			this.screenSwitcher.switchToScreen({ type: "farm" });
		}, 5000); // Increased to 5s to give time to read the longer message
	}

	getView(): RaidView {
		return this.view;
	}
}