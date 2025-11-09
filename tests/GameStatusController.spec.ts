import { describe, expect, it } from "vitest";
import { GameStatusController } from "../src/controllers/GameStatusController.ts";

describe("GameStatusController", () => {
	const createStatus = (): GameStatusController => new GameStatusController();

	it("adds and spends money with floor at zero", () => {
		const status = createStatus();
		status.addMoney(50);
		expect(status.getMoney()).toBe(50);

		expect(status.spend(30)).toBe(true);
		expect(status.getMoney()).toBe(20);

		expect(status.spend(25)).toBe(false);
		expect(status.getMoney()).toBe(20);

		status.addMoney(-100);
		expect(status.getMoney()).toBe(0);
	});

	it("manages inventory counts", () => {
		const status = createStatus();
		expect(status.getItemCount("crop")).toBe(0);

		status.addToInventory("crop", 3);
		expect(status.getItemCount("crop")).toBe(3);

		expect(status.removeFromInventory("crop", 2)).toBe(true);
		expect(status.getItemCount("crop")).toBe(1);

		expect(status.removeFromInventory("crop", 5)).toBe(false);
		expect(status.getItemCount("crop")).toBe(1);
	});
});

