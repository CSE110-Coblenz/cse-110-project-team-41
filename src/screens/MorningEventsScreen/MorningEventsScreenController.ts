import { ScreenController, type ScreenSwitcher } from "../../types.ts";
import { MorningEventsScreenView } from "./MorningEventsScreenView.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import { AudioManager } from "../../services/AudioManager.ts";
import { QuizController, type QuizFact } from "../../controllers/QuizController.ts";
import { GameItem, ItemCosts } from "../../constants.ts";

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
            (item: GameItem) => this.handleBuy(item),
            (item: GameItem) => this.handleSell(item),
            () => this.handleContinue(),
            () => this.handleOpenQuiz(),
            (idx) => this.handleQuizChoice(idx),
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
        this.view.updateInventory(this.status.getInventory());
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
            this.view.setInfoText(fact.fact);
        } else {
            if (!quizUnlocked) {
                this.view.setInfoText(fact.fact);
            } else {
                this.view.setInfoText(fact.fact);
            }
            this.currentDueQuiz = null;
            this.view.setDailyQuizButtonVisible(false);
        }
    }

    private handleBuy(item: GameItem): void {
        const cost = ItemCosts[item];
        if (this.status.spend(cost)) {
            this.status.addToInventory(item, 1);
            this.audio.playSfx("buy");
            this.refreshUI();
        }
    }

    private handleSell(item: GameItem): void {
        const price = ItemCosts[item];
        if (this.status.removeFromInventory(item, 1)) {
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
        this.screenSwitcher.switchToScreen({ type: "farm" });
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
            this.view.setInfoText("Correct! You received 1 Mine. Press M in the farm to deploy it.");
        } else {
            this.view.setInfoText("Incorrect this time! Keep an eye on the facts and try again next time.");
        }
        this.quiz.completeQuiz(dueDay);
        this.currentDueQuiz = null;
        this.view.hideQuizPopup();
        this.view.setDailyQuizButtonVisible(false);
        this.view.updateInventory(this.status.getInventory());
    }
}
