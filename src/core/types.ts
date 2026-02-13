export enum GameState {
  START     = 'START',
  PLAYING   = 'PLAYING',
  WIN       = 'WIN',
  GAME_OVER = 'GAME_OVER',
}
export interface Vec2 {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Platform extends Rect {}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}
export interface BgElement {
  type: 'star' | 'petal';
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}
export type HeartPhase = 'flee' | 'waiting' | 'floating' | 'orbiting' | 'caught';
export type SpaceProgress = number;