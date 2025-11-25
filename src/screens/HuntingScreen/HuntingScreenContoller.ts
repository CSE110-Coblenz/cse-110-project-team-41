// src/screens/Game2Screen/Game2ScreenController.ts
import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { HuntingScreenModel } from "./HuntingScreenModel";
import { HuntingScreenView } from "./HuntingScreenView";
import { PlayerController } from "../../components/Player/PlayerController";
import { ObstacleController } from "../../components/Obstacle/ObstacleController";
import { EmuController } from "../../components/Emu/EmuController";
import { BulletController } from "../../components/Bullet/BulletController";
import { STAGE_WIDTH, STAGE_HEIGHT, GAME_AREA_HEIGHT, GAME_AREA_Y } from "../../constants";
import { getSafeSpawnPosition } from "../../utils/getSafeSpawnPosition";
import { AudioManager } from "../../services/AudioManager";

export class HuntingScreenController extends ScreenController {
  private model: HuntingScreenModel;
  private view: HuntingScreenView;
  private screenSwitcher: ScreenSwitcher;
  private running = false;
  private audioManager : AudioManager;

  // controllers & models
  private playerController!: PlayerController;
  private obstacleControllers: ObstacleController[] = [];
  private emuControllers: EmuController[] = [];
  private bulletControllers: BulletController[] = [];

  private keys: Set<string> = new Set();

  constructor(screenSwitcher: ScreenSwitcher, audioManager: AudioManager) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.model = new HuntingScreenModel();
    this.view = new HuntingScreenView();
    this.audioManager = audioManager;
  }

  getView(): HuntingScreenView {
    return this.view;
  }

  startHuntingGame() {
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

  private cleanup(){
    this.playerController?.getGroup().destroy();
    
    this.obstacleControllers.forEach((oc) => oc.getNode().destroy());
    this.obstacleControllers = [];

    this.emuControllers.forEach((ec) => ec.getGroup().destroy());
    this.emuControllers = [];

    this.bulletControllers.forEach((bc) => bc.getGroup().destroy());
    this.bulletControllers = [];
  }

  private resetGame() {
    // reset model
    this.cleanup();
    this.model.reset();
    
    // Create rocks (gray rectangles)
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * (STAGE_WIDTH - 100);
      const y = GAME_AREA_Y + Math.random() * (GAME_AREA_HEIGHT - 100);
      let oc: ObstacleController;
      if ( i < 6 ) {
        const w = 40 + Math.random() * 40;
        const h = 40 + Math.random() * 40;
        oc = new ObstacleController(x, y, w, h, "rock");
      }else{
        const size = 30 + Math.random() * 30; // Diameter between 30-60
        oc = new ObstacleController(x, y, size, size, "bush");
      }
      this.obstacleControllers.push(oc);
      this.view.getGroup().add(oc.getNode());
    }
  

    // spawn player safely (offset by HUD height)
    
    const playerPos = getSafeSpawnPosition(this.obstacleControllers, 30, 30, GAME_AREA_Y, GAME_AREA_HEIGHT);
    this.playerController = new PlayerController(playerPos.x, playerPos.y, this.audioManager);
    this.view.getGroup().add(this.playerController.getGroup());

    // spawn emus safely (offset by HUD height)
    this.emuControllers = [];
    const emuCount = Math.floor(Math.random() * 11) + 10; // Random between 10 and 20
    for (let i = 0; i < emuCount; i++) {
      const emuPos = getSafeSpawnPosition(this.obstacleControllers, 24, 24, GAME_AREA_Y, GAME_AREA_HEIGHT);
      const ec = new EmuController(emuPos.x, emuPos.y);
      this.emuControllers.push(ec);
      this.view.getGroup().add(ec.getGroup());
    }
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
        this.audioManager.playSfx("shoot");
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
    this.playerController.update(this.keys, this.obstacleControllers, STAGE_WIDTH, STAGE_HEIGHT, GAME_AREA_Y, GAME_AREA_HEIGHT);

    // update bullets
    this.bulletControllers.forEach((b) => b.update(this.obstacleControllers, STAGE_WIDTH, STAGE_HEIGHT));
    this.bulletControllers = this.bulletControllers.filter((b) => b.isActive());

    // update emus (with adjusted boundaries for game area)
    this.emuControllers.forEach((e) =>
      e.update(this.obstacleControllers, STAGE_WIDTH, STAGE_HEIGHT, GAME_AREA_Y, GAME_AREA_HEIGHT)
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

    if (this.running) {
      requestAnimationFrame(this.gameLoop);
    }
    if (this.running) {
      requestAnimationFrame(this.gameLoop);
    }
  };

  endGame(reason: "ammo" | "time" | "victory" = "victory") {
    this.running = false;
    this.keys.clear();
    this.model.stopTimer();
    if (this.playerController) {
      this.playerController.stopAllSounds();
    }
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.screenSwitcher.switchToScreen({
      type: "minigame2_end",
      emusKilled: this.model.getDefeat(),
      reason: reason,
    });
  }
}
