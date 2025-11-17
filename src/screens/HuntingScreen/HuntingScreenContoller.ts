// src/screens/Game2Screen/Game2ScreenController.ts
import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { HuntingScreenModel } from "./HuntingScreenModel";
import { HuntingScreenView } from "./HuntingScreenView";
import { PlayerController } from "../../components/Player/PlayerController";
import { ObstacleModel } from "../../components/Obstacle/ObstacleModel";
import { ObstacleView } from "../../components/Obstacle/ObstacleView";
import { EmuController } from "../../components/Emu/EmuController";
import { BulletController } from "../../components/Bullet/BulletController";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants";
import { getSafeSpawnPosition } from "../../utils/getSafeSpawnPosition";

const HUD_HEIGHT = 80; // Height of the HUD banner
const GAME_AREA_Y = HUD_HEIGHT; // Game area starts below HUD
const GAME_AREA_HEIGHT = STAGE_HEIGHT - HUD_HEIGHT; // Available game area height

export class HuntingScreenController extends ScreenController {
  private model: HuntingScreenModel;
  private view: HuntingScreenView;
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
    this.model = new HuntingScreenModel();
    this.view = new HuntingScreenView();
  }

  getView(): HuntingScreenView {
    return this.view;
  }

  startGame2() {
    this.resetGame();
    this.model.startTimer();
    this.view.updateAmmo(this.model.getAmmo());
    this.view.updateDefeat(this.emuControllers.length);
    this.view.updateTimer(this.model.getTimeRemaining());
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
    // create obstacles (offset by HUD height)
    this.obstacleModels = [];
    this.obstacleViews = [];
    
    // Create rocks (gray rectangles)
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * (STAGE_WIDTH - 100);
      const y = GAME_AREA_Y + Math.random() * (GAME_AREA_HEIGHT - 100);
      const w = 40 + Math.random() * 40;
      const h = 40 + Math.random() * 40;
      const om = new ObstacleModel(x, y, w, h, "rock");
      this.obstacleModels.push(om);
      const ov = new ObstacleView(om);
      this.obstacleViews.push(ov);
      this.view.getGroup().add(ov.getNode());
    }
    
    // Create bushes (green circles)
    for (let i = 0; i < 6; i++) {
      const size = 30 + Math.random() * 30; // Diameter between 30-60
      const x = Math.random() * (STAGE_WIDTH - 100);
      const y = GAME_AREA_Y + Math.random() * (GAME_AREA_HEIGHT - 100);
      const om = new ObstacleModel(x, y, size, size, "bush");
      this.obstacleModels.push(om);
      const ov = new ObstacleView(om);
      this.obstacleViews.push(ov);
      this.view.getGroup().add(ov.getNode());
    }

    // spawn player safely (offset by HUD height)
    const playerPos = getSafeSpawnPosition(this.obstacleModels, 30, 30, GAME_AREA_Y, GAME_AREA_HEIGHT);
    this.playerController = new PlayerController(playerPos.x, playerPos.y);
    this.view.getGroup().add(this.playerController.getGroup());

    // spawn emus safely (offset by HUD height)
    this.emuControllers = [];
    const emuCount = Math.floor(Math.random() * 11) + 10; // Random between 10 and 20
    for (let i = 0; i < emuCount; i++) {
      const emuPos = getSafeSpawnPosition(this.obstacleModels, 24, 24, GAME_AREA_Y, GAME_AREA_HEIGHT);
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
    if (e.code === "Space" && this.model.canShoot()) {
      if (this.model.consumeAmmo()) {
        const bullet = this.playerController.shoot();
        this.bulletControllers.push(bullet);
        this.view.getGroup().add(bullet.getGroup());
        this.view.updateAmmo(this.model.getAmmo());
      }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.key);
  }

  private gameLoop = () => {
    if (!this.running) return;

    // update timer
    this.model.updateTimer();
    this.view.updateTimer(this.model.getTimeRemaining());
    this.view.updateAmmo(this.model.getAmmo());

    // Check if ammo is out
    if (this.model.getAmmo() === 0 && this.running) {
      this.endGame("ammo");
      return;
    }

    // Check if time is up
    if (this.model.isTimeUp() && this.running) {
      this.endGame("time");
      return;
    }

    // update player (with adjusted boundaries for game area)
    this.playerController.update(this.keys, this.obstacleModels, STAGE_WIDTH, STAGE_HEIGHT, GAME_AREA_Y, GAME_AREA_HEIGHT);

    // update bullets
    this.bulletControllers.forEach((b) => b.update(this.obstacleModels));
    this.bulletControllers = this.bulletControllers.filter((b) => b.isActive());

    // update emus (with adjusted boundaries for game area)
    this.emuControllers.forEach((e) =>
      e.update(this.obstacleModels, STAGE_WIDTH, STAGE_HEIGHT, GAME_AREA_Y, GAME_AREA_HEIGHT)
    );

    // check collisions (bullets -> emus)
    this.emuControllers = this.emuControllers.filter((emu) => {
      if (!emu.isActive()) return false;
      const died = emu.checkBulletCollision(this.bulletControllers);
      if (died) {
        this.model.incrementDefeat();
      }
      return emu.isActive();
    });
    
    // Update emus left count
    this.view.updateDefeat(this.emuControllers.length);

    // remove inactive bullets from scene (their views remain hidden)
    this.bulletControllers = this.bulletControllers.filter((b) => b.isActive());

    // Check if all emus are defeated
    if (this.emuControllers.length === 0 && this.running) {
      this.endGame("victory");
      return;
    }

    this.view.batchDraw();

    requestAnimationFrame(this.gameLoop);
  };

  endGame(reason: "ammo" | "time" | "victory" = "victory") {
    this.running = false;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.screenSwitcher.switchToScreen({
      type: "minigame2_end",
      emusKilled: this.model.getDefeat(),
      reason: reason,
    });
  }
}
