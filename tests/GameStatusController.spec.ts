import { describe, expect, it } from "vitest";
import { GameStatusController } from "../src/controllers/GameStatusController.ts";

describe("GameStatusController", () => {
	const createStatus = (): GameStatusController => new GameStatusController();

	it("adds and spends money with floor at zero", () => {
		const status = createStatus();
		// Controller now starts with $40
		expect(status.getMoney()).toBe(40);
		
		status.addMoney(50);
		expect(status.getMoney()).toBe(90);

		expect(status.spend(30)).toBe(true);
		expect(status.getMoney()).toBe(60);

		expect(status.spend(65)).toBe(false);
		expect(status.getMoney()).toBe(60);

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

