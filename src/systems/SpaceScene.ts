import { CANVAS_W, CANVAS_H, MOON_X, MOON_Y, MOON_RADIUS } from '../core/constants';

interface Planet {
  wx: number;
  wy: number;
  radius: number;
  color: string;
  rimColor: string;
  hasRing: boolean;
  ringColor: string;
  offset: number;
}

export class SpaceScene {
  private planets: Planet[] = [];
  private stars: { x: number; y: number; size: number; twinkle: number }[] = [];

  constructor() {
    this.generatePlanets();
    this.generateStars();
  }

  private generatePlanets(): void {
    this.planets = [
      { wx: MOON_X - 600, wy: MOON_Y - 400, radius: 55, color: '#c44444', rimColor: '#e88888', hasRing: false, ringColor: '', offset: 0 },
      { wx: MOON_X + 500, wy: MOON_Y - 300, radius: 80, color: '#e8a040', rimColor: '#f0c060', hasRing: true,  ringColor: 'rgba(240,180,60,0.4)', offset: 1.2 },
      { wx: MOON_X - 350, wy: MOON_Y + 400, radius: 40, color: '#4080c0', rimColor: '#60a0e0', hasRing: false, ringColor: '', offset: 2.4 },
      { wx: MOON_X + 700, wy: MOON_Y + 250, radius: 30, color: '#880088', rimColor: '#cc00aa', hasRing: false, ringColor: '', offset: 3.1 },
    ];
  }

  private generateStars(): void {

    const spread = 3000;
    for (let i = 0; i < 500; i++) {
      this.stars.push({
        x: MOON_X - spread / 2 + Math.random() * spread,
        y: MOON_Y - 600 + Math.random() * 1400,
        size: Math.random() * 2 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number, alpha: number, t: number): void {
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    this.drawSpaceBg(ctx);
    this.drawStars(ctx, camX, camY, t);
    this.drawPlanets(ctx, camX, camY, t);
    this.drawMoon(ctx, camX, camY, t);

    ctx.restore();
  }

  private drawSpaceBg(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#000008');
    grad.addColorStop(0.5, '#04000e');
    grad.addColorStop(1, '#080018');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  private drawStars(ctx: CanvasRenderingContext2D, camX: number, camY: number, t: number): void {
    for (const s of this.stars) {

      const sx = s.x - camX * 0.15;
      const sy = s.y - camY * 0.15;
      if (sx < -5 || sx > CANVAS_W + 5) continue;
      if (sy < -5 || sy > CANVAS_H + 5) continue;

      const twinkle = Math.sin(t * 0.04 + s.twinkle) * 0.4 + 0.6;
      ctx.save();
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPlanets(ctx: CanvasRenderingContext2D, camX: number, camY: number, t: number): void {
    for (const p of this.planets) {
      const sx = p.wx - camX;
      const sy = p.wy - camY;
      if (sx < -p.radius * 3 || sx > CANVAS_W + p.radius * 3) continue;
      if (sy < -p.radius * 3 || sy > CANVAS_H + p.radius * 3) continue;

      const floatY = Math.sin(t * 0.008 + p.offset) * 8;

      ctx.save();
      ctx.translate(sx, sy + floatY);

      if (p.hasRing) {
        ctx.save();
        ctx.scale(1, 0.3);
        ctx.strokeStyle = p.ringColor;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius * 1.8, p.radius * 1.8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const grad = ctx.createRadialGradient(-p.radius * 0.3, -p.radius * 0.3, 0, 0, 0, p.radius);
      grad.addColorStop(0, p.rimColor);
      grad.addColorStop(1, p.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = p.rimColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  drawMoon(ctx: CanvasRenderingContext2D, camX: number, camY: number, _t: number): void {
    const sx = MOON_X - camX;
    const sy = MOON_Y - camY;

    if (sx < -MOON_RADIUS * 3 || sx > CANVAS_W + MOON_RADIUS * 3) return;
    if (sy < -MOON_RADIUS * 3 || sy > CANVAS_H + MOON_RADIUS * 3) return;

    ctx.save();
    ctx.translate(sx, sy);

    const glow = ctx.createRadialGradient(0, 0, MOON_RADIUS * 0.8, 0, 0, MOON_RADIUS * 2.5);
    glow.addColorStop(0, 'rgba(255,250,220,0.15)');
    glow.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, MOON_RADIUS * 2.5, 0, Math.PI * 2);
    ctx.fill();

    const moonGrad = ctx.createRadialGradient(-MOON_RADIUS * 0.3, -MOON_RADIUS * 0.3, 0, 0, 0, MOON_RADIUS);
    moonGrad.addColorStop(0, '#f8f4e0');
    moonGrad.addColorStop(0.6, '#d8d0b0');
    moonGrad.addColorStop(1, '#b0a880');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(0, 0, MOON_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    const craters = [
      { x: -40, y: -30, r: 18 },
      { x: 30, y: 20, r: 24 },
      { x: -10, y: 40, r: 12 },
      { x: 50, y: -50, r: 14 },
      { x: -60, y: 30, r: 10 },
    ];
    for (const c of craters) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x - c.r * 0.2, c.y - c.r * 0.2, c.r, Math.PI * 0.8, Math.PI * 1.8);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,220,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-MOON_RADIUS * 0.1, -MOON_RADIUS * 0.1, MOON_RADIUS * 0.9, Math.PI * 1.1, Math.PI * 1.7);
    ctx.stroke();

    ctx.restore();
  }
}