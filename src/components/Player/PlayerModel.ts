// PlayerModel: Stores player state and provides movement logic
export class PlayerModel {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right" = "up";
  speed = 1;
  isMoving = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Move player by delta
  moveBy(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  // Return bounding box for collision detection
  boundingBox() {
    return { x: this.x, y: this.y, w: 30, h: 30 };
  }
}
