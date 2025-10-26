import { STARTING_EMU_COUNT } from "../constants";

/**
 * GameStatusController - Coordinates higher game status
 */
export class GameStatusController {
    private emuCount: number;

    constructor() {
        this.emuCount = STARTING_EMU_COUNT;
    }

    /**
     * End the day and re-assess status
     */
    private endDay(): void {
        return;
    }

    /**
     * Get final score
     */
    getFinalScore(): number {
        return 0;
    }
}
