import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

/**
 * GameScreenView - Renders the game UI using Konva
 */
export class FarmScreenView implements View {
	private group: Konva.Group;
	private lemonImage: Konva.Image | Konva.Circle | null = null;
	private scoreText: Konva.Text;
	private timerText: Konva.Text;

	constructor(onLemonClick: () => void) {
		this.group = new Konva.Group({ visible: false });

		// Background
		const bg = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "#87CEEB", // Sky blue
		});
		this.group.add(bg);

		// Score display (top-left)
		this.scoreText = new Konva.Text({
			x: 20,
			y: 20,
			text: "Score: 0",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "black",
		});
		this.group.add(this.scoreText);

		// Timer display (top-right)
		this.timerText = new Konva.Text({
			x: STAGE_WIDTH - 150,
			y: 20,
			text: "Time: 60",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "red",
		});
		this.group.add(this.timerText);

		// TODO: Task 2 - Load and display lemon image using Konva.Image.fromURL()
		// Placeholder circle (remove this when implementing the image)
		Konva.Image.fromURL("/lemon.png", (image) => {
			image.on("click", onLemonClick);
			image.width(100);
			image.height(100);
			image.x((STAGE_WIDTH / 2) - 50);
			image.y((STAGE_HEIGHT / 2) - 50);
			this.lemonImage = image;
			this.group.add(image);
		})
	}

	/**
	 * Update score display
	 */
	updateScore(score: number): void {
		this.scoreText.text(`Score: ${score}`);
		this.group.getLayer()?.draw();
	}

	/**
	 * Randomize lemon position
	 */
	randomizeLemonPosition(): void {
		if (!this.lemonImage) return;

		// Define safe boundaries (avoid edges)
		const padding = 100;
		const minX = padding;
		const maxX = STAGE_WIDTH - padding;
		const minY = padding;
		const maxY = STAGE_HEIGHT - padding;

		// Generate random position
		const randomX = Math.random() * (maxX - minX) + minX;
		const randomY = Math.random() * (maxY - minY) + minY;

		// Update lemon position
		this.lemonImage.x(randomX);
		this.lemonImage.y(randomY);
		this.group.getLayer()?.draw();
	}

	/**
	 * Update timer display
	 */
	updateTimer(timeRemaining: number): void {
		this.timerText.text(`Time: ${timeRemaining}`);
		this.group.getLayer()?.draw();
	}

	/**
	 * Show the screen
	 */
	show(): void {
		this.group.visible(true);
		this.group.getLayer()?.draw();
	}

	/**
	 * Hide the screen
	 */
	hide(): void {
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}
