import { PlayerModel } from "./PlayerModel";
import { PlayerView } from "./PlayerView";
import type { ObstacleModel } from "../Obstacle/ObstacleModel";
import { BulletController } from "../Bullet/BulletController";

// PlayerController: Handles player input, movement, collision, and shooting
export class PlayerController {
  model: PlayerModel;
  view: PlayerView;

  constructor(x: number, y: number) {
    // Initialize player model and view
    this.model = new PlayerModel(x, y);
    this.view = new PlayerView(this.model);
  }

  // Update player position based on input keys and obstacles
  update(keys: Set<string>, obstacles: ObstacleModel[]) {
    const speed = this.model.speed;
    let dx = 0,
      dy = 0;
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

    // Calculate next position and check for collisions
    const nextX = this.model.x + dx;
    const nextY = this.model.y + dy;
    const nextBox = { x: nextX, y: nextY, w: 30, h: 30 };
    const blocked = obstacles.some((o) => o.collides(nextBox));
    if (!blocked) {
      this.model.x = nextX;
      this.model.y = nextY;
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
}
