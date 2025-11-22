import Konva from "konva";
import { BulletModel } from "./BulletModel";
import bulletSrc from "../../../assets/bullet.png";

// Pre-load the image once to avoid reloading it for every single bullet shot
const bulletImageObj = new Image();
bulletImageObj.src = bulletSrc;

export class BulletView {
  private group: Konva.Group;
  private sprite: Konva.Image;
  private model: BulletModel;

  constructor(model: BulletModel) {
    this.model = model;

    this.sprite = new Konva.Image({
      image: bulletImageObj,
      width: 40,  
      height: 20,
      // Center the origin so rotation works perfectly around the middle
      offsetX: 20, 
      offsetY: 10, 
    });

    // Apply rotation based on direction
    const angle = this.dirAngle(); // Convert direction to angle
    this.sprite.rotation(angle);
    // Group head and body for unified positioning
    this.group = new Konva.Group({ x: model.x, y: model.y });

    this.group.add(this.sprite);
  }

  // Convert bullet direction to rotation angle
  private dirAngle() {
    return { up: -90, right: 0, down: 90, left: 180 }[this.model.direction];
  }

  // Update bullet’s position and visibility on canvas
  update() {
    this.group.position({ x: this.model.x, y: this.model.y });
    this.group.visible(this.model.active);
  }

  // Return Konva group node for rendering
  getGroup() {
    return this.group;
  }
}
