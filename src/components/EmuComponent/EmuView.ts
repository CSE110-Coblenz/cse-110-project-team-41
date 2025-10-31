import Konva from "konva";

/**
 * GameScreenView - Renders the game UI using Konva
 */
export class EmuView {
	private emu: Konva.Rect | null = null;

	constructor(group: Konva.Group, startX: number, startY: number) {
		this.emu = new Konva.Rect({
			x: startX,
			y: startY,
			width: 30,
			height: 30,
			fill: "#0000AA",
		});
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

	getView(): Konva.Rect | null {
		return this.emu;
	}
}
