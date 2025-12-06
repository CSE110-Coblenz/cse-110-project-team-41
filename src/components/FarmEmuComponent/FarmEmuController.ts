import { FarmEmuModel } from "./FarmEmuModel.ts";
import { FarmEmuView } from "./FarmEmuView.ts";
import {EMU_SPEED, EMU_WALK_RANDOMIZATION} from "../../constants.ts";
import Konva from "konva";

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class FarmEmuController {
	private model: FarmEmuModel;
	private view: FarmEmuView;
	private lastTickTime: number | null = null;

	private static nextId = 1;
	private id: number;

	private randomMove: [number, number] = [0, 0];
	private randomMoveCountdown: number = 0;

	private targetX: number | null = null;
	private targetY: number | null = null;
	private speedModifier: number = 1.0;
	private isBlocked: boolean = false;

	private active: boolean;

	constructor(group: Konva.Group, startX: number, startY: number, onKill: () => void) {
		this.model = new FarmEmuModel(() => onKill());
		this.view = new FarmEmuView(group, startX, startY, () => this.model.decrementHealth(10));
		this.id = FarmEmuController.nextId++;
		const randomDir = [[0, 1], [1, 0], [1, 1]][Math.floor(Math.random() * 3)] as [number, number];
		this.randomMove = [randomDir[0] * (Math.random() < 0.5 ? -1 : 1), randomDir[1] * (Math.random() < 0.5 ? -1 : 1)];
		this.active = true;

		requestAnimationFrame(this.gameLoop);
	}

	private gameLoop = (timestamp: number): void => {
		if (!this.active) {
			return;
		}

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

		if (this.isBlocked) {
			requestAnimationFrame(this.gameLoop);
			return;
		}

		const currentSpeed = EMU_SPEED * this.speedModifier;

		if (!this.targetX || !this.targetY) {
			if (this.randomMoveCountdown > 0) {
				this.view.moveDelta(this.randomMove[0] * currentSpeed * deltaTime, this.randomMove[1] * currentSpeed * deltaTime);
				this.randomMoveCountdown--;
				requestAnimationFrame(this.gameLoop);
			} else {
				this.randomMoveCountdown = 30;
				const randomDir = [[0, 1], [1, 0], [1, 1]][Math.floor(Math.random() * 3)] as [number, number];
				this.randomMove = [randomDir[0] * (Math.random() < 0.5 ? -1 : 1), randomDir[1] * (Math.random() < 0.5 ? -1 : 1)];
				requestAnimationFrame(this.gameLoop);
			}
			return;
		}

		if (this.randomMoveCountdown > 0) {
			this.view.moveDelta(this.randomMove[0] * currentSpeed * deltaTime, this.randomMove[1] * currentSpeed * deltaTime);
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
			this.view.moveDelta(- currentSpeed * deltaTime, 0);
		} else {
			this.view.moveDelta(currentSpeed * deltaTime, 0);
		}

		if (emu.y() > this.targetY) {
			this.view.moveDelta(0, - currentSpeed * deltaTime);
		} else {
			this.view.moveDelta(0, currentSpeed * deltaTime);
		}

		// Request the next frame
		requestAnimationFrame(this.gameLoop);
	}

	setTarget = (target: Konva.Shape): void => {
		this.targetX = target.x();
		this.targetY = target.y();
	}

	hasTarget(): boolean {
		return !!(this.targetX && this.targetY);
	}

	getView(): Konva.Image | null {
		return this.view.getView();
	}

	remove(): void {
		this.view.removeFromGroup();
	}

	setActive(isActive: boolean): void {
		this.active = isActive;
	}

	isActive(): boolean {
		return this.active;
	}

	reduceHealth(amount: number): void {
    	this.model.decrementHealth(amount);
	}

	getDamage(): number {
		return this.model.getDamage();
	}

	getId(): number {
		return this.id;
	}

	setSpeedModifier(modifier: number): void {
		this.speedModifier = modifier;
	}

	setBlocked(blocked: boolean): void {
		this.isBlocked = blocked;
	}

	isBlockedByDefense(): boolean {
		return this.isBlocked;
	}
}
