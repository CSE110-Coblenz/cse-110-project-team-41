import { STARTING_EMU_COUNT } from "../constants";

type Inventory = Record<string, number>;

type PersistedState = {
    day: number;
    money: number;
    inventory: Inventory;
    emuCount: number;
};

const STORAGE_KEY = "game:status";

/**
 * GameStatusController - Coordinates higher game status
 * Holds day progression, money, and simple inventory for morning events.
 */
export class GameStatusController {
    private emuCount: number;
    private day: number;
    private money: number;
    private inventory: Inventory;

    constructor() {
        const saved = this.load();
        if (saved) {
            this.day = saved.day;
            this.money = saved.money;
            this.inventory = saved.inventory;
            this.emuCount = saved.emuCount;
        } else {
            this.day = 1;
            this.money = 0;
            this.inventory = {};
            this.emuCount = STARTING_EMU_COUNT;
            this.save();
        }
    }

    // Persistence
    private save(): void {
        const s: PersistedState = {
            day: this.day,
            money: this.money,
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

    // Money helpers
    getMoney(): number { return this.money; }

    addMoney(amount: number): void {
        this.money = Math.max(0, this.money + amount);
        this.save();
    }

    canAfford(cost: number): boolean { return this.money >= cost; }

    spend(cost: number): boolean {
        if (this.money < cost) return false;
        this.money -= cost;
        this.save();
        return true;
    }

    // Inventory helpers
    getItemCount(name: string): number {
        return this.inventory[name] ?? 0;
    }

    addToInventory(name: string, qty: number): void {
        const current = this.inventory[name] ?? 0;
        this.inventory[name] = Math.max(0, current + qty);
        this.save();
    }

    removeFromInventory(name: string, qty: number): boolean {
        const current = this.inventory[name] ?? 0;
        if (current < qty) return false;
        this.inventory[name] = current - qty;
        this.save();
        return true;
    }

    /**
     * Get final score (use days survived for now)
     */
    getFinalScore(): number {
        return this.day;
    }
}
