import { PlayerModel } from "./PlayerModel";
import { PlayerView } from "./PlayerView";
import type { ObstacleController } from "../Obstacle/ObstacleController";
import { BulletController } from "../Bullet/BulletController";
import {AudioManager} from "../../services/AudioManager";

// PlayerController: Handles player input, movement, collision, and shooting
export class PlayerController {
  model: PlayerModel;
  view: PlayerView;
  private audioManager: AudioManager;

  constructor(x: number, y: number,audioManager: AudioManager) {
    // Initialize player model and view
    this.model = new PlayerModel(x, y);
    this.view = new PlayerView(this.model);
    this.audioManager = audioManager;
  }

  // Update player position based on input keys and obstacles
  update(keys: Set<string>, obstacleControllers: ObstacleController[], stageWidth: number, stageHeight: number, gameAreaY: number = 0, gameAreaHeight: number = stageHeight) {
    const speed = this.model.speed;
    let dx = 0,
      dy = 0;
    const wasMoving = this.model.isMoving; 
    this.model.isMoving = false;

    // Process movement keys
    if (keys.has("w")) {
      dy -= speed;
      this.model.direction = "up";
      this.model.isMoving = true;
    } else if (keys.has("s")) {
      dy += speed;
      this.model.direction = "down";
      this.model.isMoving = true;
    }
    if (keys.has("a")) {
      dx -= speed;
      this.model.direction = "left";
      this.model.isMoving = true;
    } else if (keys.has("d")) {
      dx += speed;
      this.model.direction = "right";
      this.model.isMoving = true;
    }

    // Calculate next position
    let nextX = this.model.x + dx;
    let nextY = this.model.y + dy;

    // Player bounding box is 30x30, so radius is 15
    const radius = 15;

    // Clamp position within game area boundaries (accounting for HUD)
    nextX = Math.max(radius, Math.min(stageWidth - radius, nextX));
    nextY = Math.max(gameAreaY + radius, Math.min(gameAreaY + gameAreaHeight - radius, nextY));

    // Check for obstacle collisions
    const nextBox = { x: nextX, y: nextY, w: 30, h: 30 };
    const obstacles = obstacleControllers.map(c => c.getModel());
    const blocked = obstacles.some((o) => o.collides(nextBox));
    let isCurrentlyMoving = this.model.isMoving;
    if (!blocked) {
      this.model.x = nextX;
      this.model.y = nextY;
    }

    if (isCurrentlyMoving && !wasMoving) {
      // Start sound: Player was NOT moving, but is now moving.
      this.audioManager.startSfxLoop("run",1);
    } else if (!isCurrentlyMoving && wasMoving) {
      // Stop sound: Player WAS moving, but is now stopped (keys released or blocked).
      this.audioManager.stopSfxLoop();
    }

    // Update view to match model
    this.view.update();
  }

  // Shoot a bullet from the player's current position and direction
  shoot(): BulletController {
    return new BulletController(
      this.model.x,
      this.model.y,
      this.model.direction
    );
  }

  // Get Konva group node for rendering
  getGroup() {
    return this.view.getGroup();
  }

  // Get current player position
  getPosition() {
    return { x: this.model.x, y: this.model.y };
  }
  stopAllSounds() {
    // If the game is ending, forcefully stop the running sound loop.
    this.audioManager.stopSfxLoop(); 
}
}
