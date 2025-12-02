import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameIntroController } from "../src/screens/GameIntroScreen/GameIntroScreenController";
import type { ScreenSwitcher } from "../src/types";

// Mock the View
const renderPageMock = vi.fn();
const showMock = vi.fn();
const hideMock = vi.fn();
const destroyMock = vi.fn();

vi.mock("../src/screens/GameIntroScreen/GameIntroScreenView", () => {
    return {
        GameIntroView: vi.fn().mockImplementation(() => ({
            renderPage: renderPageMock,
            show: showMock,
            hide: hideMock,
            destroy: destroyMock,
        })),
    };
});

describe("GameIntroController", () => {
    let controller: GameIntroController;
    let screenSwitcherMock: ScreenSwitcher;

    beforeEach(() => {
        vi.clearAllMocks();
        screenSwitcherMock = {
            switchToScreen: vi.fn(),
        };
        controller = new GameIntroController(screenSwitcherMock);
    });

    afterEach(() => {
        controller.destroy();
    });

    it("should show the first page when show() is called", () => {
        controller.show();
        expect(showMock).toHaveBeenCalled();
        expect(renderPageMock).toHaveBeenCalledWith(expect.any(String), false, 0, expect.any(Number));
    });

    it("should advance to the next page when Space is pressed", () => {
        controller.show();

        // Simulate Space key press
        const spaceEvent = new KeyboardEvent("keydown", { code: "Space" });
        window.dispatchEvent(spaceEvent);

        expect(renderPageMock).toHaveBeenLastCalledWith(expect.any(String), false, 1, expect.any(Number));
    });

    it("should switch to farm screen when Space is pressed on the last page", () => {
        controller.show();

        // Get total pages from the model (indirectly via renderPage calls or just looping)
        // Since we don't have direct access to the model instance, we can simulate pressing space multiple times.
        // However, we know the model has 8 pages.

        // Fast forward to the last page
        for (let i = 0; i < 7; i++) {
            const spaceEvent = new KeyboardEvent("keydown", { code: "Space" });
            window.dispatchEvent(spaceEvent);
        }

        // Now on the last page (index 7)
        // Press Space one more time
        const spaceEvent = new KeyboardEvent("keydown", { code: "Space" });
        window.dispatchEvent(spaceEvent);

        expect(screenSwitcherMock.switchToScreen).toHaveBeenCalledWith({ type: "farm" });
    });

    it("should switch to farm screen immediately when Escape is pressed", () => {
        controller.show();

        const escapeEvent = new KeyboardEvent("keydown", { code: "Escape" });
        window.dispatchEvent(escapeEvent);

        expect(screenSwitcherMock.switchToScreen).toHaveBeenCalledWith({ type: "farm" });
    });

    it("should clean up event listeners on hide", () => {
        controller.show();
        controller.hide();

        expect(hideMock).toHaveBeenCalled();

        // Reset mocks to ensure no further calls are recorded
        vi.clearAllMocks();

        // Trigger key events
        const spaceEvent = new KeyboardEvent("keydown", { code: "Space" });
        window.dispatchEvent(spaceEvent);

        expect(renderPageMock).not.toHaveBeenCalled();
        expect(screenSwitcherMock.switchToScreen).not.toHaveBeenCalled();
    });
});
