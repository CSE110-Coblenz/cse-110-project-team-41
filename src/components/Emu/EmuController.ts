import { EmuModel } from "./EmuModel";
import { EmuView } from "./EmuView";
import type { ObstacleModel } from "../Obstacle/ObstacleModel";
import type { BulletController } from "../Bullet/BulletController";

export class EmuController {
  model: EmuModel;
  view: EmuView;

  constructor(x: number, y: number) {
    // Initialize model and view at position
    this.model = new EmuModel(x, y);
    this.view = new EmuView(this.model);
  }

  update(obstacles: ObstacleModel[], stageWidth: number, stageHeight: number) {
    if (!this.model.active) return;

    // Predict next position based on current direction
    let nextX = this.model.x;
    let nextY = this.model.y;
    if (this.model.currentDirection === "up") nextY -= this.model.speed;
    if (this.model.currentDirection === "down") nextY += this.model.speed;
    if (this.model.currentDirection === "left") nextX -= this.model.speed;
    if (this.model.currentDirection === "right") nextX += this.model.speed;

    const radius = 12;
    const originalNextX = nextX;
    const originalNextY = nextY;

    // Clamp position within stage boundaries
    nextX = Math.max(radius, Math.min(stageWidth - radius, nextX));
    nextY = Math.max(radius, Math.min(stageHeight - radius, nextY));

    const hitBoundary = nextX !== originalNextX || nextY !== originalNextY;

    // Check for obstacle collision
    const nextBox = { x: nextX, y: nextY, w: radius * 2, h: radius * 2 };
    const blockedByObstacle = obstacles.some((o) => o.collides(nextBox));

    if (blockedByObstacle || hitBoundary) {
      // Stop and change direction on collision or boundary hit
      this.model.randomizeDirection();
    } else {
      // Move to next position
      this.model.x = nextX;
      this.model.y = nextY;
      this.model.tickDirectionTimer();
    }

    // Update view (position, flash effect, orientation)
    this.view.update();
  }

  // Check collision with bullets; return true if emu is defeated
  checkBulletCollision(bullets: BulletController[]): boolean {
    if (!this.model.active) return false;

    const emuRadius = 12;
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b.isActive()) continue;

      const pos = b.getPosition();
      const dx = pos.x - this.model.x;
      const dy = pos.y - this.model.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < emuRadius + 5) {
        b.destroy();
        this.model.becomeHit();

        if (!this.model.active) {
          const node = this.view.getGroup();
          node.visible(false);
          node.remove();
          return true;
        } else {
          this.view.update();
          return false;
        }
      }
    }
    return false;
  }

  getGroup() {
    return this.view.getGroup();
  }

  isActive() {
    return this.model.active;
  }
}
