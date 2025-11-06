// The size of your maze (e.g., 20 tiles wide by 15 tiles high)
export const MAZE_WIDTH = 20;
export const MAZE_HEIGHT = 15;

// The starting time for the minigame (in seconds)
const MINIGAME_DURATION = 30;
export const EGG_COUNT = 5; // <-- ADDED: Number of eggs to spawn

// Define what each number in the maze layout means
export const TILE_TYPE = {
	PATH: 0,
	WALL: 1,
	START: 2,
	EXIT: 3,
	EGG: 4, // <-- ADDED: A tile with an emu egg
};

export class Minigame1RaidModel {
	public timeRemaining: number;
	public playerPosition: { x: number; y: number }; // Player's position in tile coordinates
	public mazeLayout: number[][]; // 2D array representing the maze
	public eggsCollected: number; // <-- ADDED: Eggs collected this run

	constructor() {
		this.timeRemaining = MINIGAME_DURATION;
		this.playerPosition = { x: 0, y: 0 };
		this.mazeLayout = [];
		this.eggsCollected = 0;
		this.reset();
	}

	/**
	 * Resets the minigame state to its default values.
	 */
	reset(): void {
		this.timeRemaining = MINIGAME_DURATION;
		this.playerPosition = { x: 1, y: 1 };
		this.eggsCollected = 0; // <-- ADDED: Reset egg count
		this.mazeLayout = Array(MAZE_HEIGHT)
			.fill(null)
			.map(() => Array(MAZE_WIDTH).fill(TILE_TYPE.WALL));
	}
}