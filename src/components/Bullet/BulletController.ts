import { BulletModel } from "./BulletModel";
import { BulletView } from "./BulletView";
import type { ObstacleModel } from "../Obstacle/ObstacleModel";

export class BulletController {
  model: BulletModel;
  view: BulletView;

  constructor(x: number, y: number, dir: "up" | "down" | "left" | "right") {
    // Initialize bullet model and view at given position and direction
    this.model = new BulletModel(x, y, dir);
    this.view = new BulletView(this.model);
  }

  update(obstacles: ObstacleModel[], stageWidth: number, stageHeight: number) {
    // Skip update if bullet is inactive
    if (!this.model.active) return;

    // Move bullet based on its direction
    this.model.update();

    //Check for out-of-bounds
    const { x, y } = this.model;
    if (x < 0 || x > stageWidth || y < 0 || y > stageHeight) {
      this.destroy();
      return;
    }
    // Check for collision with obstacles
    const box = this.model.boundingBox();
    const hit = obstacles.some((o) => o.collides(box));
    if (hit) {
      // Deactivate bullet when it hits an obstacle
      this.destroy();
      return;
    }

    // Refresh view position and visibility
    this.view.update();
  }

  // Get Konva node for rendering on canvas
  getGroup() {
    return this.view.getGroup();
  }

  // Check if bullet is still active
  isActive() {
    return this.model.active;
  }

  // Force bullet to be destroyed and update view
  destroy() {
    this.model.destroy();
    this.view.destroy();
  }

  // Get current bullet position
  getPosition() {
    return { x: this.model.x, y: this.model.y };
  }
}
