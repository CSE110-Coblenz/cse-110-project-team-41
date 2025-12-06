import { ScreenController, type ScreenSwitcher } from "../../types.ts";
import { MorningEventsScreenView } from "./MorningEventsScreenView.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import { AudioManager } from "../../services/AudioManager.ts";
import { QuizController, type QuizFact } from "../../controllers/QuizController.ts";
import { DEFENSE_CONFIGS, type DefenseType } from "../../components/DefenseComponent/DefenseModel.ts";
import { GameItem, ItemCosts, CROP_BUY_COST } from "../../constants.ts";

/**
 * MorningEventsScreenController - Handles morning screen interactions
 */
export class MorningEventsScreenController extends ScreenController {
    private view: MorningEventsScreenView;
    private screenSwitcher: ScreenSwitcher;
    private status: GameStatusController;
    private audio: AudioManager;
    private overlayClose: (() => void) | null = null;
    private quiz: QuizController;
    private dayOverride: number | null = null;
    private currentDueQuiz: { fact: QuizFact; dueDay: number } | null = null;

    constructor(screenSwitcher: ScreenSwitcher, status: GameStatusController, audio: AudioManager) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.status = status;
        this.audio = audio;

        this.quiz = new QuizController();
        this.view = new MorningEventsScreenView(
            () => this.handleBuy(),
            () => this.handleSell(),
            () => this.handleSellEgg(),
            () => this.handleContinue(),
            () => this.handleOpenQuiz(),
            (idx) => this.handleQuizChoice(idx),
            () => this.handleOpenShop(),
            (defenseType) => this.handlePurchaseDefense(defenseType),
        );
    }

    override show(): void {
        this.overlayClose = null;
        this.refreshUI();
        this.view.show();
    }

    showOverlay(onClose: () => void): void {
        this.overlayClose = onClose;
        this.refreshUI();
        this.view.show();
    }

    hideOverlay(): void {
        this.overlayClose = null;
        this.dayOverride = null;
        this.view.hide();
    }

    getView(): MorningEventsScreenView {
        return this.view;
    }

    setDisplayDayOverride(day: number): void {
        this.dayOverride = Math.max(1, day);
    }

    private refreshUI(): void {
        const dayToShow = this.dayOverride ?? this.status.getDay();
        this.view.updateDay(dayToShow);
        this.view.updateMoney(this.status.getMoney());
        this.view.updateInventory(
            this.status.getItemCount(GameItem.Crop),
            this.status.getItemCount(GameItem.Egg)
        );
        this.updateMorningContent();
    }

    private updateMorningContent(): void {
        const currentDay = this.status.getDay();
        const fact = this.quiz.ensureFactForDay(currentDay);
        this.view.hideQuizPopup();

        const due = this.quiz.getDueQuiz(currentDay);
        const quizUnlocked = currentDay >= 4 && due !== null;

        if (quizUnlocked && due) {
            this.currentDueQuiz = { fact: due.fact, dueDay: due.due.dueDay };
            this.view.setDailyQuizButtonVisible(true);
            this.view.setInfoText(`Fact: ${fact.fact}\n(Daily quiz available! Click the button when you're ready.)`);
        } else {
            if (!quizUnlocked) {
                this.view.setInfoText(`Fact: ${fact.fact}\n(Daily quiz unlocks on Day 4. Keep reading!)`);
            } else {
                this.view.setInfoText(`Fact: ${fact.fact}\n(You will be quizzed in 3 days!)`);
            }
            this.currentDueQuiz = null;
            this.view.setDailyQuizButtonVisible(false);
        }
    }

    private handleBuy(): void {
        if (this.status.spend(CROP_BUY_COST)) {
            this.status.addToInventory(GameItem.Crop, 1);
            this.audio.playSfx("buy");
            this.refreshUI();
        }
    }

    private handleSell(): void {
        const price = ItemCosts[GameItem.Crop];
        if (this.status.removeFromInventory(GameItem.Crop, 1)) {
            this.status.addToInventory(GameItem.Money, price);
            this.audio.playSfx("sell");
            this.refreshUI();
        }
    }

    private handleSellEgg(): void {
        const price = ItemCosts[GameItem.Egg];
        if (this.status.removeFromInventory(GameItem.Egg, 1)) {
            this.status.addToInventory(GameItem.Money, price);
            this.audio.playSfx("sell");
            this.refreshUI();
        }
    }

    private handleContinue(): void {
        if (this.overlayClose) {
            const close = this.overlayClose;
            this.hideOverlay();
            close();
            return;
        }

        // Begin the next day by returning to the farm
        this.screenSwitcher.switchToScreen({ type: "farm" , newgame:false});
    }

    private handleOpenQuiz(): void {
        if (!this.currentDueQuiz) {
            this.view.setInfoText("No quiz today. Come back when the Daily Quiz is available.");
            return;
        }
        this.view.showQuizPopup(this.currentDueQuiz.fact.question, this.currentDueQuiz.fact.choices);
    }

    private handleQuizChoice(index: number): void {
        if (!this.currentDueQuiz) return;
        const { fact, dueDay } = this.currentDueQuiz;
        const correct = index === fact.correctIndex;
        if (correct) {
            // Reward: 1 Mine
            this.status.addToInventory(GameItem.Mine, 1);
            this.audio.playSfx("buy"); // Play success sound
            this.view.setInfoText("✓ CORRECT! You received 1 Mine!\nPress M in the farm to deploy it.", "#00aa00", 20); // Green, bigger
        } else {
            this.audio.playSfx("harvest"); // Play failure sound
            this.view.setInfoText("✗ Incorrect. Keep reading the facts and try again next time!", "#cc0000", 18); // Red
        }
        this.quiz.completeQuiz(dueDay);
        this.currentDueQuiz = null;
        this.view.hideQuizPopup();
        this.view.setDailyQuizButtonVisible(false);
        this.view.updateMoney(this.status.getMoney());
        this.view.updateInventory(
            this.status.getItemCount(GameItem.Crop),
            this.status.getItemCount(GameItem.Egg)
        );
    }

    private handleOpenShop(): void {
        const defenseInventory: Record<string, number> = {
            barbed_wire: this.status.getItemCount(GameItem.BarbedWire),
            sandbag: this.status.getItemCount(GameItem.Sandbag),
            machine_gun: this.status.getItemCount(GameItem.MachineGun),
        };
        this.view.showShopPopup(defenseInventory, this.status.getMoney());
    }

    private handlePurchaseDefense(defenseType: string): void {
        const type = defenseType as DefenseType;
        const config = DEFENSE_CONFIGS[type];
        
        if (!config || config.cost === 0) {
            return; // Can't buy mines (special item)
        }

        // Map defense type to GameItem
        const itemMap: Record<DefenseType, GameItem> = {
            'barbed_wire': GameItem.BarbedWire,
            'sandbag': GameItem.Sandbag,
            'machine_gun': GameItem.MachineGun,
            'mine': GameItem.Mine,
        };
        const item = itemMap[type];

        if (this.status.canAfford(config.cost)) {
            if (this.status.spend(config.cost)) {
                this.status.addToInventory(item, 1);
                this.audio.playSfx("buy");
                this.refreshUI();
                // Refresh shop popup to show updated inventory and money
                this.handleOpenShop();
            }
        }
    }
}
