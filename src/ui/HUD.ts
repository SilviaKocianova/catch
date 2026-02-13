import { Player } from '../entities/Player';
import { Heart } from '../entities/Heart';
import { WORLD_W } from '../core/constants';

export class HUD {
  private hudEl:    HTMLElement;
  private mapEl:    HTMLElement;
  private playerEl: HTMLElement;
  private heartEl:  HTMLElement;

  constructor() {
    this.hudEl    = document.getElementById('hud')!;
    this.mapEl    = document.getElementById('minimap')!;
    this.playerEl = document.getElementById('minimap-player')!;
    this.heartEl  = document.getElementById('minimap-heart')!;
  }

  show():  void { this.mapEl.style.opacity = '1'; this.hudEl.style.opacity = '1'; }
  hide():  void { this.mapEl.style.opacity = '0'; this.hudEl.style.opacity = '0'; }

  update(player: Player, heart: Heart): void {
    const playerPct = (player.x / WORLD_W) * 100;
    const heartPct  = (heart.x  / WORLD_W) * 100;

    this.playerEl.style.left = `${playerPct}%`;
    this.heartEl.style.left  = `${heartPct}%`;

    this.hudEl.textContent = this.getFlavorText(player, heart);
  }

  private getFlavorText(player: Player, heart: Heart): string {
    if (heart.phase === 'orbiting' && player.isAstronaut) return 'fly to the Moon and catch it ♡';
    if (heart.phase === 'orbiting')  return 'it\'s orbiting the Moon... fly up! ♡';
    if (heart.phase === 'floating')  return 'it\'s flying to space! follow it ♡';
    if (player.isAstronaut)         return 'W to fly up · A/D to steer ♡';
    if (heart.isNearFloatTrigger())  return 'ALMOST THERE!!! ♡';

    const dist = Math.hypot(player.x - heart.x, player.y - heart.y);
    if (dist < 150) return 'ALMOST THERE!!! ♡';
    if (dist < 300) return 'keep going... ♡';
    return 'CHASE!!!!!!! ♡';
  }
}