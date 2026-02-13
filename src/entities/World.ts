import { Platform } from '../core/types';
import {
  CANVAS_H, WORLD_W, GROUND_Y,
  PLATFORM_COUNT, COLORS,
} from '../core/constants';

export class World {
  readonly platforms: Platform[];
  readonly groundY: number = GROUND_Y;

  constructor() {
    this.platforms = this.generatePlatforms();
  }

  private generatePlatforms(): Platform[] {
    const plats: Platform[] = [];
    for (let i = 0; i < PLATFORM_COUNT; i++) {
      plats.push({
        x: 400 + i * 220 + Math.sin(i * 1.7) * 80,
        y: CANVAS_H - 80 - 60 - Math.abs(Math.sin(i * 0.8)) * 100,
        w: 80 + Math.random() * 40,
        h: 12,
      });
    }
    return plats;
  }

  resolveCollisions(
    entity: { x: number; y: number; vx: number; vy: number; w: number; h: number; onGround: boolean },
    onPlatformLand?: () => void
  ): void {
    if (entity.y + entity.h >= this.groundY) {
      entity.y = this.groundY - entity.h;
      entity.vy = 0;
      entity.onGround = true;
    }

    for (const p of this.platforms) {
      const prevBottom = entity.y + entity.h - entity.vy;
      if (
        entity.vy >= 0 &&
        entity.x + entity.w > p.x &&
        entity.x < p.x + p.w &&
        entity.y + entity.h >= p.y &&
        entity.y + entity.h <= p.y + p.h + 10 &&
        prevBottom <= p.y + 2
      ) {
        entity.y = p.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
        onPlatformLand?.();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY = 0): void {
    this.drawGround(ctx, camY);
    this.drawPlatforms(ctx, camX, camY);
    this.drawEndPortal(ctx, camX, camY);
  }

  private drawGround(ctx: CanvasRenderingContext2D, camY: number): void {
    const screenGY = this.groundY - camY;
    const gGrad = ctx.createLinearGradient(0, screenGY, 0, screenGY + 200);
    gGrad.addColorStop(0, COLORS.groundTop);
    gGrad.addColorStop(1, COLORS.groundBottom);
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, screenGY, 9999, 200);

    ctx.strokeStyle = COLORS.groundLine;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(255,80,110,0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, screenGY);
    ctx.lineTo(9999, screenGY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const p of this.platforms) {
      const sx = p.x - camX;
      const sy = p.y - camY;
      if (sx > 9999 + 100 || sx + p.w < -100) continue;

      const pGrad = ctx.createLinearGradient(sx, sy, sx, sy + p.h);
      pGrad.addColorStop(0, COLORS.platformTop);
      pGrad.addColorStop(1, COLORS.platformBottom);
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      roundRect(ctx, sx, sy, p.w, p.h, 4);
      ctx.fill();
      ctx.strokeStyle = COLORS.platformStroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private drawEndPortal(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const endX = WORLD_W - 100 - camX;
    const groundScreenY = this.groundY - camY;
    if (endX < -200 || endX > 9999 + 200) return;

    const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
    ctx.save();
    ctx.translate(endX + 40, groundScreenY);

    const archGrad = ctx.createRadialGradient(0, -80, 10, 0, -80, 100);
    archGrad.addColorStop(0, `rgba(255,80,120,${0.3 + pulse * 0.2})`);
    archGrad.addColorStop(1, 'rgba(255,80,120,0)');
    ctx.fillStyle = archGrad;
    ctx.fillRect(-100, -180, 200, 200);

    ctx.strokeStyle = `rgba(255,120,150,${0.6 + pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,100,130,0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, -80, 80, Math.PI, 0, false);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,160,180,${0.4 + pulse * 0.3})`;
    ctx.font = 'bold 14px "Crimson Pro", serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.fillText('♡', 0, -80);
    ctx.restore();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
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