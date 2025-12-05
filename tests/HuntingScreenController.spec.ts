import { HuntingScreenController } from "../src/screens/HuntingScreen/HuntingScreenContoller";
import { HuntingScreenModel } from "../src/screens/HuntingScreen/HuntingScreenModel";
import { HuntingScreenView } from "../src/screens/HuntingScreen/HuntingScreenView";
import { PlayerController } from "../src/components/Player/PlayerController";
import { ObstacleController } from "../src/components/Obstacle/ObstacleController";
import { EmuController } from "../src/components/Emu/EmuController";
import { BulletController } from "../src/components/Bullet/BulletController";
import { getSafeSpawnPosition } from "../src/utils/getSafeSpawnPosition";
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Shared mock objects for easy spying and control
const mockView = {
    getGroup: vi.fn(() => ({ add: vi.fn(), destroy: vi.fn(), on: vi.fn() })),
    updateAmmo: vi.fn(),
    updateDefeat: vi.fn(),
    updateTimer: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    batchDraw: vi.fn(),
};
vi.mock('./HuntingScreenView', () => ({
    HuntingScreenView: vi.fn(() => mockView),
}));

const mockSwitcher = { switchToScreen: vi.fn() };
const mockAudioManager = { playSfx: vi.fn(), stopSfx: vi.fn() };

// Mock Model: We will control its internal state checks
const mockModel = {
    reset: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    updateTimer: vi.fn(),
    getAmmo: vi.fn(() => 100), // Default ammo count
    canShoot: vi.fn(() => true),
    consumeAmmo: vi.fn(() => true),
    getTimeRemaining: vi.fn(() => 60),
    getDefeat: vi.fn(() => 0),
    isTimeUp: vi.fn(() => false),
    incrementDefeat: vi.fn(),
};
vi.mock('./HuntingScreenModel', () => ({
    HuntingScreenModel: vi.fn(() => mockModel),
}));


// Mock PlayerController and its methods
const mockBulletControllerInstance = {
    getGroup: vi.fn(() => ({ destroy: vi.fn() })),
    update: vi.fn(),
    isActive: vi.fn(() => true),
};
const mockPlayerControllerInstance = {
    getGroup: vi.fn(() => ({ destroy: vi.fn() })),
    update: vi.fn(),
    shoot: vi.fn(() => mockBulletControllerInstance), // Returns a mock bullet when shooting
    stopAllSounds: vi.fn(),
};
vi.mock('../../components/Player/PlayerController', () => ({
    PlayerController: vi.fn(() => mockPlayerControllerInstance),
}));

// Mock other game controllers
vi.mock('../../components/Obstacle/ObstacleController', () => ({
    ObstacleController: vi.fn((x, y, w, h, type) => ({
        getNode: vi.fn(() => ({ destroy: vi.fn() })),
    })),
}));
vi.mock('../../components/Emu/EmuController');
vi.mock('../../components/Bullet/BulletController', () => ({
    BulletController: vi.fn(() => mockBulletControllerInstance),
}));

// Mock utility functions
vi.mock('../../utils/getSafeSpawnPosition', () => ({
    getSafeSpawnPosition: vi.fn(() => ({ x: 100, y: 200 })),
}));

// Mock window event listeners and requestAnimationFrame
vi.spyOn(window, 'addEventListener');
vi.spyOn(window, 'removeEventListener');
// Mock the animation loop to prevent actual recursion during tests
const mockGameLoop = vi.fn();
globalThis.requestAnimationFrame = vi.fn((callback) => {
    mockGameLoop.mockImplementation(() => callback());
    return 1;
});


describe('HuntingScreenController', () => {
    let controller: HuntingScreenController;
    let originalKeyDown: (e: KeyboardEvent) => void;
    let originalKeyUp: (e: KeyboardEvent) => void;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the model mocks for each test
        mockModel.getAmmo.mockReturnValue(100);
        mockModel.canShoot.mockReturnValue(true);
        mockModel.consumeAmmo.mockReturnValue(true);

        controller = new HuntingScreenController(
            mockSwitcher as any,
            mockAudioManager as any
        );

        // Capture the bound functions for listener removal check
        // We rely on the internal tracking of listeners in the controller's instance
        originalKeyDown = (controller as any).onKeyDown;
        originalKeyUp = (controller as any).onKeyUp;

        // Spy on and mock the actual gameLoop and endGame logic to test setup/teardown
        vi.spyOn(controller as any, 'gameLoop').mockImplementation(mockGameLoop);
        vi.spyOn(controller as any, 'endGame').mockImplementation(vi.fn());
    });

    it('should initialize correctly and expose the view', () => {
        expect(HuntingScreenView).toHaveBeenCalledTimes(1);
        expect(controller.getView()).toBe(mockView);
    });

    describe('startHuntingGame', () => {
        let resetGameSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            // Spy on the private resetGame method
            resetGameSpy = vi.spyOn(controller as any, 'resetGame').mockImplementation(vi.fn());
            controller.startHuntingGame();
        });

        it('should perform game setup and start loop', () => {
            expect(resetGameSpy).toHaveBeenCalled();
            expect(mockModel.startTimer).toHaveBeenCalled();
            expect(mockView.show).toHaveBeenCalled();
            expect((controller as any).running).toBe(true);
            expect((controller as any).gameLoop).toHaveBeenCalled();
        });

        it('should update the view with initial state', () => {
            expect(mockView.updateAmmo).toHaveBeenCalledWith(100); // from mockModel
            expect(mockView.updateDefeat).toHaveBeenCalledWith(0); // initial emu count
            expect(mockView.updateTimer).toHaveBeenCalledWith(60); // from mockModel
        });

        it('should attach keyboard event listeners', () => {
            expect(window.addEventListener).toHaveBeenCalledWith('keydown', originalKeyDown);
            expect(window.addEventListener).toHaveBeenCalledWith('keyup', originalKeyUp);
        });
    });

    describe('resetGame', () => {
        it('should cleanup existing components and create new ones', () => {
            // Setup with mock components to destroy
            (controller as any).playerController = mockPlayerControllerInstance;
            (controller as any).obstacleControllers = [
                { getNode: vi.fn(() => ({ destroy: vi.fn() })) },
            ];
            (controller as any).emuControllers = [
                { getGroup: vi.fn(() => ({ destroy: vi.fn() })) },
            ];
            (controller as any).bulletControllers = [
                { getGroup: vi.fn(() => ({ destroy: vi.fn() })) },
            ];

            (controller as any).resetGame();

            // Check cleanup
            expect(mockModel.reset).toHaveBeenCalled();
            expect(mockPlayerControllerInstance.getGroup().destroy).toHaveBeenCalled();

            // Check creation of new components
            expect(ObstacleController).toHaveBeenCalledTimes(12); // Creates 12 obstacles
            expect(getSafeSpawnPosition).toHaveBeenCalledTimes(1 + (controller as any).emuControllers.length); // 1 for player + Emus
            expect(PlayerController).toHaveBeenCalledTimes(1);
        });
    });

    describe('onKeyDown', () => {
        beforeEach(() => {
            // Ensure necessary components are initialized for onKeyDown to work
            (controller as any).playerController = mockPlayerControllerInstance;
            (controller as any).running = true;
            (controller as any).bulletControllers = [];
        });

        it('should add movement keys to the keys Set', () => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            originalKeyDown(event);
            expect((controller as any).keys.has('ArrowRight')).toBe(true);
        });

        it('should shoot, consume ammo, and play sound when Space is pressed and available', () => {
            const event = new KeyboardEvent('keydown', { code: 'Space' });
            originalKeyDown(event);

            expect(mockModel.canShoot).toHaveBeenCalled();
            expect(mockModel.consumeAmmo).toHaveBeenCalled();
            expect(mockPlayerControllerInstance.shoot).toHaveBeenCalled();
            expect(mockView.updateAmmo).toHaveBeenCalled();
            expect(mockAudioManager.playSfx).toHaveBeenCalledWith('shoot', 0.3);
            expect((controller as any).bulletControllers.length).toBe(1);
        });

        it('should NOT shoot if canShoot returns false', () => {
            mockModel.canShoot.mockReturnValue(false); // No ammo or other reason
            const event = new KeyboardEvent('keydown', { code: 'Space' });
            originalKeyDown(event);

            expect(mockModel.consumeAmmo).not.toHaveBeenCalled();
            expect(mockPlayerControllerInstance.shoot).not.toHaveBeenCalled();
            expect(mockAudioManager.playSfx).not.toHaveBeenCalled();
            expect((controller as any).bulletControllers.length).toBe(0);
        });
    });

    describe('endGame', () => {
        beforeEach(() => {
            // Restore the actual endGame implementation
            (controller as any).endGame.mockRestore();
            // Setup running state and cleanup spies
            (controller as any).running = true;
            (controller as any).playerController = mockPlayerControllerInstance;
            vi.spyOn(window, 'removeEventListener');
        });

        it('should stop game, cleanup listeners, and switch screen on victory', () => {
            mockModel.getDefeat.mockReturnValue(15);
            controller.endGame('victory');

            expect((controller as any).running).toBe(false);
            expect(mockModel.stopTimer).toHaveBeenCalled();
            expect(mockPlayerControllerInstance.stopAllSounds).toHaveBeenCalled();
            expect(window.removeEventListener).toHaveBeenCalledWith('keydown', originalKeyDown);
            expect(window.removeEventListener).toHaveBeenCalledWith('keyup', originalKeyUp);
            expect(mockSwitcher.switchToScreen).toHaveBeenCalledWith({
                type: 'minigame2_end',
                emusKilled: 15,
                reason: 'victory',
            });
        });

        it('should handle "ammo" reason', () => {
            controller.endGame('ammo');
            expect(mockSwitcher.switchToScreen).toHaveBeenCalledWith(
                expect.objectContaining({ reason: 'ammo' })
            );
        });
    });
});