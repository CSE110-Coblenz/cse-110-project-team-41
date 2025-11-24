import { PlanningPhaseView } from "./PlanningPhaseView.ts";
import type { DefenseType } from "../../components/DefenseComponent/DefenseModel.ts";

export class PlanningPhaseController {
	private view: PlanningPhaseView;

	constructor() {
		this.view = new PlanningPhaseView();
	}

	setDefenseInventory(inventory: Record<string, number>): void {
		this.view.setDefenseInventory(inventory);
	}

	getView(): PlanningPhaseView {
		return this.view;
	}

	setOnStartRound(handler: () => void): void {
		this.view.setOnStartRound(handler);
	}

	setOnDefenseSelected(handler: (type: DefenseType | null) => void): void {
		this.view.setOnDefenseSelected(handler);
	}

	getSelectedDefenseType(): DefenseType | null {
		return this.view.getSelectedDefenseType();
	}

	show(): void {
		this.view.show();
	}

	hide(): void {
		this.view.hide();
	}

	clearSelection(): void {
		this.view.clearSelection();
	}
}

