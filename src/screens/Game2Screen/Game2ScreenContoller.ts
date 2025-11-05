// src/screens/Game2Screen/Game2ScreenController.ts
import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { Game2ScreenModel } from "./Game2ScreenModel";
import { Game2ScreenView } from "./Game2ScreenView";
import { PlayerController } from "../../components/Player/PlayerController";
import { ObstacleModel } from "../../components/Obstacle/ObstacleModel";
import { ObstacleView } from "../../components/Obstacle/ObstacleView";
import { EmuController } from "../../components/Emu/EmuController";
import { BulletController } from "../../components/Bullet/BulletController";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants";
import { getSafeSpawnPosition } from "../../utils/getSafeSpawnPosition";

export class Game2ScreenController extends ScreenController {
  private model: Game2ScreenModel;
  private view: Game2ScreenView;
  private screenSwitcher: ScreenSwitcher;
  private running = false;

  // controllers & models
  private playerController!: PlayerController;
  private obstacleModels: ObstacleModel[] = [];
  private obstacleViews: ObstacleView[] = [];
  private emuControllers: EmuController[] = [];
  private bulletControllers: BulletController[] = [];

  private keys: Set<string> = new Set();

  constructor(screenSwitcher: ScreenSwitcher) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.model = new Game2ScreenModel();
    this.view = new Game2ScreenView();
  }

  getView(): Game2ScreenView {
    return this.view;
  }

  startGame2() {
    this.resetGame();
    this.view.updateDefeat(this.model.getDefeat());
    this.view.show();
    this.running = true;

    // attach keyboard
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.gameLoop();
  }

  private resetGame() {
    // reset model
    this.model.reset();

    // clear groups (if any) and re-create everything
    // create obstacles
    this.obstacleModels = [];
    this.obstacleViews = [];
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * (STAGE_WIDTH - 100);
      const y = Math.random() * (STAGE_HEIGHT - 100);
      const w = 40 + Math.random() * 40;
      const h = 40 + Math.random() * 40;
      const om = new ObstacleModel(x, y, w, h);
      this.obstacleModels.push(om);
      const ov = new ObstacleView(om);
      this.obstacleViews.push(ov);
      this.view.getGroup().add(ov.getNode());
    }

    // spawn player safely
    const playerPos = getSafeSpawnPosition(this.obstacleModels, 30, 30);
    this.playerController = new PlayerController(playerPos.x, playerPos.y);
    this.view.getGroup().add(this.playerController.getGroup());

    // spawn emus safely
    this.emuControllers = [];
    for (let i = 0; i < 5; i++) {
      const emuPos = getSafeSpawnPosition(this.obstacleModels, 24, 24);
      const ec = new EmuController(emuPos.x, emuPos.y);
      this.emuControllers.push(ec);
      this.view.getGroup().add(ec.getGroup());
    }

    // clear bullets
    this.bulletControllers = [];
  }

  private onKeyDown(e: KeyboardEvent) {
    // capture arrow keys and space
    this.keys.add(e.key);
    // handle space fire on keydown so repeated fires possible with key repeat
    if (e.code === "Space") {
      const bullet = this.playerController.shoot();
      this.bulletControllers.push(bullet);
      this.view.getGroup().add(bullet.getGroup());
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.key);
  }

  private gameLoop = () => {
    if (!this.running) return;

    // update player
    this.playerController.update(this.keys, this.obstacleModels);

    // update bullets
    this.bulletControllers.forEach((b) => b.update(this.obstacleModels));
    this.bulletControllers = this.bulletControllers.filter((b) => b.isActive());

    // update emus
    this.emuControllers.forEach((e) =>
      e.update(this.obstacleModels, STAGE_WIDTH, STAGE_HEIGHT)
    );

    // check collisions (bullets -> emus)
    this.emuControllers = this.emuControllers.filter((emu) => {
      if (!emu.isActive()) return false;
      const died = emu.checkBulletCollision(this.bulletControllers);
      if (died) {
        this.model.incrementDefeat();
        this.view.updateDefeat(this.model.getDefeat());
      }
      return emu.isActive();
    });

    // remove inactive bullets from scene (their views remain hidden)
    this.bulletControllers = this.bulletControllers.filter((b) => b.isActive());

    this.view.batchDraw();

    requestAnimationFrame(this.gameLoop);
  };

  endGame() {
    this.running = false;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.screenSwitcher.switchToScreen({
      type: "result",
      score: this.model.getDefeat(),
    });
  }
}
