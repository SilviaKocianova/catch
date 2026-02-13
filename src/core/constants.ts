export const CANVAS_W = 800;
export const CANVAS_H = 450;
export const WORLD_W = 6000;

export const GRAVITY = 0.45;
export const GROUND_Y = CANVAS_H - 80;

export const PLAYER_SPEED = 4.0;
export const PLAYER_JUMP_FORCE = -11;

export const HEART_MAX_SPEED = 5.2;
export const HEART_ACCEL = 0.18;
export const HEART_FLEE_RADIUS = 300;
export const HEART_JUMP_RADIUS = 150;
export const HEART_JUMP_COOLDOWN = 60;
export const HEART_NEAR_END_ZONE = 300;


export const WIN_CATCH_RADIUS_X = 35;
export const WIN_CATCH_RADIUS_Y = 40;

export const DOG_SPEED         = 3.2;
export const DOG_START_OFFSET  = -300;
export const DOG_BITE_RADIUS_X = 28;
export const DOG_BITE_RADIUS_Y = 28;
export const DOG_SLOW_ZONE     = 800;


export const SPACE_GRAVITY       = 0.04;
export const SPACE_FLOAT_SPEED   = 2.5;
export const SPACE_RISE_SPEED    = -2.5;
export const HEART_FLOAT_TRIGGER = 500;

export const MOON_X              = WORLD_W - 300;
export const MOON_Y              = -900;
export const MOON_RADIUS         = 120;
export const HEART_ORBIT_RADIUS  = 180;
export const SPACE_WIN_RADIUS    = 70;

export const CAMERA_LEAD = 0.38;
export const CAMERA_LERP = 0.1;

export const BG_ELEMENT_COUNT = 300;
export const PLATFORM_COUNT = 25;

export const COLORS = {
  heartRed:       '#ff3060',
  heartPink:      '#ffb3c1',
  heartGlow:      'rgba(255,80,110,0.4)',
  playerBody:     '#c8607c',
  playerHead:     '#e8a0a8',
  playerLimb:     '#a04060',
  groundTop:      '#3d1a28',
  groundBottom:   '#1a0810',
  groundLine:     'rgba(255,100,130,0.35)',
  bgStar:         '#ffb3c6',
  bgPetal:        '#ff8fa3',
  bgDark:         '#110408',
  bgMid:          '#1e0810',
  bgLight:        '#2a1020',
  platformTop:    'rgba(200,80,110,0.4)',
  platformBottom: 'rgba(100,30,50,0.2)',
  platformStroke: 'rgba(255,100,130,0.4)',
  particleStep:   'rgba(255,150,170,0.5)',
} as const;