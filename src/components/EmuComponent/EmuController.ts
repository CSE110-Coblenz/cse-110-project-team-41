import { EmuModel } from "./EmuModel.ts";
import { EmuView } from "./EmuView.ts";
import {EMU_SPEED, EMU_WALK_RANDOMIZATION} from "../../constants.ts";
import Konva from "konva";

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class EmuController {
	private model: EmuModel;
	private view: EmuView;
	private lastTickTime: number | null = null;

	private randomMove: [number, number] = [0, 0];
	private randomMoveCountdown: number = 0;

	private targetX = 0;
	private targetY = 0;

	constructor(group: Konva.Group, startX: number, startY: number) {
		this.model = new EmuModel();
		this.view = new EmuView(group, startX, startY);

		requestAnimationFrame(this.gameLoop);
	}

	private gameLoop = (timestamp: number): void => {
		if (!this.lastTickTime) {
			this.lastTickTime = timestamp;
		}

		const deltaTime: number = (timestamp - this.lastTickTime) * 0.001;
		this.lastTickTime = timestamp;

		const emu = this.view.getView()
		if (!emu) {
			requestAnimationFrame(this.gameLoop);
			return;
		}

		if (this.randomMoveCountdown > 0) {
			this.view.moveDelta(this.randomMove[0] * EMU_SPEED * deltaTime, this.randomMove[1] * EMU_SPEED * deltaTime);
			this.randomMoveCountdown--;
			requestAnimationFrame(this.gameLoop);
			return;
		} else {
			if (Math.random() < EMU_WALK_RANDOMIZATION) {
				this.randomMoveCountdown = 30;
				const randomDir = [[0, 1], [1, 0], [1, 1]][Math.floor(Math.random() * 3)] as [number, number];
				this.randomMove = [randomDir[0] * (Math.random() < 0.5 ? -1 : 1), randomDir[1] * (Math.random() < 0.5 ? -1 : 1)];
			}
		}

		if (emu.x() > this.targetX) {
			this.view.moveDelta(- EMU_SPEED * deltaTime, 0);
		} else {
			this.view.moveDelta(EMU_SPEED * deltaTime, 0);
		}

		if (emu.y() > this.targetY) {
			this.view.moveDelta(0, - EMU_SPEED * deltaTime);
		} else {
			this.view.moveDelta(0, EMU_SPEED * deltaTime);
		}

		// Request the next frame
		requestAnimationFrame(this.gameLoop);
	}

	setTarget = (target: Konva.Shape): void => {
		this.targetX = target.x();
		this.targetY = target.y();
	}


	getView(): Konva.Rect | null {
		return this.view.getView();
	}
}
