export class BulletModel {
  x: number;
  y: number;
  speed = 6; // Movement speed per update
  active = true; // Indicates whether the bullet is still valid
  public direction: "up" | "down" | "left" | "right";

  constructor(
    x: number,
    y: number,
    direction: "up" | "down" | "left" | "right"
  ) {
    // Initialize position and direction
    this.x = x;
    this.y = y;
    this.direction = direction;
  }

  update() {
    // Skip movement if bullet is inactive
    if (!this.active) return;

    // Move bullet in its direction
    if (this.direction === "up") this.y -= this.speed;
    if (this.direction === "down") this.y += this.speed;
    if (this.direction === "left") this.x -= this.speed;
    if (this.direction === "right") this.x += this.speed;
  }

  // Mark bullet as inactive
  destroy() {
    this.active = false;
  }

  // Return bounding box for collision detection
  boundingBox() {
    return { x: this.x, y: this.y, w: 8, h: 12 };
  }
}
