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
	private nameInput: HTMLInputElement;
	private name: string;

	constructor(
		onPlayAgainClick: () => void, 
		onNameEntered: (name: string) => void
	) {
		this.group = new Konva.Group({ visible: false });
		this.name = "Anonymous";

		this.nameInput = document.createElement("input");
		this.nameInput.type = "text";
		this.nameInput.placeholder = "Enter your name";
		Object.assign(this.nameInput.style, {
		position: "absolute",
		fontSize: "20px",
		padding: "5px 10px",
		borderRadius: "6px",
		border: "2px solid #666",
		display: "none",
		});
		document.body.appendChild(this.nameInput);

		this.nameInput.addEventListener("mousedown", (e) => e.stopPropagation());
		this.nameInput.addEventListener("click", (e) => e.stopPropagation());

		this.nameInput.addEventListener("keydown", (e) => {
			e.stopPropagation();
			console.log("keydown on input:", e.key);
			if (e.key === "Enter") {
				this.name = this.nameInput.value.trim();
				console.log("Player name set to:", this.name);
				this.hideInput();
				this.nameInput.blur();
				onNameEntered(this.name); 
			} else if (e.key === "Escape") {
				this.hideInput();
				this.nameInput.blur();
			}
		});

		// "Game Over" title
		const title = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 30,
			text: "GAME OVER!",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "red",
			align: "center",
		});
		title.offsetX(title.width() / 2);
		this.group.add(title);

		// Final score display
		this.finalScoreText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 100,
			text: "Final Score: 0; Days Survived: 0",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "black",
			align: "center",
		});
		this.group.add(this.finalScoreText);

		// Leaderboard display
		this.leaderboardText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 150,
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
	updateFinalResults(survivalDays:number, score: number): void {
		this.finalScoreText.text(`Final Score: ${score}    Days Survived: ${survivalDays}`);
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
        let text = "LEADERBOARD:\n";
        entries.forEach((entry, index) => {
			text += `${index + 1}. ${entry.name}: ${entry.score} pts - ${entry.survivalDays} days - ${entry.timestamp}\n`;        });
        this.leaderboardText.text(text);
    }

    // Re-center after text change
    this.leaderboardText.offsetX(this.leaderboardText.width() / 2);
    this.group.getLayer()?.draw();
	}

	showNameInput(): void {
		const left = STAGE_WIDTH / 2 - 150; 
		const top = 360; 
		this.nameInput.value = "";
		this.nameInput.style.left = `${left}px`;
		this.nameInput.style.top = `${top}px`;
		this.nameInput.style.width = `300px`;
		this.nameInput.style.display = "block";

		this.nameInput.focus();
		this.nameInput.select();
	}

	/**
	 * Show the screen
	 */
	show(): void {
		this.group.visible(true);
		this.group.getLayer()?.draw();
		this.showNameInput();
	}
	hideInput(): void {
   		this.nameInput.style.display = "none";
  	}
	/**
	 * Hide the screen
	 */
	hide(): void {
		this.group.visible(false);
		this.hideInput();  
		this.group.getLayer()?.draw();
	}

	/**
	 * Get the player name from input
	 */
	getPlayerName(): string {
    	return (this.name || "Anonymous").trim();;
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}
