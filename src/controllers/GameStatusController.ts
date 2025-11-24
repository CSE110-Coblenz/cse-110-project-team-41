import { STARTING_EMU_COUNT, GameItem } from "../constants";

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

    // Money helpers (backward compatible!)
    getMoney(): number { 
        return this.getItemCount(GameItem.Money); 
    }

    addMoney(amount: number): void {
        this.addToInventory(GameItem.Money, amount);
    }

    canAfford(cost: number): boolean { 
        return this.inventory[GameItem.Money] >= cost; 
    }

    spend(cost: number): boolean {
        if (this.inventory[GameItem.Money] < cost) return false;
        this.inventory[GameItem.Money] -= cost;
        this.save();
        return true;
    }

    // Get full inventory (useful for UI)
    getInventory(): Inventory {
        return this.inventory;
    }

    // Inventory helpers (now type-safe!)
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
	 * Adds collected eggs to the main game's inventory.
	 * Now uses the unified inventory system!
	 */
	public addEmuEggs(amount: number): void {
		this.addToInventory(GameItem.Egg, amount);
		console.log(`Total eggs: ${this.getItemCount(GameItem.Egg)}`);
	}

	/**
	 * Gets the total number of emu eggs.
	 * Now uses the unified inventory system!
	 */
	public getEmuEggCount(): number {
		return this.getItemCount(GameItem.Egg);
	}

	/**
	 * Reset game state for a new game
	 */
	reset(): void {
		this.day = 1;
		this.inventory = {
			[GameItem.Money]: 40,        // Starting money
			[GameItem.Crop]: 0,
			[GameItem.Mine]: 0,
			[GameItem.Egg]: 0,
			[GameItem.BarbedWire]: 0,
			[GameItem.Sandbag]: 0,
			[GameItem.MachineGun]: 0,
		};
		this.emuCount = STARTING_EMU_COUNT;
		this.save();
	}
}
