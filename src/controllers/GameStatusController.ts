import { GameItem, STARTING_EMU_COUNT } from "../constants";

export type Inventory = Record<GameItem, number>;

type PersistedState = {
    day: number;
    inventory: Inventory;
    emuCount: number;
};

const STORAGE_KEY = "game:status";

/**
 * GameStatusController - Coordinates higher game status
 * Holds day progression, money, and simple inventory for morning events.
 */
export class GameStatusController {
    private emuCount!: number;
    private day!: number;
    private inventory!: Inventory;

    constructor() {
        const saved = this.load();
        if (saved) {
            this.day = saved.day;
            this.inventory = saved.inventory;
            this.emuCount = saved.emuCount;
        } else {
            this.reset();
        }
    }

    // Persistence
    private save(): void {
        const s: PersistedState = {
            day: this.day,
            inventory: this.inventory,
            emuCount: this.emuCount,
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
    }

	public saveState(): void {
		this.save();
	}

    private load(): PersistedState | null {
        try {
            const str = localStorage.getItem(STORAGE_KEY);
            if (!str) return null;
            return JSON.parse(str) as PersistedState;
        } catch {
            return null;
        }
    }

    // Day progression
    getDay(): number { return this.day; }

    endDay(): void {
        // For now, just increment the day counter.
        this.day = this.day + 1;
        this.save();
    }

    canAfford(cost: number): boolean { return this.inventory.money >= cost; }

    spend(cost: number): boolean {
        if (this.inventory.money < cost) return false;
        this.inventory.money -= cost;
        this.save();
        return true;
    }

    getInventory(): Inventory {
        return this.inventory;
    }

    // Inventory helpers
    getItemCount(item: GameItem): number {
        return this.inventory[item] ?? 0;
    }

    addToInventory(item: GameItem, qty: number): void {
        const current = this.inventory[item] ?? 0;
        this.inventory[item] = Math.max(0, current + qty);
        this.save();
    }

    removeFromInventory(item: GameItem, qty: number): boolean {
        const current = this.inventory[item] ?? 0;
        if (current < qty) return false;
        this.inventory[item] = current - qty;
        this.save();
        return true;
    }

    /**
     * Get final score (use days survived for now)
     */
    getFinalScore(): number {
        return this.day;
    }

    /**
	 * Resets the game status to initial values.
	 */
    public reset(): void {
		this.day = 1;
		this.inventory = {
            money: 0,
            crop: 0,
            mine: 0,
            egg: 0
        };
		this.emuCount = STARTING_EMU_COUNT;
		this.save(); 
	}
}
