/**
 * DefenseModel - Manages defense state
 */
export type DefenseType = "barbed_wire" | "sandbag" | "machine_gun" | "mine";

export interface DefenseConfig {
	cost: number;
	durability: number;
	maxDurability: number;
	effectiveness: number; // 0-1, where 1 is strongest
}

export const DEFENSE_CONFIGS: Record<DefenseType, DefenseConfig> = {
	barbed_wire: {
		cost: 10,
		durability: Infinity, // Reusable
		maxDurability: Infinity,
		effectiveness: 0.3, // Slows emus by 50%
	},
	sandbag: {
		cost: 25,
		durability: 3, // Can be destroyed after 3 hits
		maxDurability: 3,
		effectiveness: 0.5, // Blocks emus temporarily
	},
	machine_gun: {
		cost: 50,
		durability: 10, // Limited ammo
		maxDurability: 10,
		effectiveness: 0.7, // Auto-shoots nearby emus
	},
	mine: {
		cost: 0, // Special - only from quizzes
		durability: 1, // One-time use
		maxDurability: 1,
		effectiveness: 1.0, // Instant kill
	},
};

export class DefenseModel {
	private type: DefenseType;
	private x: number;
	private y: number;
	private durability: number;
	private active: boolean;

	constructor(type: DefenseType, x: number, y: number) {
		this.type = type;
		this.x = x;
		this.y = y;
		const config = DEFENSE_CONFIGS[type];
		this.durability = config.durability === Infinity ? Infinity : config.maxDurability;
		this.active = true;
	}

	getType(): DefenseType {
		return this.type;
	}

	getX(): number {
		return this.x;
	}

	getY(): number {
		return this.y;
	}

	getDurability(): number {
		return this.durability;
	}

	getMaxDurability(): number {
		return DEFENSE_CONFIGS[this.type].maxDurability;
	}

	isActive(): boolean {
		return this.active && (this.durability === Infinity || this.durability > 0);
	}

	takeDamage(amount: number = 1): void {
		if (this.durability === Infinity) {
			return; // Indestructible
		}
		this.durability = Math.max(0, this.durability - amount);
		if (this.durability <= 0) {
			this.active = false;
		}
	}

	getConfig(): DefenseConfig {
		return DEFENSE_CONFIGS[this.type];
	}
}

