import { Player } from './Player';
import { World } from './World';
import { ParticleSystem } from '../systems/ParticleSystem';
import { GRAVITY, GROUND_Y, WORLD_W, DOG_SPEED, DOG_BITE_RADIUS_X, DOG_BITE_RADIUS_Y } from '../core/constants';

export class Dog {
  x: number;
  y: number;
  vx = DOG_SPEED;
  vy = 0;
  w = 36;
  h = 26;
  onGround = false;
  alive = true;

  private animFrame = 0;
  private animTimer = 0;
  private barkTimer = 0;
  private showBark = false;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  update(player: Player, world: World, particles: ParticleSystem): void {
    if (!this.alive) return;


    const targetVx = player.x > this.x ? DOG_SPEED : DOG_SPEED * 0.5;
    this.vx += (targetVx - this.vx) * 0.08;


    const dist = player.x - this.x;
    if (dist < 200 && dist > 0) {
      this.vx = Math.min(this.vx + 0.15, DOG_SPEED * 1.3);
      this.barkTimer++;
      if (this.barkTimer > 40) {
        this.barkTimer = 0;
        this.showBark = true;
        setTimeout(() => { this.showBark = false; }, 600);
      }
    }

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    this.x = Math.max(0, Math.min(WORLD_W - this.w, this.x));

    this.onGround = false;
    world.resolveCollisions(this);


    if (this.onGround && this.animFrame % 2 === 0) {
      particles.spawn(
        this.x + 4, this.y + this.h,
        (Math.random() - 0.5) * 1.5, -Math.random() * 0.8,
        'rgba(230,150,80,0.35)', Math.random() * 2 + 1, 12
      );
    }


    this.animTimer++;
    if (this.animTimer > 6) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  
  isBiting(player: Player): boolean {
    if (!this.alive) return false;
    const dx = Math.abs(this.x + this.w / 2 - player.centerX);
    const dy = Math.abs(this.y + this.h / 2 - player.centerY);
    return dx < DOG_BITE_RADIUS_X && dy < DOG_BITE_RADIUS_Y;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
    if (!this.alive) return;
    const sx = this.x - camX;
    const sy = this.y;


    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(sx + this.w / 2, GROUND_Y + 4, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(sx + this.w / 2, sy + this.h / 2);


    const bob = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 1.5 : 0;
    ctx.translate(0, bob);

    this.drawBody(ctx, t);
    this.drawHead(ctx);
    this.drawLegs(ctx);
    this.drawTail(ctx, t);

    if (this.showBark) this.drawBark(ctx);

    ctx.restore();
  }

  private drawBody(ctx: CanvasRenderingContext2D, _t: number): void {
   
    ctx.fillStyle = '#e07030';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.fillStyle = '#f5e8c8';
    ctx.beginPath();
    ctx.ellipse(2, 5, 9, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawHead(ctx: CanvasRenderingContext2D): void {
    const hx = 14;
    const hy = -4;

    
    ctx.fillStyle = '#e07030';
    ctx.beginPath();
    ctx.ellipse(10, 0, 6, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.fillStyle = '#e07030';
    ctx.beginPath();
    ctx.ellipse(hx, hy, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.fillStyle = '#f5e8c8';
    ctx.beginPath();
    ctx.ellipse(hx + 2, hy + 2, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#e07030';
    ctx.beginPath();
    ctx.moveTo(hx - 5, hy - 8);
    ctx.lineTo(hx - 10, hy - 18);
    ctx.lineTo(hx - 1, hy - 9);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(hx + 3, hy - 9);
    ctx.lineTo(hx + 5, hy - 19);
    ctx.lineTo(hx + 10, hy - 9);
    ctx.closePath();
    ctx.fill();


    ctx.fillStyle = '#c04a20';
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy - 9);
    ctx.lineTo(hx - 8, hy - 16);
    ctx.lineTo(hx - 2, hy - 10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(hx + 4, hy - 10);
    ctx.lineTo(hx + 5, hy - 16);
    ctx.lineTo(hx + 8, hy - 10);
    ctx.closePath();
    ctx.fill();


    ctx.fillStyle = '#1a0a00';
    ctx.beginPath();
    ctx.ellipse(hx + 4, hy - 2, 2.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(hx + 5, hy - 3, 1, 1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2a0a00';
    ctx.beginPath();
    ctx.ellipse(hx + 9, hy + 1, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#cc3030';
    ctx.beginPath();
    ctx.ellipse(hx + 10, hy + 5, 3, 2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6070';
    ctx.beginPath();
    ctx.ellipse(hx + 11, hy + 6, 2, 3, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawLegs(ctx: CanvasRenderingContext2D): void {
    const swing = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 18 : 0;
    const altSwing = -swing;

    ctx.strokeStyle = '#e07030';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.save();
    ctx.translate(10, 6);
    ctx.rotate((swing * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(2, 13); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(6, 6);
    ctx.rotate((altSwing * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, 13); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-8, 7);
    ctx.rotate((altSwing * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(2, 13); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-12, 7);
    ctx.rotate((swing * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, 13); ctx.stroke();
    ctx.restore();
  }

  private drawTail(ctx: CanvasRenderingContext2D, t: number): void {
    const wag = Math.sin(t * 0.18) * 20;

    ctx.save();
    ctx.translate(-14, -2);
    ctx.rotate((-60 + wag) * Math.PI / 180);

    ctx.strokeStyle = '#e07030';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4, -10, 2, -16);
    ctx.stroke();

    ctx.fillStyle = '#f5e8c8';
    ctx.beginPath();
    ctx.ellipse(2, -16, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBark(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(22, -18);
    ctx.fillStyle = 'rgba(255,240,180,0.95)';
    ctx.strokeStyle = 'rgba(200,120,40,0.8)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(-2, -12, 32, 18, 6);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(-4, 10);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8b3a00';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WOF!', 14, 0);
    ctx.restore();
  }

  get centerX(): number { return this.x + this.w / 2; }
  get centerY(): number { return this.y + this.h / 2; }
}