import Konva from "konva";
import { PlayerModel } from "./PlayerModel";

// PlayerView: Renders player on canvas and updates appearance
export class PlayerView {
  private group: Konva.Group;
  private body: Konva.Circle;
  private gun: Konva.Rect;
  private model: PlayerModel;

  constructor(model: PlayerModel) {
    this.model = model;

    // Create body and gun shapes
    this.body = new Konva.Circle({
      radius: 15,
      fill: "blue",
      shadowColor: "black",
      shadowBlur: 5,
    });
    this.gun = new Konva.Rect({
      width: 20,
      height: 6,
      fill: "gray",
      offsetX: 10,
      offsetY: 3,
    });

    // Group body and gun for unified movement
    this.group = new Konva.Group({ x: model.x, y: model.y });
    this.group.add(this.body);
    this.group.add(this.gun);
  }

  // Update position, gun rotation, and movement color
  update() {
    this.group.position({ x: this.model.x, y: this.model.y });
    const angleMap = { up: -90, right: 0, down: 90, left: 180 };
    this.gun.rotation(angleMap[this.model.direction]);
    this.gun.fill(this.model.isMoving ? "silver" : "gray");
  }

  // Get Konva group node for rendering
  getGroup() {
    return this.group;
  }
}
