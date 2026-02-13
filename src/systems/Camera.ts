import { CANVAS_W, CANVAS_H, WORLD_W, CAMERA_LEAD, CAMERA_LERP } from '../core/constants';

export class Camera {
  x = 0;
  y = 0;
  private astronautMode = false;

  follow(targetX: number, targetY?: number): void {
    this.astronautMode = targetY !== undefined;

    const desiredX = targetX - CANVAS_W * CAMERA_LEAD;
    this.x += (desiredX - this.x) * CAMERA_LERP;
    if (!this.astronautMode) {
      this.x = Math.max(0, Math.min(WORLD_W - CANVAS_W, this.x));
    }

    if (targetY !== undefined && targetY < 0) {
      const desiredY = targetY - CANVAS_H * 0.45;
      this.y += (desiredY - this.y) * CAMERA_LERP;
      this.y = Math.min(0, this.y);
    } else {
      this.y += (0 - this.y) * CAMERA_LERP;
      if (Math.abs(this.y) < 0.5) this.y = 0;
    }
  }
}