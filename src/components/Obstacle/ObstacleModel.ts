export type ObstacleType = "rock" | "bush";

export class ObstacleModel {
  public x: number;
  public y: number;
  public w: number;
  public h: number;
  public type: ObstacleType;
  constructor(x: number, y: number, w: number, h: number, type: ObstacleType = "rock") {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
  }

  // box: center coordinates x,y and width/height
  collides(box: { x: number; y: number; w: number; h: number }) {
    return !(
      box.x + box.w / 2 < this.x ||
      box.x - box.w / 2 > this.x + this.w ||
      box.y + box.h / 2 < this.y ||
      box.y - box.h / 2 > this.y + this.h
    );
  }
}
