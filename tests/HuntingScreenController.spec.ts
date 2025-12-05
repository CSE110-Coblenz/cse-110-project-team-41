import { HuntingScreenController } from "../src/screens/HuntingScreen/HuntingScreenContoller";
import { HuntingScreenModel } from "../src/screens/HuntingScreen/HuntingScreenModel";
import { HuntingScreenView } from "../src/screens/HuntingScreen/HuntingScreenView";
import { PlayerController } from "../src/components/Player/PlayerController";
import { ObstacleController } from "../src/components/Obstacle/ObstacleController";
import { EmuController } from "../src/components/Emu/EmuController";
import { BulletController } from "../src/components/Bullet/BulletController";
import { getSafeSpawnPosition } from "../src/utils/getSafeSpawnPosition";
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCanvasContext = {
    measureText: vi.fn(() => ({ width: 0 })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    createLinearGradient: vi.fn(),
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    font: '',
    textAlign: '',
    textBaseline: '',
} as unknown as CanvasRenderingContext2D;

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasContext);

// This is necessary because Konva.Text relies on the Canvas API which is not fully available in JSDOM/Vitest.
const mockKonvaNode = {
    add: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    visible: vi.fn(),
    getLayer: vi.fn(() => ({ draw: vi.fn(), batchDraw: vi.fn() })),
    width: vi.fn(() => 100), // Mock .width() to return a size to prevent NaN/null issues
    offsetX: vi.fn(),
    text: vi.fn(),
};

// Mock all Konva classes used in HuntingScreenView
vi.mock('konva', () => ({
    Group: vi.fn(() => mockKonvaNode),
    Rect: vi.fn(() => mockKonvaNode),
    Text: vi.fn(() => mockKonvaNode),
    // Other Konva exports that might be implicitly called
    __esModule: true,
    default: {},
}));
// --- END KONVA MOCK ---


// --- MOCK CONTROLLER DEPENDENCIES ---

// Shared mock objects for easy spying and control
const mockView = {
    getGroup: vi.fn(() => mockKonvaNode), // Returns the safe mock node
    updateAmmo: vi.fn(),
    updateDefeat: vi.fn(),
    updateTimer: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    batchDraw: vi.fn(),
};
// NOTE: mock the exact module path you import in the test file
vi.mock('../src/screens/HuntingScreen/HuntingScreenView', () => ({
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
vi.mock('../src/screens/HuntingScreen/HuntingScreenModel', () => ({
    HuntingScreenModel: vi.fn(() => mockModel),
}));


// Mock PlayerController and its methods
const mockBulletControllerInstance = {
    getGroup: vi.fn(() => mockKonvaNode),
    update: vi.fn(),
    isActive: vi.fn(() => true),
};
const mockPlayerControllerInstance = {
    getGroup: vi.fn(() => mockKonvaNode),
    update: vi.fn(),
    shoot: vi.fn(() => mockBulletControllerInstance), // Returns a mock bullet when shooting
    stopAllSounds: vi.fn(),
};
vi.mock('../src/components/Player/PlayerController', () => ({
    PlayerController: vi.fn(() => mockPlayerControllerInstance),
}));

// Mock other game controllers
vi.mock('../src/components/Obstacle/ObstacleController', () => ({
    ObstacleController: vi.fn((x, y, w, h, type) => ({
        getNode: vi.fn(() => mockKonvaNode),
    })),
}));
// Mock EmuController to prevent Konva initialization
vi.mock('../src/components/Emu/EmuController', () => ({
    EmuController: vi.fn((x, y) => ({
        getGroup: vi.fn(() => mockKonvaNode),
        update: vi.fn(),
        isActive: vi.fn(() => true),
        checkBulletCollision: vi.fn(() => false),
    })),
}));
vi.mock('../src/components/Bullet/BulletController', () => ({
    BulletController: vi.fn(() => mockBulletControllerInstance),
}));

// Mock utility functions
vi.mock('../src/utils/getSafeSpawnPosition', () => ({
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
        // Reset Konva node mock width for safe calculations
        mockKonvaNode.width.mockReturnValue(100);

        controller = new HuntingScreenController(
            mockSwitcher as any,
            mockAudioManager as any
        );

        // Capture the bound functions for listener removal check
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
            // Restore the original (spied) resetGame method for this test
            (controller as any).resetGame.mockRestore();

            // Setup with mock components to destroy
            const mockPlayerDestroy = vi.fn();
            (controller as any).playerController = { getGroup: vi.fn(() => ({ destroy: mockPlayerDestroy })) };
            
            const mockObstacleDestroy = vi.fn();
            (controller as any).obstacleControllers = [
                { getNode: vi.fn(() => ({ destroy: mockObstacleDestroy })) },
            ];
            
            const mockEmuDestroy = vi.fn();
            (controller as any).emuControllers = [
                { getGroup: vi.fn(() => ({ destroy: mockEmuDestroy })) },
            ];
            
            const mockBulletDestroy = vi.fn();
            (controller as any).bulletControllers = [
                { getGroup: vi.fn(() => ({ destroy: mockBulletDestroy })) },
            ];

            (controller as any).resetGame();

            // Check cleanup
            expect(mockModel.reset).toHaveBeenCalled();
            expect(mockPlayerDestroy).toHaveBeenCalled();
            expect(mockObstacleDestroy).toHaveBeenCalled();
            expect(mockEmuDestroy).toHaveBeenCalled();
            expect(mockBulletDestroy).toHaveBeenCalled();
            
            // Check creation of new components (ObstacleController is called 12 times in the real resetGame)
            expect(ObstacleController).toHaveBeenCalledTimes(12);
            // PlayerController is called 1 time
            expect(PlayerController).toHaveBeenCalledTimes(1); 
            // EmuController is called 10-20 times (based on Math.random in real implementation, but mock is safe)
            // We just ensure it was called at least once (mock EmuController returns safe mock nodes)
            expect(getSafeSpawnPosition).toHaveBeenCalledTimes(13); // 1 for player + 12 for obstacles (approx)
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