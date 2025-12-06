import { HuntingScreenController } from "../src/screens/HuntingScreen/HuntingScreenContoller";
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock all dependencies
const mockSwitcher = { switchToScreen: vi.fn() };
const mockAudioManager = { playSfx: vi.fn(), stopSfx: vi.fn() };
// Mock GameStatusController
const mockGameStatusController = {
  incrementScore: vi.fn(),
};
// Mock Konva nodes
const mockKonvaNode = {
  add: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  visible: vi.fn(),
  getLayer: vi.fn(() => ({ draw: vi.fn(), batchDraw: vi.fn() })),
  width: vi.fn(() => 100),
  offsetX: vi.fn(),
  text: vi.fn(),
};

// Mock View
const mockView = {
  getGroup: vi.fn(() => mockKonvaNode),
  updateAmmo: vi.fn(),
  updateDefeat: vi.fn(),
  updateTimer: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  batchDraw: vi.fn(),
};

// Mock Model
const mockModel = {
  reset: vi.fn(),
  startTimer: vi.fn(),
  stopTimer: vi.fn(),
  updateTimer: vi.fn(),
  getAmmo: vi.fn(() => 100),
  canShoot: vi.fn(() => true),
  consumeAmmo: vi.fn(() => true),
  getTimeRemaining: vi.fn(() => 60),
  getDefeat: vi.fn(() => 0),
  isTimeUp: vi.fn(() => false),
  incrementDefeat: vi.fn(),
};

// Mock other controllers
const mockBulletController = {
  getGroup: vi.fn(() => mockKonvaNode),
  update: vi.fn(),
  isActive: vi.fn(() => true),
};

const mockPlayerController = {
  getGroup: vi.fn(() => mockKonvaNode),
  update: vi.fn(),
  shoot: vi.fn(() => mockBulletController),
  stopAllSounds: vi.fn(),
};

const mockObstacleController = {
  getNode: vi.fn(() => mockKonvaNode),
};

const mockEmuController = {
  getGroup: vi.fn(() => mockKonvaNode),
  update: vi.fn(),
  isActive: vi.fn(() => true),
  checkBulletCollision: vi.fn(() => false),
};

// Set up mocks before importing the module
vi.mock('../src/screens/HuntingScreen/HuntingScreenView', () => ({
  HuntingScreenView: vi.fn(() => mockView),
}));

vi.mock('../src/screens/HuntingScreen/HuntingScreenModel', () => ({
  HuntingScreenModel: vi.fn(() => mockModel),
}));

vi.mock('../src/components/Player/PlayerController', () => ({
  PlayerController: vi.fn(() => mockPlayerController),
}));

vi.mock('../src/components/Obstacle/ObstacleController', () => ({
  ObstacleController: vi.fn(() => mockObstacleController),
}));

vi.mock('../src/components/Emu/EmuController', () => ({
  EmuController: vi.fn(() => mockEmuController),
}));

vi.mock('../src/components/Bullet/BulletController', () => ({
  BulletController: vi.fn(() => mockBulletController),
}));

vi.mock('../src/utils/getSafeSpawnPosition', () => ({
  getSafeSpawnPosition: vi.fn(() => ({ x: 100, y: 200 })),
}));

describe('HuntingScreenController', () => {
  let controller: HuntingScreenController;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Spy on window methods
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    controller = new HuntingScreenController(
      mockSwitcher as any,
      mockAudioManager as any,
      mockGameStatusController as any
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create model and view', () => {
      expect(mockView).toBeDefined();
      expect(mockModel).toBeDefined();
    });

    it('should return the view', () => {
      expect(controller.getView()).toBe(mockView);
    });
  });

  describe('startHuntingGame', () => {
    beforeEach(() => {
      // Mock private methods
      vi.spyOn(controller as any, 'resetGame').mockImplementation(() => {
        // Set up minimal required properties
        (controller as any).playerController = mockPlayerController;
        (controller as any).obstacleControllers = [];
        (controller as any).emuControllers = [mockEmuController];
        (controller as any).bulletControllers = [];
      });
      
      // Mock gameLoop to prevent infinite recursion
      vi.spyOn(controller as any, 'gameLoop').mockImplementation(() => {});
      
      controller.startHuntingGame();
    });

    it('should initialize game state', () => {
      expect((controller as any).resetGame).toHaveBeenCalled();
      expect(mockModel.startTimer).toHaveBeenCalled();
      expect(mockView.show).toHaveBeenCalled();
      expect((controller as any).running).toBe(true);
    });

    it('should update initial view state', () => {
      expect(mockView.updateAmmo).toHaveBeenCalledWith(100);
      expect(mockView.updateDefeat).toHaveBeenCalledWith(1); // mockEmuController count
      expect(mockView.updateTimer).toHaveBeenCalledWith(60);
    });

    it('should attach keyboard listeners', () => {
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });
  });

  describe('keyboard input', () => {
    let onKeyDown: (e: KeyboardEvent) => void;
    let onKeyUp: (e: KeyboardEvent) => void;

    beforeEach(() => {
      // Get the bound event handlers
      onKeyDown = (controller as any).onKeyDown.bind(controller);
      onKeyUp = (controller as any).onKeyUp.bind(controller);
      
      // Initialize required properties
      (controller as any).keys = new Set();
      (controller as any).playerController = mockPlayerController;
      (controller as any).bulletControllers = [];
      (controller as any).running = true;
    });

    it('should add key to keys set on keydown', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      onKeyDown(event);
      
      expect((controller as any).keys.has('ArrowRight')).toBe(true);
    });

    it('should remove key from keys set on keyup', () => {
      const addEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      onKeyDown(addEvent);
      
      const removeEvent = new KeyboardEvent('keyup', { key: 'ArrowRight' });
      onKeyUp(removeEvent);
      
      expect((controller as any).keys.has('ArrowRight')).toBe(false);
    });

    it('should shoot when space is pressed and ammo is available', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      onKeyDown(event);
      
      expect(mockModel.canShoot).toHaveBeenCalled();
      expect(mockModel.consumeAmmo).toHaveBeenCalled();
      expect(mockPlayerController.shoot).toHaveBeenCalled();
      expect(mockAudioManager.playSfx).toHaveBeenCalledWith('shoot', 0.3);
    });

    it('should NOT shoot when canShoot returns false', () => {
      mockModel.canShoot.mockReturnValue(false);
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      onKeyDown(event);
      
      expect(mockModel.consumeAmmo).not.toHaveBeenCalled();
      expect(mockPlayerController.shoot).not.toHaveBeenCalled();
      expect(mockAudioManager.playSfx).not.toHaveBeenCalled();
    });
  });

  describe('game loop logic', () => {
    beforeEach(() => {
      // Setup minimal required properties
      (controller as any).running = true;
      (controller as any).playerController = mockPlayerController;
      (controller as any).obstacleControllers = [];
      (controller as any).emuControllers = [mockEmuController];
      (controller as any).bulletControllers = [];
      (controller as any).keys = new Set();
      
      // Mock batchDraw to prevent errors
      mockView.batchDraw.mockImplementation(() => {});
    });

    it('should end game when ammo runs out', () => {
      mockModel.getAmmo.mockReturnValue(0);
      vi.spyOn(controller as any, 'endGame');
      
      (controller as any).gameLoop();
      
      expect((controller as any).endGame).toHaveBeenCalledWith('ammo');
    });

    it('should end game when time is up', () => {
      mockModel.isTimeUp.mockReturnValue(true);
      vi.spyOn(controller as any, 'endGame');
      
      (controller as any).gameLoop();
      
      expect((controller as any).endGame).toHaveBeenCalledWith('time');
    });

    it('should end game when all emus are defeated', () => {
      (controller as any).emuControllers = [];
      vi.spyOn(controller as any, 'endGame');
      
      (controller as any).gameLoop();
      
      expect((controller as any).endGame).toHaveBeenCalledWith('victory');
    });

    it('should update components during game loop', () => {
      (controller as any).gameLoop();
      
      expect(mockModel.updateTimer).toHaveBeenCalled();
      expect(mockView.updateTimer).toHaveBeenCalledWith(60);
      expect(mockView.updateAmmo).toHaveBeenCalledWith(100);
      expect(mockPlayerController.update).toHaveBeenCalled();
      expect(mockEmuController.update).toHaveBeenCalled();
    });
  });

  describe('endGame', () => {
    beforeEach(() => {
      // Setup state
      (controller as any).running = true;
      (controller as any).playerController = mockPlayerController;
      (controller as any).keys = new Set(['ArrowRight']);
      
      // Mock event listeners
      (controller as any).onKeyDown = vi.fn();
      (controller as any).onKeyUp = vi.fn();
    });

    it('should cleanup and switch screen on victory', () => {
      controller.endGame('victory');
      
      expect((controller as any).running).toBe(false);
      expect((controller as any).keys.size).toBe(0);
      expect(mockModel.stopTimer).toHaveBeenCalled();
      expect(mockPlayerController.stopAllSounds).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', (controller as any).onKeyDown);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', (controller as any).onKeyUp);
      expect(mockSwitcher.switchToScreen).toHaveBeenCalledWith({
        type: 'minigame2_end',
        emusKilled: 0,
        reason: 'victory',
      });
    });

    it('should handle different end game reasons', () => {
      mockModel.getDefeat.mockReturnValue(5);
      
      controller.endGame('ammo');
      
      expect(mockSwitcher.switchToScreen).toHaveBeenCalledWith({
        type: 'minigame2_end',
        emusKilled: 5,
        reason: 'ammo',
      });
    });
  });
});