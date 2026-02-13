import { BgElement } from '../core/types';
import { CANVAS_W, CANVAS_H, WORLD_W, BG_ELEMENT_COUNT, COLORS } from '../core/constants';

export class Background {
  private elements: BgElement[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    for (let i = 0; i < BG_ELEMENT_COUNT; i++) {
      this.elements.push({
        type:          Math.random() < 0.6 ? 'star' : 'petal',
        x:             Math.random() * WORLD_W,
        y:             Math.random() * CANVAS_H * 0.8,
        size:          Math.random() * 3 + 1,
        alpha:         Math.random() * 0.4 + 0.1,
        twinkleSpeed:  Math.random() * 0.03 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
        color:         Math.random() < 0.5 ? COLORS.bgStar : COLORS.bgPetal,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, t: number, spaceAlpha = 0): void {
    const groundAlpha = 1 - spaceAlpha;
    if (groundAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = groundAlpha;
    this.drawSky(ctx);
    this.drawElements(ctx, camX, t);
    ctx.restore();
  }

  private drawSky(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0,   COLORS.bgDark);
    grad.addColorStop(0.5, COLORS.bgMid);
    grad.addColorStop(1,   COLORS.bgLight);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  private drawElements(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
    for (const el of this.elements) {
      const screenX = ((el.x - camX * 0.2) % WORLD_W + WORLD_W) % WORLD_W;
      if (screenX < -20 || screenX > CANVAS_W + 20) continue;

      const twinkle = Math.sin(t * el.twinkleSpeed + el.twinkleOffset) * 0.5 + 0.5;

      ctx.save();
      ctx.globalAlpha = el.alpha * (0.5 + twinkle * 0.5);

      if (el.type === 'star') {
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.arc(screenX, el.y, el.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = el.color;
        ctx.save();
        ctx.translate(screenX, el.y);
        ctx.rotate(t * 0.005 + el.twinkleOffset);
        ctx.beginPath();
        ctx.ellipse(0, 0, el.size, el.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }
}