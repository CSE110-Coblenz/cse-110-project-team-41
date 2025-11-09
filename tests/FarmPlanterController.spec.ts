import { describe, expect, it, vi } from "vitest";
import type Konva from "konva";
import { FarmPlanterController } from "../src/components/FarmPlanterComponent/FarmPlanterController.ts";

class FakePlanterView {
	private handler: (() => void) | null = null;
	stage = 0;

	constructor(_group: Konva.Group, _x: number, _y: number) {
		// no-op
	}

	onClick(cb: () => void): void {
		this.handler = cb;
	}

	setStage(stage: number): void {
		this.stage = stage;
	}

	getView(): { fire: (event: string) => void } {
		return {
			fire: (event: string) => {
				if (event === "click") {
					this.triggerClick();
				}
			},
		};
	}

	triggerClick(): void {
		this.handler?.();
	}
}

let latestView: FakePlanterView | null = null;

vi.mock("../src/components/FarmPlanterComponent/FarmPlanterView.ts", () => ({
	FarmPlanterView: vi.fn((group: Konva.Group, x: number, y: number) => {
		latestView = new FakePlanterView(group, x, y);
		return latestView;
	}),
}));

describe("FarmPlanterController", () => {
	it("invokes harvest handler only when crop is fully grown", () => {
		const controller = new FarmPlanterController(null as unknown as Konva.Group, 10, 10);
		const onHarvest = vi.fn();
		controller.setOnHarvest(onHarvest);

		controller.advanceDay();
		controller.advanceDay();

		latestView?.triggerClick();

		expect(onHarvest).toHaveBeenCalledTimes(1);
		expect(controller.getStage()).toBe(0);
	});
});

