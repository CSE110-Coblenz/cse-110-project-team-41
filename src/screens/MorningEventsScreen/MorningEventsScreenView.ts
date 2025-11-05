import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";

type ButtonSpec = {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fill: string;
};

function makeButton(spec: ButtonSpec, onClick: () => void): Konva.Group {
    const group = new Konva.Group();
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
    return group;
}

/**
 * MorningEventsScreenView - Renders the morning events UI
 */
export class MorningEventsScreenView implements View {
    private group: Konva.Group;
    private titleText: Konva.Text;
    private moneyText: Konva.Text;
    private inventoryText: Konva.Text;

    constructor(onBuy: () => void, onSell: () => void, onContinue: () => void) {
        this.group = new Konva.Group({ visible: false });

        // Background
        const bg = new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#f5f5f5",
        });
        this.group.add(bg);

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
        const contBtn = makeButton({ x: STAGE_WIDTH / 2 - 75, y: 360, width: 150, height: 60, text: "Continue", fill: "#1565c0" }, onContinue);
        this.group.add(buyBtn);
        this.group.add(sellBtn);
        this.group.add(contBtn);
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

    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.draw();
    }

    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}

