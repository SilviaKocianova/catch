import { InputManager } from '../core/InputManager';
import { World } from './World';
import { ParticleSystem } from '../systems/ParticleSystem';
import {
  GROUND_Y, PLAYER_SPEED, PLAYER_JUMP_FORCE,
  GRAVITY, WORLD_W, COLORS,
  SPACE_GRAVITY, SPACE_FLOAT_SPEED,
} from '../core/constants';

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  w = 28;
  h = 36;
  onGround = false;
  facing = 1;
  isAstronaut = false;

  private animFrame = 0;
  private animTimer = 0;
  private stepParticleTimer = 0;
  private thrustTimer = 0;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  update(input: InputManager, world: World, particles: ParticleSystem): void {
    if (this.isAstronaut) {
      this.updateAstronaut(input, particles);
    } else {
      this.updateNormal(input, world, particles);
    }

    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  private updateNormal(input: InputManager, world: World, particles: ParticleSystem): void {
    if (input.left)       { this.vx = -PLAYER_SPEED; this.facing = -1; }
    else if (input.right) { this.vx =  PLAYER_SPEED; this.facing =  1; }
    else this.vx *= 0.75;

    if (input.jump && this.onGround) {
      this.vy = PLAYER_JUMP_FORCE;
      this.onGround = false;
      for (let i = 0; i < 8; i++) {
        particles.spawn(
          this.x + this.w / 2, this.y + this.h,
          (Math.random() - 0.5) * 3, -Math.random() * 3,
          COLORS.heartPink, Math.random() * 3 + 1, 20
        );
      }
    }

    this.vy += GRAVITY;
    this.x  += this.vx;
    this.y  += this.vy;
    this.x = Math.max(0, Math.min(WORLD_W - this.w, this.x));

    this.onGround = false;
    world.resolveCollisions(this);

    if (this.onGround && Math.abs(this.vx) > 1) {
      this.stepParticleTimer++;
      if (this.stepParticleTimer > 8) {
        this.stepParticleTimer = 0;
        particles.spawn(
          this.x + this.w / 2, this.y + this.h,
          (Math.random() - 0.5) * 1.5, -Math.random(),
          COLORS.particleStep, Math.random() * 2 + 1, 15
        );
      }
    }
  }

  private updateAstronaut(input: InputManager, particles: ParticleSystem): void {
    if (input.left)       { this.vx -= 0.3; this.facing = -1; }
    else if (input.right) { this.vx += 0.3; this.facing =  1; }
    else this.vx *= 0.94;

    if (input.jump) {
      this.vy -= 0.5;
    } else {
      this.vy += SPACE_GRAVITY;
    }

    this.vx = Math.max(-SPACE_FLOAT_SPEED, Math.min(SPACE_FLOAT_SPEED, this.vx));
    this.vy = Math.max(-5, Math.min(2, this.vy));

    this.x += this.vx;
    this.y += this.vy;

    this.x = Math.max(0, Math.min(WORLD_W - this.w, this.x));
    if (this.y + this.h > GROUND_Y) {
      this.y = GROUND_Y - this.h;
      this.vy = 0;
    }

    this.thrustTimer++;
    if (this.thrustTimer > 3) {
      this.thrustTimer = 0;
      particles.spawn(
        this.x + this.w / 2, this.y + this.h,
        (Math.random() - 0.5) * 2, Math.random() * 2 + 1,
        Math.random() < 0.5 ? '#60c8ff' : '#a0e0ff',
        Math.random() * 3 + 1, 25
      );
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    ctx.translate(sx + this.w / 2, sy + this.h / 2);
    ctx.scale(this.facing, 1);

    const bounce = this.onGround && Math.abs(this.vx) > 0.5 && !this.isAstronaut
      ? Math.sin(this.animFrame * Math.PI / 2) * 2
      : 0;

    if (!this.isAstronaut) {
      ctx.save();
      ctx.translate(0, this.h / 2 + 2);
      ctx.scale(1, 0.3);
      const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
      shadow.addColorStop(0, 'rgba(0,0,0,0.4)');
      shadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(0, bounce);

    if (this.isAstronaut) {
      this.drawAstronautSuit(ctx);
    } else {
      this.drawBody(ctx);
      this.drawHead(ctx);
      this.drawArms(ctx);
      this.drawLegs(ctx);
    }

    ctx.restore();
  }

  private drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLORS.playerBody;
    this.roundRect(ctx, -this.w / 2, -this.h / 2, this.w, this.h * 0.65, 6);
    ctx.fill();
  }

  private drawHead(ctx: CanvasRenderingContext2D): void {
    const eyeY = -this.h / 2 - 10;
    this.drawHair(ctx, eyeY);
    ctx.fillStyle = COLORS.playerHead;
    ctx.beginPath();
    ctx.ellipse(0, eyeY, 13, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d0a14';
    ctx.beginPath(); ctx.ellipse(-5, eyeY, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5,  eyeY, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,100,120,0.4)';
    ctx.beginPath(); ctx.ellipse(-8, eyeY + 3, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8,  eyeY + 3, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    this.drawBeard(ctx, eyeY);
  }

  private drawHair(ctx: CanvasRenderingContext2D, eyeY: number): void {
    ctx.fillStyle = '#f5c842';
    ctx.beginPath(); ctx.ellipse(0, eyeY - 6, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-12, eyeY - 2, 5, 7, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, eyeY - 2, 5, 7, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-5, eyeY - 14, 4, 6, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, eyeY - 15, 4, 6, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, eyeY - 16, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  private drawBeard(ctx: CanvasRenderingContext2D, eyeY: number): void {
    ctx.fillStyle = '#e06010';
    ctx.beginPath(); ctx.ellipse(-8, eyeY + 7, 5, 4, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, eyeY + 7, 5, 4, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, eyeY + 11, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, eyeY + 15, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  }

  private drawArms(ctx: CanvasRenderingContext2D): void {
    const swing = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 15 : -30;
    ctx.strokeStyle = COLORS.playerBody;
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.save(); ctx.translate(-this.w / 2, -this.h / 2 + 5);
    ctx.rotate((swing * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, 14); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(this.w / 2, -this.h / 2 + 5);
    ctx.rotate((-swing * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, 14); ctx.stroke(); ctx.restore();
  }

  private drawLegs(ctx: CanvasRenderingContext2D): void {
    const swing = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 20 : 0;
    ctx.strokeStyle = COLORS.playerLimb; ctx.lineWidth = 8;
    ctx.save(); ctx.translate(-6, this.h / 2 - 10);
    ctx.rotate((swing * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, 14); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(6, this.h / 2 - 10);
    ctx.rotate((-swing * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3, 14); ctx.stroke(); ctx.restore();
  }


  private drawAstronautSuit(ctx: CanvasRenderingContext2D): void {
    const hw = this.w / 2;
    const hh = this.h / 2;

    ctx.fillStyle = '#ddeeff';
    this.roundRect(ctx, -hw - 2, -hh, this.w + 4, this.h * 0.7, 8);
    ctx.fill();

    ctx.strokeStyle = '#a0c0e0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, -hh + 4); ctx.lineTo(-6, -hh + 16);
    ctx.moveTo(6, -hh + 4);  ctx.lineTo(6, -hh + 16);
    ctx.stroke();

    ctx.fillStyle = '#b0c8e8';
    this.roundRect(ctx, -8, -hh + 6, 16, 10, 3);
    ctx.fill();
    ctx.fillStyle = '#ff8fa3';
    ctx.beginPath(); ctx.ellipse(0, -hh + 11, 3, 3, 0, 0, Math.PI * 2); ctx.fill();

    const eyeY = -hh - 12;
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath();
    ctx.ellipse(0, eyeY, 16, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,200,80,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, eyeY + 1, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-4, eyeY - 3, 4, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5c842';
    ctx.beginPath();
    ctx.ellipse(0, eyeY - 13, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ddeeff';
    ctx.lineWidth = 8; ctx.lineCap = 'round';
    const armFloat = Math.sin(this.animFrame * Math.PI / 2) * 8;
    ctx.save(); ctx.translate(-hw - 2, -hh + 8);
    ctx.rotate(((-20 + armFloat) * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, 14); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(hw + 2, -hh + 8);
    ctx.rotate(((20 - armFloat) * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, 14); ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#ddeeff';
    ctx.lineWidth = 9;
    ctx.save(); ctx.translate(-5, hh - 8);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, 14); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(5, hh - 8);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3, 14); ctx.stroke(); ctx.restore();

    ctx.fillStyle = '#a0b8d0';
    ctx.beginPath(); ctx.ellipse(-8, hh + 6, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8,  hh + 6, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  get centerX(): number { return this.x + this.w / 2; }
  get centerY(): number { return this.y + this.h / 2; }
}