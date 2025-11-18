import Konva from "konva";
import emuSrc from "../../../assets/Emu.png";

const createImage = (src: string): HTMLImageElement => {
	if (typeof Image !== "undefined") {
		const image = new Image();
		image.src = src;
		return image;
	}

	const fallback = document.createElement("img") as HTMLImageElement;
	fallback.src = src;
	return fallback;
};

/**
 * GameScreenView - Renders the game UI using Konva
 */
export class FarmEmuView {
	private emu: Konva.Image | null = null;

	constructor(group: Konva.Group, startX: number, startY: number) {
		const sprite = createImage(emuSrc);
		this.emu = new Konva.Image({
			x: startX,
			y: startY,
			width: 36,
			height: 36,
			listening: false,
		});

		if (sprite.complete) {
			this.emu.image(sprite);
		} else {
			sprite.onload = () => {
				this.emu?.image(sprite);
				this.emu?.getLayer()?.batchDraw();
			};
		}

		group.add(this.emu);
	}

	/**
	 * Move the player a certain distance in a cardinal vector
	 *
	 * @param dx
	 * @param dy
	 */
	moveDelta(dx: number, dy: number): void {
		if (!this.emu) return;
		this.emu.x(this.emu.x() + dx);
		this.emu.y(this.emu.y() + dy);
	}

	getView(): Konva.Image | null {
		return this.emu;
	}

	removeFromGroup(): void{
		this.emu?.remove();
	}
}
