import Konva from "konva";
import type { DefenseType } from "./DefenseModel.ts";
import barbedSrc from "../../../assets/barbed.png";
import sandbagSrc from "../../../assets/sandbag.png";
import gunSrc from "../../../assets/gun.png";

const DEFENSE_SIZE = 30; // Size for most defenses

const loadImage = (src: string): HTMLImageElement => {
	if (typeof Image !== "undefined") {
		const img = new Image();
		img.src = src;
		return img;
	}
	// Fallback for non-browser environments (like tests)
	const img = { src, complete: false, onload: null } as unknown as HTMLImageElement;
	return img;
};

const defenseImages: Partial<Record<DefenseType, HTMLImageElement>> = {
	barbed_wire: loadImage(barbedSrc),
	sandbag: loadImage(sandbagSrc),
	machine_gun: loadImage(gunSrc),
	// Mine handled separately
};

export class DefenseView {
	private defense: Konva.Group;

	constructor(group: Konva.Group, type: DefenseType, x: number, y: number) {
		this.defense = new Konva.Group({
			x,
			y,
		});

		this.createVisual(type);
		group.add(this.defense);
	}

	private createVisual(type: DefenseType): void {
		if (type === "mine") return;

		const image = defenseImages[type];
		if (image) {
			const konvaImage = new Konva.Image({
				x: 0,
				y: 0,
				width: DEFENSE_SIZE,
				height: DEFENSE_SIZE,
				image: image,
			});
			this.defense.add(konvaImage);

			if (!image.complete) {
				image.onload = () => {
					konvaImage.getLayer()?.batchDraw();
				};
			}
		}
	}

	getView(): Konva.Group {
		return this.defense;
	}

	remove(): void {
		this.defense.remove();
	}

	setPosition(x: number, y: number): void {
		this.defense.x(x);
		this.defense.y(y);
	}
}
