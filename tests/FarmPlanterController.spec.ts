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

	setOnHover(_cb: (isEmpty: boolean) => void): void {
		// no-op - required by controller
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
	it("starts empty and can be planted", () => {
		const controller = new FarmPlanterController(null as unknown as Konva.Group, 10, 10);
		expect(controller.isEmpty()).toBe(true);
		expect(controller.getStage()).toBe(-1);
	});

	it("only advances planted crops, not empty slots", () => {
		const controller = new FarmPlanterController(null as unknown as Konva.Group, 10, 10);
		expect(controller.isEmpty()).toBe(true);
		controller.advanceDay();
		expect(controller.isEmpty()).toBe(true);
		expect(controller.getStage()).toBe(-1);
	});
});

