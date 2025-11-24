// Stage dimensions
export const STAGE_WIDTH = 800;
export const STAGE_HEIGHT = 600;

// Game settings
export const GAME_DURATION = 60; // seconds

export const STARTING_EMU_COUNT = 1000

export const PLAYER_SPEED = 100 // pixels per second
export const EMU_SPEED = 40
export const EMU_WALK_RANDOMIZATION = 0.2;
export const PLANTER_HEIGHT = 20;
export const PLANTER_WIDTH = 40;
export const ONE_OVER_ROOT_TWO = 1 / Math.sqrt(2);

// HUD layout constants
export const HUD_HEIGHT = 80; // Height of the HUD banner
export const GAME_AREA_Y = HUD_HEIGHT; // Game area starts below HUD
export const GAME_AREA_HEIGHT = STAGE_HEIGHT - HUD_HEIGHT; // Available game area height

// Type-safe inventory items (using object with as const for erasableSyntaxOnly)
export const GameItem = {
    Money: "money",
    Crop: "crop",
    Mine: "mine",
    Egg: "egg",
    BarbedWire: "barbed_wire",
    Sandbag: "sandbag",
    MachineGun: "machine_gun",
} as const;

export type GameItem = typeof GameItem[keyof typeof GameItem];

// Centralized item costs/prices
// Note: Crop buy cost is 10, sell price is 5 (loss on purpose for game balance)
export const ItemCosts: Record<GameItem, number> = {
    [GameItem.Money]: 1,
    [GameItem.Crop]: 5,  // Sell price (buy cost is hardcoded at 10 in morning events)
    [GameItem.Mine]: 20,
    [GameItem.Egg]: 35,
    [GameItem.BarbedWire]: 15,
    [GameItem.Sandbag]: 20,
    [GameItem.MachineGun]: 25,
};

// Crop buy cost (separate from sell price)
export const CROP_BUY_COST = 10;