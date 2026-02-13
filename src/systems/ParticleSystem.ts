import { Particle } from '../core/types';

export class ParticleSystem {
  private particles: Particle[] = [];

  spawn(
    x: number, y: number,
    vx: number, vy: number,
    color: string, size: number, life: number
  ): void {
    this.particles.push({ x, y, vx, vy, color, size, life, maxLife: life, alpha: 1 });
  }

  burst(x: number, y: number, count: number, colors: string[]): void {
    for (let i = 0; i < count; i++) {
      this.spawn(
        x, y,
        (Math.random() - 0.5) * 8,
        -Math.random() * 10 - 3,
        colors[Math.floor(Math.random() * colors.length)],
        Math.random() * 6 + 3,
        80
      );
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.04;
      p.vx *= 0.98;
      p.life--;
      p.alpha = p.life / p.maxLife;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY = 0): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.8;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  get count(): number { return this.particles.length; }
}