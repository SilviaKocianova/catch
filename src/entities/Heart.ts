import { Player } from './Player';
import { World } from './World';
import { ParticleSystem } from '../systems/ParticleSystem';
import { HeartPhase } from '../core/types';
import {
  GRAVITY, GROUND_Y, WORLD_W,
  HEART_MAX_SPEED, HEART_ACCEL, HEART_FLEE_RADIUS,
  HEART_JUMP_RADIUS, HEART_JUMP_COOLDOWN, HEART_NEAR_END_ZONE,
  PLAYER_JUMP_FORCE, COLORS,
  HEART_FLOAT_TRIGGER, MOON_X, MOON_Y, HEART_ORBIT_RADIUS,
} from '../core/constants';

export class Heart {
  x: number;
  y: number;
  vx = 2.5;
  vy = 0;
  w = 30;
  h = 28;
  onGround = false;
  phase: HeartPhase = 'flee';

  scared      = false;
  scaredLevel = 0;
  wiggle      = 0;

  private orbitAngle = 0;
  private trailTimer = 0;
  private jumpCooldown = 0;
  private floatRiseTimer = 0;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  update(player: Player, world: World, particles: ParticleSystem, t: number): void {
    if (this.phase === 'caught') return;

    if (this.phase === 'orbiting') {
      this.behaviorOrbiting(t, particles);
      return;
    }

    if (this.phase === 'floating') {
      this.behaviorFloating(particles);
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.updateFearState(dist);

    if (this.isNearEnd()) {
      this.behaviorWaiting(t);

      if (dist < 180) {
        this.phase = 'floating';
        this.vx = 0;
        this.vy = -0.5;
        return;
      }
      this.applyPhysics();
      this.onGround = false;
      world.resolveCollisions(this);
      this.emitTrail(particles);
      return;
    }

    this.behaviorFleeing(player, dist);

    if (this.jumpCooldown > 0) this.jumpCooldown--;

    this.applyPhysics();
    this.onGround = false;
    world.resolveCollisions(this, () => {
      if (dist < 250) this.vx += 2.5;
    });

    this.emitTrail(particles);
  }

  private behaviorFloating(particles: ParticleSystem): void {
    this.floatRiseTimer++;
    const tx = MOON_X;
    this.vx += (tx - this.x) * 0.0005;
    this.vx *= 0.98;
    this.vy = Math.max(this.vy - 0.08, -4);

    this.x += this.vx;
    this.y += this.vy;

    if (this.floatRiseTimer % 3 === 0) {
      particles.spawn(
        this.x + this.w / 2, this.y + this.h,
        (Math.random() - 0.5) * 2, Math.random() * 1.5,
        Math.random() < 0.5 ? COLORS.heartRed : COLORS.heartPink,
        Math.random() * 3 + 1, 40
      );
    }

    const dx = this.x - MOON_X;
    const dy = this.y - MOON_Y;
    if (Math.sqrt(dx * dx + dy * dy) < HEART_ORBIT_RADIUS + 60) {
      this.phase = 'orbiting';
      this.orbitAngle = Math.atan2(dy, dx);
    }
  }

  private behaviorOrbiting(t: number, particles: ParticleSystem): void {
    this.orbitAngle += 0.018;
    this.x = MOON_X + Math.cos(this.orbitAngle) * HEART_ORBIT_RADIUS;
    this.y = MOON_Y + Math.sin(this.orbitAngle) * HEART_ORBIT_RADIUS;

    if (t % 4 === 0) {
      particles.spawn(
        this.x + this.w / 2, this.y + this.h / 2,
        (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1,
        COLORS.heartPink, Math.random() * 2 + 1, 30
      );
    }
  }

  private updateFearState(dist: number): void {
    this.scared = dist < HEART_FLEE_RADIUS;
    this.scaredLevel = Math.max(0, Math.min(1, (HEART_FLEE_RADIUS - dist) / HEART_FLEE_RADIUS));
  }

  private behaviorFleeing(player: Player, dist: number): void {
    if (this.scared) {
      const direction = this.x > player.x ? 1 : -1;
      this.vx += HEART_ACCEL * direction;

      const playerIsClose = dist < HEART_JUMP_RADIUS;
      const playerBehind  = player.x < this.x;
      if (playerIsClose && playerBehind && this.onGround && this.jumpCooldown <= 0) {
        this.vy = PLAYER_JUMP_FORCE * 0.85;
        this.onGround = false;
        this.jumpCooldown = HEART_JUMP_COOLDOWN;
      }
    } else {
      this.vx += 0.05;
    }
    this.vx = Math.max(-2, Math.min(HEART_MAX_SPEED, this.vx));
  }

  private behaviorWaiting(t: number): void {
    this.vx *= 0.92;
    if (Math.abs(this.vx) < 0.1) this.vx = 0;
    this.wiggle = Math.sin(t * 0.15) * 8;
  }

  private applyPhysics(): void {
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    this.x = Math.max(50, Math.min(WORLD_W - 80, this.x));
  }

  private emitTrail(particles: ParticleSystem): void {
    this.trailTimer++;
    const interval = this.scared ? 2 : 6;
    if (this.trailTimer > interval) {
      this.trailTimer = 0;
      particles.spawn(
        this.x + this.w / 2, this.y + this.h / 2,
        (Math.random() - 0.5) * 1.5, -Math.random() * 2 - 1,
        this.scared ? COLORS.heartRed : 'rgba(255,150,170,0.6)',
        Math.random() * 3 + 2,
        this.scared ? 20 : 35
      );
    }
  }

  isNearEnd(): boolean {
    return this.x > WORLD_W - HEART_NEAR_END_ZONE;
  }

  isNearFloatTrigger(): boolean {
    return this.x > WORLD_W - HEART_FLOAT_TRIGGER;
  }

  isFloatingOrOrbiting(): boolean {
    return this.phase === 'floating' || this.phase === 'orbiting';
  }

  catch(): void {
    this.phase = 'caught';
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number, t: number): void {
    if (this.phase === 'caught') return;

    const sx = this.x - camX;
    const sy = this.y - camY;

    if (!this.isFloatingOrOrbiting()) {
      this.drawShadow(ctx, sx);
    }

    if (this.scared) this.drawGlow(ctx, sx, sy, t);

    const pulse = Math.sin(t * 0.07) * 0.12 + 1;
    const size  = 28 * pulse;

    this.drawHeartShape(ctx, sx, sy - size * 0.1, size, COLORS.heartRed, 1);
    this.drawHighlight(ctx, sx, sy);

    if (this.scared && this.scaredLevel > 0.5) this.drawExclamation(ctx, sx, sy, t);
  }

  private drawShadow(ctx: CanvasRenderingContext2D, sx: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + 15, GROUND_Y + 4, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawGlow(ctx: CanvasRenderingContext2D, sx: number, sy: number, t: number): void {
    const pulse = Math.sin(t * 0.07) * 0.12 + 1;
    const size  = 28 * pulse;
    const gs = size * 1.4;
    const gx = sx - gs / 2;
    const gy = sy - gs * 0.1;

    ctx.save();
    ctx.globalAlpha = this.scaredLevel * 0.3;
    ctx.fillStyle   = COLORS.heartRed;
    ctx.shadowColor = COLORS.heartRed;
    ctx.shadowBlur  = 20;
    this.drawHeartPath(ctx, gx, gy, gs);
    ctx.fill();
    ctx.restore();
  }

  private drawHighlight(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle   = COLORS.heartPink;
    ctx.beginPath();
    ctx.ellipse(sx - 4, sy + 5, 5, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawExclamation(ctx: CanvasRenderingContext2D, sx: number, sy: number, t: number): void {
    ctx.save();
    ctx.globalAlpha  = (this.scaredLevel - 0.5) * 2;
    ctx.fillStyle    = COLORS.heartPink;
    ctx.font         = `bold ${12 + this.scaredLevel * 6}px 'Crimson Pro', serif`;
    ctx.textAlign    = 'center';
    ctx.fillText('!', sx, sy - 20 - Math.sin(t * 0.1) * 5);
    ctx.restore();
  }

  private drawHeartShape(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    size: number, color: string, alpha: number
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 10 + size * 0.3;
    this.drawHeartPath(ctx, x - size / 2, y, size);
    ctx.fill();
    ctx.restore();
  }

  private drawHeartPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size * 0.25);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size * 0.25);
    ctx.bezierCurveTo(x, y + size * 0.6, x + size / 2, y + size * 0.85, x + size / 2, y + size);
    ctx.bezierCurveTo(x + size / 2, y + size * 0.85, x + size, y + size * 0.6, x + size, y + size * 0.25);
    ctx.bezierCurveTo(x + size, y, x + size / 2, y, x + size / 2, y + size * 0.25);
    ctx.closePath();
  }

  get centerX(): number { return this.x + this.w / 2; }
  get centerY(): number { return this.y + this.h / 2; }
}