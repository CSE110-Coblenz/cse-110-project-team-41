import { ObstacleModel } from "./ObstacleModel";
import type { ObstacleType} from "./ObstacleModel";
import { ObstacleView } from "./ObstacleView";

export class ObstacleController {
  private model: ObstacleModel;
  private view: ObstacleView;

  constructor(x: number, y: number, w: number, h: number, type: ObstacleType) {
    this.model = new ObstacleModel(x, y, w, h, type);
    this.view = new ObstacleView(this.model);
  }

  /**
   * Returns the underlying model, useful for collision detection
   * logic in other controllers.
   */
  getModel(): ObstacleModel {
    return this.model;
  }

  /**
   * Returns the view instance.
   */
  getView(): ObstacleView {
    return this.view;
  }

  /**
   * Returns the Konva Node for rendering.
   */
  getNode() {
    return this.view.getNode();
  }
}