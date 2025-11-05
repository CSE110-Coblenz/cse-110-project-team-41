export class EmuModel {
  x: number;
  y: number;
  currentDirection: "up" | "down" | "left" | "right" = "right";
  speed = 3;
  hitCount = 0;
  maxHits = 3;
  active = true;
  flashTimer = 0;
  directionChangeTimer = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.randomizeDirection();
  }

  // Pick a random movement direction and reset timer
  randomizeDirection() {
    const directions: ("up" | "down" | "left" | "right")[] = [
      "up",
      "down",
      "left",
      "right",
    ];
    this.currentDirection =
      directions[Math.floor(Math.random() * directions.length)];
    this.directionChangeTimer = Math.floor(Math.random() * 60) + 30;
  }

  // Decrease direction timer and randomize when expired
  tickDirectionTimer() {
    if (this.directionChangeTimer > 0) {
      this.directionChangeTimer--;
    } else {
      this.randomizeDirection();
    }
  }

  // Handle being hit by a bullet
  becomeHit() {
    this.hitCount++;
    this.flashTimer = 15;
    if (this.hitCount >= this.maxHits) {
      this.active = false;
    }
  }

  // Get bounding box for collision detection
  boundingBox(radius = 12) {
    return { x: this.x, y: this.y, w: radius * 2, h: radius * 2 };
  }
}
