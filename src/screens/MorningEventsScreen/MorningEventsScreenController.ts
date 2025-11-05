import { ScreenController, type ScreenSwitcher } from "../../types.ts";
import { MorningEventsScreenModel } from "./MorningEventsScreenModel.ts";
import { MorningEventsScreenView } from "./MorningEventsScreenView.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import { AudioManager } from "../../services/AudioManager.ts";

/**
 * MorningEventsScreenController - Handles morning screen interactions
 */
export class MorningEventsScreenController extends ScreenController {
    private model: MorningEventsScreenModel;
    private view: MorningEventsScreenView;
    private screenSwitcher: ScreenSwitcher;
    private status: GameStatusController;
    private audio: AudioManager;

    constructor(screenSwitcher: ScreenSwitcher, status: GameStatusController, audio: AudioManager) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.status = status;
        this.audio = audio;

        this.model = new MorningEventsScreenModel();
        this.view = new MorningEventsScreenView(
            () => this.handleBuy(),
            () => this.handleSell(),
            () => this.handleContinue()
        );
    }

    override show(): void {
        this.refreshUI();
        this.view.show();
    }

    getView(): MorningEventsScreenView {
        return this.view;
    }

    private refreshUI(): void {
        this.view.updateDay(this.status.getDay());
        this.view.updateMoney(this.status.getMoney());
        this.view.updateInventory(this.status.getItemCount("crop"));
    }

    private handleBuy(): void {
        const cost = this.model.getCropBuyCost();
        if (this.status.spend(cost)) {
            this.status.addToInventory("crop", 1);
            this.audio.playSfx("buy");
            this.refreshUI();
        }
    }

    private handleSell(): void {
        const price = this.model.getCropSellPrice();
        if (this.status.removeFromInventory("crop", 1)) {
            this.status.addMoney(price);
            this.audio.playSfx("sell");
            this.refreshUI();
        }
    }

    private handleContinue(): void {
        // Begin the next day by returning to the farm
        this.screenSwitcher.switchToScreen({ type: "farm" });
    }
}

