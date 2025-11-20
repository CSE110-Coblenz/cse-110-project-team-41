import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";
import backgroundSrc from "../../../assets/background.png";
import stallSrc from "../../../assets/stall.png"

type ButtonSpec = {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fill: string;
};

const loadImage = (src: string): HTMLImageElement => {
    if (typeof Image !== "undefined") {
        const image = new Image();
        image.src = src;
        return image;
    }

    const fallback = document.createElement("img") as HTMLImageElement;
    fallback.src = src;
    return fallback;
};

function makeButton(spec: ButtonSpec, onClick: () => void): Konva.Group {
    const group = new Konva.Group({ cursor: "pointer" });
    const rect = new Konva.Rect({
        x: spec.x,
        y: spec.y,
        width: spec.width,
        height: spec.height,
        fill: spec.fill,
        cornerRadius: 8,
        stroke: "#333",
        strokeWidth: 2,
    });
    const label = new Konva.Text({
        x: spec.x + spec.width / 2,
        y: spec.y + spec.height / 2 - 10,
        text: spec.text,
        fontFamily: "Arial",
        fontSize: 20,
        fill: "white",
        align: "center",
    });
    label.offsetX(label.width() / 2);
    group.add(rect);
    group.add(label);
    group.on("click", onClick);
    group.on("tap", onClick);
    return group;
}

/**
 * MorningEventsScreenView - Renders the morning events UI
 */
export class MorningEventsScreenView implements View {
    private group: Konva.Group;
    private background: Konva.Image;
    private backgroundAnimation: Konva.Animation | null = null;
    private backgroundPhase = 0;
    private titleText: Konva.Text;
    private moneyText: Konva.Text;
    private inventoryText: Konva.Text;
    private infoText: Konva.Text;
    private dailyQuizButton: Konva.Group;
    private quizGroup: Konva.Group | null = null;
    private quizChoiceHandler: ((index: number) => void) | null = null;

    constructor(
        onBuy: () => void,
        onSell: () => void,
        onContinue: () => void,
        onOpenQuiz?: () => void,
        onSelectQuizChoice?: (index: number) => void,
    ) {
        this.group = new Konva.Group({ visible: false });
        this.quizChoiceHandler = onSelectQuizChoice ?? null;

        // Background image with subtle float animation
        const bgImage = loadImage(backgroundSrc);
        const dummy = new window.Image();
        this.background = new Konva.Image({
            x: -20,
            y: -20,
            width: STAGE_WIDTH + 40,
            height: STAGE_HEIGHT + 40,
            listening: false,
            image: dummy,
        });
        if (bgImage.complete) {
            this.background.image(bgImage);
        } else {
            bgImage.onload = () => {
                this.background.image(bgImage);
                this.group.getLayer()?.batchDraw();
            };
        }
        this.group.add(this.background);

        // Title
        this.titleText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: 60,
            text: "Morning Events",
            fontSize: 40,
            fontFamily: "Arial",
            fill: "#222",
            align: "center",
        });
        this.titleText.offsetX(this.titleText.width() / 2);
        this.group.add(this.titleText);

        // Money / Inventory
        this.moneyText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: 140,
            text: "Money: $0",
            fontSize: 28,
            fontFamily: "Arial",
            fill: "#333",
            align: "center",
        });
        this.moneyText.offsetX(this.moneyText.width() / 2);
        this.group.add(this.moneyText);

        this.inventoryText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: 180,
            text: "Crops: 0",
            fontSize: 24,
            fontFamily: "Arial",
            fill: "#333",
            align: "center",
        });
        this.inventoryText.offsetX(this.inventoryText.width() / 2);
        this.group.add(this.inventoryText);

        // Buttons
        const buyBtn = makeButton({ x: STAGE_WIDTH / 2 - 200, y: 260, width: 150, height: 60, text: "Buy Crop", fill: "#2e7d32" }, onBuy);
        const sellBtn = makeButton({ x: STAGE_WIDTH / 2 + 50, y: 260, width: 150, height: 60, text: "Sell Crop", fill: "#c62828" }, onSell);
        const quizBtn = makeButton({ x: STAGE_WIDTH / 2 - 75, y: 360, width: 150, height: 60, text: "Daily Quiz", fill: "#8e24aa" }, () => onOpenQuiz?.());
        quizBtn.visible(false);
        this.dailyQuizButton = quizBtn;
        const contBtn = makeButton({ x: STAGE_WIDTH / 2 - 75, y: 430, width: 150, height: 60, text: "Continue", fill: "#1565c0" }, onContinue);
        this.group.add(buyBtn);
        this.group.add(sellBtn);
        this.group.add(quizBtn);
        this.group.add(contBtn);

        // Informational text area (facts, quiz result, etc.)
        this.infoText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: 210,
            text: "",
            fontSize: 20,
            fontFamily: "Arial",
            fill: "#111",
            align: "center",
            width: STAGE_WIDTH - 80,
        });
        this.infoText.offsetX(this.infoText.width() / 2);
        this.group.add(this.infoText);
    }

    updateDay(day: number): void {
        this.titleText.text(`Morning - Day ${day}`);
        this.titleText.offsetX(this.titleText.width() / 2);
        this.group.getLayer()?.draw();
    }

    updateMoney(amount: number): void {
        this.moneyText.text(`Money: $${amount}`);
        this.moneyText.offsetX(this.moneyText.width() / 2);
        this.group.getLayer()?.draw();
    }

    updateInventory(cropCount: number): void {
        this.inventoryText.text(`Crops: ${cropCount}`);
        this.inventoryText.offsetX(this.inventoryText.width() / 2);
        this.group.getLayer()?.draw();
    }

    setInfoText(text: string): void {
        this.infoText.text(text);
        this.infoText.offsetX(this.infoText.width() / 2);
        this.group.getLayer()?.draw();
    }

    setDailyQuizButtonVisible(visible: boolean): void {
        this.dailyQuizButton.visible(visible);
        this.group.getLayer()?.draw();
    }

    showQuizPopup(question: string, choices: string[]): void {
        if (!this.quizChoiceHandler) return;
        this.hideQuizPopup();

        const popup = new Konva.Group();
        const panelWidth = STAGE_WIDTH - 80;
        const choiceHeight = 45;
        const gapY = 48;
        const buttonsHeight = (choices.length * choiceHeight) + Math.max(choices.length - 1, 0) * gapY;
        const panelHeight = 120 + buttonsHeight;
        const panelX = (STAGE_WIDTH - panelWidth) / 2;
        const maxPanelY = STAGE_HEIGHT - panelHeight - 10;
        const panelY = Math.min(maxPanelY, Math.max(220, (STAGE_HEIGHT - panelHeight) / 2));

        const panel = new Konva.Rect({
            x: panelX,
            y: panelY,
            width: panelWidth,
            height: panelHeight,
            fill: "#ffffff",
            stroke: "#4a90e2",
            strokeWidth: 3,
            cornerRadius: 12,
            shadowColor: "rgba(0, 0, 0, 0.25)",
            shadowBlur: 12,
            shadowOffset: { x: 0, y: 4 },
        });
        popup.add(panel);

        const title = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: panelY + 16,
            text: "Daily Quiz",
            fontSize: 24,
            fontFamily: "Arial",
            fill: "#2c3e50",
            align: "center",
            fontStyle: "bold",
        });
        title.offsetX(title.width() / 2);
        popup.add(title);

        const qText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: panelY + 52,
            text: question,
            fontSize: 18,
            fontFamily: "Arial",
            fill: "#34495e",
            width: panelWidth - 40,
            align: "center",
        });
        qText.offsetX(qText.width() / 2);
        popup.add(qText);

        const btnWidth = Math.min(320, panelWidth - 40);
        const baseY = panelY + 90;
        const colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12"];

        for (let i = 0; i < choices.length; i++) {
            const x = STAGE_WIDTH / 2 - btnWidth / 2;
            const y = baseY + i * gapY;
            const btnGroup = new Konva.Group({ cursor: "pointer" });

            const rect = new Konva.Rect({
                x,
                y,
                width: btnWidth,
                height: choiceHeight,
                fill: colors[i % colors.length],
                cornerRadius: 10,
                shadowBlur: 6,
                shadowColor: "rgba(0, 0, 0, 0.25)",
                shadowOffset: { x: 0, y: 2 },
            });

            const text = new Konva.Text({
                x: x + btnWidth / 2,
                y: y + choiceHeight / 2 - 10,
                text: choices[i],
                fontSize: 18,
                fontFamily: "Arial",
                fill: "#ffffff",
                align: "center",
            });
            text.offsetX(text.width() / 2);

            btnGroup.add(rect);
            btnGroup.add(text);
            btnGroup.on("click", () => this.quizChoiceHandler?.(i));
            btnGroup.on("tap", () => this.quizChoiceHandler?.(i));
            popup.add(btnGroup);
        }

        this.group.add(popup);
        this.quizGroup = popup;
        this.group.getLayer()?.draw();
    }

    hideQuizPopup(): void {
        if (this.quizGroup) {
            this.quizGroup.destroy();
            this.quizGroup = null;
            this.group.getLayer()?.draw();
        }
    }

    show(): void {
        this.group.visible(true);
        this.startBackgroundAnimation();
        this.group.getLayer()?.draw();
    }

    hide(): void {
        this.group.visible(false);
        this.stopBackgroundAnimation();
        this.group.getLayer()?.draw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }

    private startBackgroundAnimation(): void {
        if (this.backgroundAnimation) return;
        const layer = this.group.getLayer();
        if (!layer) return;

        this.backgroundPhase = 0;
        this.backgroundAnimation = new Konva.Animation((frame) => {
            if (!frame) return;
            this.backgroundPhase += frame.timeDiff * 0.0006;
            const offsetX = Math.sin(this.backgroundPhase) * 10;
            const offsetY = Math.cos(this.backgroundPhase * 0.7) * 6;
            this.background.position({
                x: -20 + offsetX,
                y: -20 + offsetY,
            });
        }, layer);
        this.backgroundAnimation.start();
    }

    private stopBackgroundAnimation(): void {
        this.backgroundAnimation?.stop();
        this.backgroundAnimation = null;
        this.background.position({ x: -20, y: -20 });
    }
}
