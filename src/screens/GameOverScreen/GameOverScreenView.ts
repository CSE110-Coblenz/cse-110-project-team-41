import Konva from "konva";
import type { View } from "../../types.ts";
import type { LeaderboardEntry } from "./GameOverScreenModel.ts";
import { STAGE_WIDTH } from "../../constants.ts";

/**
 * ResultsScreenView - Renders the results screen
 */
export class GameOverScreenView implements View {
	private group: Konva.Group;
	private finalScoreText: Konva.Text;
	private leaderboardText: Konva.Text;

	constructor(onPlayAgainClick: () => void) {
		this.group = new Konva.Group({ visible: false });

		// "Game Over" title
		const title = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 100,
			text: "GAME OVER!",
			fontSize: 48,
			fontFamily: "Arial",
			fill: "red",
			align: "center",
		});
		title.offsetX(title.width() / 2);
		this.group.add(title);

		// Final score display
		this.finalScoreText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 200,
			text: "Final Score: 0",
			fontSize: 36,
			fontFamily: "Arial",
			fill: "black",
			align: "center",
		});
		this.group.add(this.finalScoreText);

		// Leaderboard display
		this.leaderboardText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 260,
			text: "Top Scores:\n(Play to see your scores!)",
			fontSize: 18,
			fontFamily: "Arial",
			fill: "#666",
			align: "center",
			lineHeight: 1.5,
		});
		this.leaderboardText.offsetX(this.leaderboardText.width() / 2);
		this.group.add(this.leaderboardText);

		// Play Again button (grouped) - moved down to make room for leaderboard
		const playAgainButtonGroup = new Konva.Group();
		const playAgainButton = new Konva.Rect({
			x: STAGE_WIDTH / 2 - 100,
			y: 480,
			width: 200,
			height: 60,
			fill: "blue",
			cornerRadius: 10,
			stroke: "darkblue",
			strokeWidth: 3,
		});
		const playAgainText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 495,
			text: "PLAY AGAIN",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
		});
		playAgainText.offsetX(playAgainText.width() / 2);
		playAgainButtonGroup.add(playAgainButton);
		playAgainButtonGroup.add(playAgainText);

		// Button interaction - on the group
		playAgainButtonGroup.on("click", onPlayAgainClick);

		this.group.add(playAgainButtonGroup);
	}

	/**
	 * Update the final score display
	 */
	updateFinalScore(score: number): void {
		this.finalScoreText.text(`Final Score: ${score}`);
		// Re-center after text change
		this.finalScoreText.offsetX(this.finalScoreText.width() / 2);
		this.group.getLayer()?.draw();
	}

	/**
	 * Update the leaderboard display
	 */
	updateLeaderboard(entries: LeaderboardEntry[]): void {
		if (entries.length === 0) {
			this.leaderboardText.text("Top Scores:\n(No scores yet!)");
		} else {
			let text = "Top Scores:\n";
			entries.forEach((entry, index) => {
				text += `${index + 1}. ${entry.score} - ${entry.timestamp}\n`;
			});
			this.leaderboardText.text(text);
		}
		// Re-center after text change
		this.leaderboardText.offsetX(this.leaderboardText.width() / 2);
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
