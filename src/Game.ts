import { GameState } from './core/types';
import {
  CANVAS_W, CANVAS_H, GROUND_Y, WORLD_W,
  WIN_CATCH_RADIUS_X, WIN_CATCH_RADIUS_Y,
  COLORS, DOG_START_OFFSET, DOG_SLOW_ZONE,
  MOON_X, MOON_Y, SPACE_WIN_RADIUS,
} from './core/constants';
import { InputManager } from './core/InputManager';
import { Player } from './entities/Player';
import { Heart } from './entities/Heart';
import { Dog } from './entities/Dog';
import { World } from './entities/World';
import { Background } from './systems/Background';
import { SpaceScene } from './systems/SpaceScene';
import { Camera } from './systems/Camera';
import { ParticleSystem } from './systems/ParticleSystem';
import { HUD } from './ui/HUD';
import { ScreenManager } from './ui/ScreenManager';

export class Game {
  private ctx: CanvasRenderingContext2D;

  private state: GameState = GameState.START;
  private t = 0;

  private spaceAlpha = 0;

  private input      = new InputManager();
  private camera     = new Camera();
  private particles  = new ParticleSystem();
  private background = new Background();
  private spaceScene = new SpaceScene();

  private world:  World;
  private player: Player;
  private heart:  Heart;
  private dog:    Dog;

  private hud:     HUD;
  private screens: ScreenManager;

  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx    = canvas.getContext('2d')!;
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;

    this.world  = new World();
    this.player = new Player(100, GROUND_Y - 40);
    this.heart  = new Heart(400, GROUND_Y - 60);
    this.dog    = new Dog(100 + DOG_START_OFFSET, GROUND_Y - 26);
    this.hud    = new HUD();
    this.screens = new ScreenManager(() => this.startGame());

    this.screens.showStart();
    this.hud.hide();
  }

  private scheduleTimeout(fn: () => void, ms: number): void {
    this.pendingTimeouts.push(setTimeout(fn, ms));
  }

  private clearTimeouts(): void {
    this.pendingTimeouts.forEach(id => clearTimeout(id));
    this.pendingTimeouts = [];
  }

  private startGame(): void {
    this.clearTimeouts();
    this.screens.hideGameOver();
    this.screens.hideWin();

    this.player     = new Player(100, GROUND_Y - 40);
    this.heart      = new Heart(400, GROUND_Y - 60);
    this.dog        = new Dog(100 + DOG_START_OFFSET, GROUND_Y - 26);
    this.particles  = new ParticleSystem();
    this.camera     = new Camera();
    this.spaceAlpha = 0;
    this.t          = 0;

    this.state = GameState.PLAYING;
    this.hud.show();
  }

  private triggerWin(): void {
    this.heart.catch();
    this.state = GameState.WIN;

    for (let i = 0; i < 50; i++) {
      this.scheduleTimeout(() => {
        this.particles.burst(
          this.heart.centerX, this.heart.centerY,
          1, [COLORS.heartRed, COLORS.heartPink, '#ffffff']
        );
      }, i * 25);
    }

    this.scheduleTimeout(() => {
      this.screens.showWin();
    }, 1200);
  }

  private triggerGameOver(): void {
    this.state     = GameState.GAME_OVER;
    this.dog.alive = false;

    for (let i = 0; i < 20; i++) {
      this.particles.spawn(
        this.player.centerX, this.player.centerY,
        (Math.random() - 0.5) * 6, -Math.random() * 5 - 2,
        Math.random() < 0.5 ? '#ff3060' : '#ffb3c1',
        Math.random() * 4 + 2, 40
      );
    }

    this.hud.hide();
    this.scheduleTimeout(() => this.screens.showGameOver(), 600);
  }

  private update(): void {
    if (this.state === GameState.PLAYING) {
      this.player.update(this.input, this.world, this.particles);
      this.heart.update(this.player, this.world, this.particles, this.t);
      this.updateDog();
      this.updateSpaceTransition();
      this.checkAstronautActivation();
      const camTargetY = this.player.isAstronaut && this.player.y < 0 ? this.player.y : undefined;
      this.camera.follow(this.player.x, camTargetY);
      this.checkWinCondition();
      if (!this.player.isAstronaut) this.checkBiteCondition();
      this.hud.update(this.player, this.heart);
    } else if (this.state === GameState.WIN || this.state === GameState.GAME_OVER) {
      const camTargetY = this.player.isAstronaut && this.player.y < 0 ? this.player.y : undefined;
      this.camera.follow(this.player.x, camTargetY);
    }

    this.particles.update();
  }

  private updateDog(): void {
    const distFromEnd = WORLD_W - this.dog.x;
    if (distFromEnd < DOG_SLOW_ZONE) {
      const slowFactor = distFromEnd / DOG_SLOW_ZONE;
      this.dog.vx *= (0.96 + slowFactor * 0.04);
    }
    this.dog.update(this.player, this.world, this.particles);
  }

  private updateSpaceTransition(): void {
    if (this.heart.isFloatingOrOrbiting() || this.player.isAstronaut) {
      const riseProgress = Math.max(0, -this.camera.y) / 600;
      this.spaceAlpha = Math.min(1, riseProgress);
    }
  }

  private checkAstronautActivation(): void {
    if (this.player.isAstronaut) return;
    if (!this.heart.isFloatingOrOrbiting()) return;

    const dx = this.player.centerX - this.heart.centerX;
    const dy = this.player.centerY - this.heart.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 220) return;

    this.player.isAstronaut = true;
    this.player.vy = -3;
    this.dog.alive = false;

    for (let i = 0; i < 20; i++) {
      this.particles.spawn(
        this.player.centerX, this.player.centerY,
        (Math.random() - 0.5) * 8, -Math.random() * 6 - 2,
        Math.random() < 0.5 ? '#60c8ff' : '#ffffff',
        Math.random() * 4 + 2, 40
      );
    }
  }

  private checkWinCondition(): void {
    if (this.heart.phase === 'orbiting' && this.player.isAstronaut) {
      const dx = this.player.centerX - this.heart.centerX;
      const dy = this.player.centerY - this.heart.centerY;
      if (Math.sqrt(dx * dx + dy * dy) < SPACE_WIN_RADIUS) {
        this.triggerWin();
      }
    }
  }

  private checkBiteCondition(): void {
    if (this.dog.isBiting(this.player)) {
      this.triggerGameOver();
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    this.spaceScene.draw(this.ctx, this.camera.x, this.camera.y, this.spaceAlpha, this.t);

    this.background.draw(this.ctx, this.camera.x, this.t, this.spaceAlpha);
    this.world.draw(this.ctx, this.camera.x, this.camera.y);

    this.particles.draw(this.ctx, this.camera.x, this.camera.y);
    this.heart.draw(this.ctx, this.camera.x, this.camera.y, this.t);
    this.dog.draw(this.ctx, this.camera.x, this.t);
    this.player.draw(this.ctx, this.camera.x, this.camera.y);
  }

  start(): void {
    const loop = () => {
      this.t++;
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}