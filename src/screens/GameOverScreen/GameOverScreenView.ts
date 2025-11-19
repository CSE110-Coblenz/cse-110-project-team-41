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
	private name: string = "Anonymous";
	private nameInputContainer: HTMLDivElement;

	constructor(
		onPlayAgainClick: () => void, 
		onNameEntered: (name: string) => void
	) {
		this.group = new Konva.Group({ visible: false });
		
		// Create container for name input UI
		this.nameInputContainer = document.createElement("div");
		Object.assign(this.nameInputContainer.style, {
			position: "absolute",
			display: "none",
			padding: "20px",
			borderRadius: "12px",
			background: "rgba(255, 255, 255, 0.9)",
			boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
			textAlign: "center",
			transform: "translate(-50%, -50%)",
		});

		// Add description text
		const desc = document.createElement("div");
		desc.innerText = "Write down the name you want to show on the leaderboard(max 15 letters):";
		Object.assign(desc.style, {
			fontSize: "18px",
			marginBottom: "10px",
			color: "#333",
			fontFamily: "Arial",
		});
		this.nameInputContainer.appendChild(desc);

		// Create input box
		this.nameInput = document.createElement("input");
		this.nameInput.type = "text";
		Object.assign(this.nameInput.style, {
			width: "260px",
			fontSize: "20px",
			padding: "8px 12px",
			borderRadius: "8px",
			border: "2px solid #888",
			outline: "none",
		});
		this.nameInputContainer.appendChild(this.nameInput);

		// Attach to body
		document.body.appendChild(this.nameInputContainer);

		// Prevent Konva canvas stealing events
		this.nameInput.addEventListener("mousedown", (e) => e.stopPropagation());
		this.nameInput.addEventListener("click", (e) => e.stopPropagation());

		this.nameInput.addEventListener("keydown", (e) => {
			e.stopPropagation();
			//console.log("keydown on input:", e.key);
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
			fontFamily: "Impact, Arial Black, Arial",
			fill: "red",
			align: "center",
		});
		title.offsetX(title.width() / 2);
		this.group.add(title);

		// Final score display
		this.finalScoreText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 100,
			text: "Final Score: 0\nDays Survived: 0",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "black",
			align: "center",
		});
		this.group.add(this.finalScoreText);

		// Leaderboard display
		this.leaderboardText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 160, 
			text: "TOP SCORES\n(Play to see your scores!)",
			fontSize: 18,
			fontFamily: "Courier New, monospace", 
			fill: "#333", // Dark color
			align: "center",
			lineHeight: 1.3,
		});
		this.leaderboardText.offsetX(this.leaderboardText.width() / 2);
		this.group.add(this.leaderboardText);

		// Play Again button (grouped) - moved down to make room for leaderboard
		const playAgainButtonGroup = new Konva.Group();
		const playAgainButton = new Konva.Rect({
				x: STAGE_WIDTH / 2 - 120, 
				y: 480,
				width: 240, 
				height: 60,
				fill: "#28a745", 
				cornerRadius: 15, 
				stroke: "#1e7e34", 
				strokeWidth: 4,
				shadowColor: "black",
				shadowBlur: 5,
				shadowOffset: { x: 3, y: 3 },
				shadowOpacity: 0.5,
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
		playAgainButtonGroup.on("mouseover", function () {
			playAgainButton.fill("#31c750"); // Lighten on hover
			document.body.style.cursor = "pointer";
		});

		playAgainButtonGroup.on("mouseout", function () {
			playAgainButton.fill("#28a745"); // Revert on mouse out
			document.body.style.cursor = "default";
		});

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
			let text = "RANK  NAME                SCORE     DAYS SURVIVED        DATE\n";
            text += "----------------------------------------------------------------\n"; // Increased separator length to match header

            entries.forEach((entry, index) => {
                const rankStr = String(index + 1).padEnd(4, ' ');
                const nameStr = entry.name.substring(0, 15).padEnd(15, ' '); 
                
                const scoreStr = String(entry.score).padStart(8, ' ').padEnd(15, ' '); ;
                
                const daysStr = String(entry.survivalDays).padStart(5, ' ').padEnd(13, ' ');
                
                const dateStr = entry.timestamp.split(',')[0].trim();

                text += `${rankStr} ${nameStr} ${scoreStr} ${daysStr} ${dateStr}\n`;
            });
            this.leaderboardText.text(text);
		}

    // Re-center after text change
    this.leaderboardText.offsetX(this.leaderboardText.width() / 2);
    this.group.getLayer()?.draw();
	}

	showNameInput(): void {
		this.nameInputContainer.style.left = "50%";
		this.nameInputContainer.style.top = "40%";
		this.nameInputContainer.style.display = "block";

		this.nameInput.value = "";
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
		this.nameInputContainer.style.display = "none";	
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
