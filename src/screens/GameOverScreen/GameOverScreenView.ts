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
	private leaderboardGroup: Konva.Group;
	private nameInput: HTMLInputElement;
	private name: string = "Anonymous";
	private nameInputContainer: HTMLDivElement;

	// Fixed X positions for each column center/edge
    private static readonly COLUMN_X = {
        RANK: STAGE_WIDTH / 2 - 330, // Right edge of Rank column
        NAME: STAGE_WIDTH / 2 - 290, // Left edge of Name column
        SCORE: STAGE_WIDTH / 2 + 100,  // Right edge of Score column
        DAYS: STAGE_WIDTH / 2 + 200, // Right edge of Days Survived column
        DATE: STAGE_WIDTH / 2 + 250, // Left edge of Date column
    };
    
    // Starting Y position for the header
    private static readonly START_Y = 160;
    // Line spacing
    private static readonly LINE_HEIGHT = 25;

	constructor(
		onPlayAgainClick: () => void, 
		onNameEntered: (name: string) => void
	) {
		this.group = new Konva.Group({ visible: false });
		this.leaderboardGroup = new Konva.Group(); 
        this.group.add(this.leaderboardGroup); 

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

		// Initialize static header
        this.renderLeaderboardHeader();

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
     * Renders the header row and separator line
     */
    private renderLeaderboardHeader(): void {
        const style = {
            fontSize: 18,
            fontFamily: "Courier New, monospace",
            fill: "#333",
        };

        // Clear previous header/data
        this.leaderboardGroup.destroyChildren();

        // 1. Rank Header (Right-aligned to its column edge)
        const rankHeader = new Konva.Text({
            ...style,
            x: GameOverScreenView.COLUMN_X.RANK,
            y: GameOverScreenView.START_Y,
            text: "RANK",
            align: "right",
        });
        rankHeader.offsetX(rankHeader.width());
        this.leaderboardGroup.add(rankHeader);

        // 2. Name Header (Left-aligned to its column edge)
        this.leaderboardGroup.add(new Konva.Text({
            ...style,
            x: GameOverScreenView.COLUMN_X.NAME,
            y: GameOverScreenView.START_Y,
            text: "NAME",
            align: "left",
        }));
        
        // 3. Score Header (Right-aligned to its column edge)
        const scoreHeader = new Konva.Text({
            ...style,
            x: GameOverScreenView.COLUMN_X.SCORE,
            y: GameOverScreenView.START_Y,
            text: "SCORE",
            align: "right",
        });
        scoreHeader.offsetX(scoreHeader.width());
        this.leaderboardGroup.add(scoreHeader);
        
        // 4. Days Survived Header (Right-aligned to its column edge)
        const daysHeader = new Konva.Text({
            ...style,
            x: GameOverScreenView.COLUMN_X.DAYS,
            y: GameOverScreenView.START_Y,
            text: "DAYS",
            align: "right",
        });
        daysHeader.offsetX(daysHeader.width());
        this.leaderboardGroup.add(daysHeader);
        
        // 5. Date Header (Left-aligned to its column edge)
        this.leaderboardGroup.add(new Konva.Text({
            ...style,
            x: GameOverScreenView.COLUMN_X.DATE,
            y: GameOverScreenView.START_Y,
            text: "DATE",
            align: "left",
        }));

        // Separator Line
        const separatorLine = new Konva.Line({
            points: [
                GameOverScreenView.COLUMN_X.RANK - 50, 
                GameOverScreenView.START_Y + GameOverScreenView.LINE_HEIGHT * 2 / 3, 
                GameOverScreenView.COLUMN_X.DATE + 120, 
                GameOverScreenView.START_Y + GameOverScreenView.LINE_HEIGHT * 2 / 3
            ],
            stroke: '#666',
            strokeWidth: 2,
        });
        this.leaderboardGroup.add(separatorLine);
    }


	/**
	 * Update the leaderboard display
	 */
	updateLeaderboard(entries: LeaderboardEntry[]): void {
        // Clear previous entries but keep the header
        const children = this.leaderboardGroup.getChildren();
        // Index 6 is the first entry (children 0-5 are the header elements and separator)
        for (let i = children.length - 1; i >= 6; i--) {
            children[i].destroy();
        }

		if (entries.length === 0) {
            // Display 'No scores' message centered below the header
            const noScoreText = new Konva.Text({
                x: STAGE_WIDTH / 2,
                y: GameOverScreenView.START_Y + GameOverScreenView.LINE_HEIGHT * 2,
                text: "(No scores yet!)",
                fontSize: 18,
                fontFamily: "Arial",
                fill: "#999",
                align: "center",
            });
            noScoreText.offsetX(noScoreText.width() / 2);
			this.leaderboardGroup.add(noScoreText);
		} else {
            const dataStyle = {
                fontSize: 18,
                fontFamily: "Courier New, monospace", // Keep monospace for consistent vertical spacing
                fill: "black",
            };
            
            entries.forEach((entry, index) => {
                const yPos = GameOverScreenView.START_Y + GameOverScreenView.LINE_HEIGHT * (index + 1);

                // 1. Rank (Right-aligned)
                const rankText = new Konva.Text({
                    ...dataStyle,
                    x: GameOverScreenView.COLUMN_X.RANK,
                    y: yPos,
                    text: String(index + 1),
                    align: "right",
                });
                // Shift text origin to the right side of the text box (for right alignment)
                rankText.offsetX(rankText.width());
                this.leaderboardGroup.add(rankText);

                // 2. Name (Left-aligned)
                const nameText = new Konva.Text({
                    ...dataStyle,
                    x: GameOverScreenView.COLUMN_X.NAME,
                    y: yPos,
                    text: entry.name.substring(0, 15),
                    align: "left",
                });
                this.leaderboardGroup.add(nameText);
                
                // 3. Score (Right-aligned)
                const scoreText = new Konva.Text({
                    ...dataStyle,
                    x: GameOverScreenView.COLUMN_X.SCORE,
                    y: yPos,
                    text: String(entry.score),
                    align: "right",
                });
                scoreText.offsetX(scoreText.width());
                this.leaderboardGroup.add(scoreText);

                // 4. Survival Days (Right-aligned)
                const daysText = new Konva.Text({
                    ...dataStyle,
                    x: GameOverScreenView.COLUMN_X.DAYS,
                    y: yPos,
                    text: String(entry.survivalDays),
                    align: "right",
                });
                daysText.offsetX(daysText.width());
                this.leaderboardGroup.add(daysText);
                
                // 5. Date (Left-aligned)
                const dateText = new Konva.Text({
                    ...dataStyle,
                    x: GameOverScreenView.COLUMN_X.DATE,
                    y: yPos,
                    text: entry.timestamp.split(',')[0].trim(),
                    align: "left",
                });
                this.leaderboardGroup.add(dateText);
            });
		}

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
