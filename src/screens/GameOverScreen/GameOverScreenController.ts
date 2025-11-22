import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import {
	GameOverScreenModel,
	type LeaderboardEntry,
} from "./GameOverScreenModel.ts";
import { GameOverScreenView } from "./GameOverScreenView.ts";
import { AudioManager } from "../../services/AudioManager.ts";
import type { GameStatusController } from "../../controllers/GameStatusController.ts";

const LEADERBOARD_KEY = "farmDefenseLeaderboard";
const MAX_LEADERBOARD_ENTRIES = 10;

/**
 * ResultsScreenController - Handles results screen interactions
 */
export class GameOverScreenController extends ScreenController {
	private model: GameOverScreenModel;
	private view: GameOverScreenView;
	private screenSwitcher: ScreenSwitcher;
	private status: GameStatusController ;
	private audio: AudioManager;

	constructor(screenSwitcher: ScreenSwitcher, status: GameStatusController ,audio: AudioManager) {
		super();
		this.status = status;
		this.screenSwitcher = screenSwitcher;
		this.model = new GameOverScreenModel();
		this.view = new GameOverScreenView(
			() => this.handlePlayAgainClick(),
			(name) => this.handleNameEntered(name)
		);

		this.audio = audio;
	}

	

	/**
	 * Show results screen with final score
	 */
	showFinalResults(survivalDays: number, finalScore: number): void {
		this.model.setFinalResults(survivalDays, finalScore);
		this.view.updateFinalResults(survivalDays,finalScore);

		// Load and update leaderboard
		const entries = this.loadLeaderboard();
		this.model.setLeaderboard(entries);
		this.view.updateLeaderboard(entries);

		// Check if this is a high score
		const isHighScore = this.checkIfQualifies(entries, finalScore, survivalDays);

		// Pass the boolean to the view
		this.view.show(isHighScore);

		// Play a game over sound effect (BGM handled by App)
		this.audio.playSfx("gameover");
	}

	/**
	 * Check if the current score qualifies for the top 10
	 */
	private checkIfQualifies(entries: LeaderboardEntry[], score: number, days: number): boolean {
		// If leaderboard isn't full, any score qualifies
		if (entries.length < MAX_LEADERBOARD_ENTRIES) {
			return true;
		}

		// Get the last entry (lowest rank)
		// Assumes entries are already sorted (which they are when saved)
		const lastEntry = entries[entries.length - 1];

		// Check if current score is better than the last entry
		if (score > lastEntry.score) {
			return true;
		}

		// If scores are equal, check survival days
		if (score === lastEntry.score && days > lastEntry.survivalDays) {
			return true;
		}

		return false;
	}

	private handleNameEntered(name: string): void {
		if (name.length === 0) {
			name = "Anonymous";
		}
		const MAX_NAME_LENGTH = 15; 
		if (name.length > MAX_NAME_LENGTH) {
			name = name.substring(0, MAX_NAME_LENGTH);
		}
		console.log("Controller received name:", name);

		const survivalDays =this.model.getSurvivalDays();
		const finalScore = this.model.getFinalScore();

		const entries = this.loadLeaderboard();
		entries.push({
			name,
			survivalDays,
			score: finalScore,
			timestamp: new Date().toLocaleString(),
		});

		entries.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			return b.survivalDays - a.survivalDays;
		});

		const top = entries.slice(0, MAX_LEADERBOARD_ENTRIES);
		this.saveLeaderboard(top);
		this.model.setLeaderboard(top);

		this.view.updateLeaderboard(top);
}	

	/**
	 * Load leaderboard from localStorage
	 */
	private loadLeaderboard(): LeaderboardEntry[] {
		let str = localStorage.getItem(LEADERBOARD_KEY)
		if (!str) {
			return [];
		}
		let leaderboard = JSON.parse(str) as LeaderboardEntry[];
		return leaderboard; // Placeholder
	}

	/**
	 * Save leaderboard to localStorage
	 */
	private saveLeaderboard(entries: LeaderboardEntry[]): void {
		let str = JSON.stringify(entries);
		localStorage.setItem(LEADERBOARD_KEY, str);
	}

	/**
	 * Handle play again button click
	 */
	private handlePlayAgainClick(): void {
		this.status.reset();
		this.screenSwitcher.switchToScreen({ type: "main_menu" });
	}

	/**
	 * Get the view
	 */
	getView(): GameOverScreenView {
		return this.view;
	}

}
