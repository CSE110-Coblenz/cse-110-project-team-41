import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import {
	GameOverScreenModel,
	type LeaderboardEntry,
} from "./GameOverScreenModel.ts";
import { GameOverScreenView } from "./GameOverScreenView.ts";

const LEADERBOARD_KEY = "lemonClickerLeaderboard";
const MAX_LEADERBOARD_ENTRIES = 5;

/**
 * ResultsScreenController - Handles results screen interactions
 */
export class GameOverScreenController extends ScreenController {
	private model: GameOverScreenModel;
	private view: GameOverScreenView;
	private screenSwitcher: ScreenSwitcher;

	private gameOverSound: HTMLAudioElement;

	constructor(screenSwitcher: ScreenSwitcher) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.model = new GameOverScreenModel();
		this.view = new GameOverScreenView(() => this.handlePlayAgainClick());

		// TODO: Task 4 - Initialize game over sound audio
		this.gameOverSound = new Audio("/gameover.mp3"); // Placeholder
	}

	/**
	 * Show results screen with final score
	 */
	showResults(finalScore: number): void {
		this.model.setFinalScore(finalScore);
		this.view.updateFinalScore(finalScore);

		// Load and update leaderboard
		const entries = this.loadLeaderboard();
		entries.push({
			score: finalScore,
			timestamp: new Date().toLocaleString(),
		});
		entries.sort((a, b) => b.score - a.score); // Sort descending
		const top5 = entries.slice(0, MAX_LEADERBOARD_ENTRIES); // Keep top 5
		this.saveLeaderboard(top5);
		this.model.setLeaderboard(top5);
		this.view.updateLeaderboard(top5);

		this.view.show();

		// TODO: Task 4 - Play the game over sound
		this.gameOverSound.currentTime = 0
		this.gameOverSound.play();
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
		this.screenSwitcher.switchToScreen({ type: "main_menu" });
	}

	/**
	 * Get the view
	 */
	getView(): GameOverScreenView {
		return this.view;
	}
}
