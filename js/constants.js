export const CANVAS_WIDTH = 256;
export const CANVAS_HEIGHT = 240;

export const GAME_STATE = Object.freeze({
  TITLE: 'TITLE',
  INSTRUCTIONS: 'INSTRUCTIONS',
  ROUND_INTRO: 'ROUND_INTRO',
  SERVE: 'SERVE',
  PLAYING: 'PLAYING',
  BALL_LOST: 'BALL_LOST',
  ROUND_CLEAR: 'ROUND_CLEAR',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
  PAUSED: 'PAUSED',
});

// Fixed-timestep simulation rate.
export const FIXED_DT = 1 / 60;
// Guard against huge deltas after a tab is backgrounded then refocused.
export const MAX_FRAME_DELTA = 0.25;

// Playable area, inset from the canvas edges to leave room for the
// border/HUD chrome drawn later.
export const PLAYFIELD = {
  left: 8,
  right: CANVAS_WIDTH - 8,
  top: 32,
  bottom: CANVAS_HEIGHT - 16,
};

export const PADDLE = {
  width: 32,
  height: 6,
  speed: 200,
  y: PLAYFIELD.bottom - 20,
};

export const BALL = {
  radius: 3,
  speed: 130,
  launchAngle: 15, // degrees off vertical, on serve
  trailLength: 8,
};

export const STARTING_LIVES = 3;
export const BALL_LOST_PAUSE = 1.0; // seconds shown before the next serve
export const ROUND_INTRO_DURATION = 1.5;
export const ROUND_CLEAR_DURATION = 1.5;

// Max angle (degrees, from vertical) the paddle can redirect the ball.
export const MAX_BOUNCE_ANGLE = 60;

export const BRICK = {
  width: 16,
  height: 8,
  cols: 15,
  top: PLAYFIELD.top + 8,
};

// Type code -> visual/behavioral definition. 0 means "empty" in level data.
export const BRICK_TYPES = {
  1: { color: '#fc6060', hp: 1, indestructible: false, score: 50 }, // red
  2: { color: '#fca050', hp: 1, indestructible: false, score: 60 }, // orange
  3: { color: '#fcec50', hp: 1, indestructible: false, score: 70 }, // yellow
  4: { color: '#60d860', hp: 1, indestructible: false, score: 80 }, // green
  5: { color: '#60c4fc', hp: 1, indestructible: false, score: 90 }, // cyan
  6: { color: '#d070f0', hp: 1, indestructible: false, score: 100 }, // magenta
  7: { color: '#c8c8d0', hp: 2, indestructible: false, score: 150 }, // silver
  8: { color: '#e8c040', hp: Infinity, indestructible: true, score: 0 }, // gold
};

// Silver bricks (7) don't drop capsules, matching classic Arkanoid.
export const SILVER_BRICK_CODE = 7;

export const POWER_UP_TYPE = Object.freeze({
  EXPAND: 'EXPAND',
  SLOW: 'SLOW',
  CATCH: 'CATCH',
  MULTIBALL: 'MULTIBALL',
  EXTRA_LIFE: 'EXTRA_LIFE',
});

export const POWER_UP_COLORS = {
  EXPAND: '#60d860',
  SLOW: '#60c4fc',
  CATCH: '#d070f0',
  MULTIBALL: '#fcec50',
  EXTRA_LIFE: '#fc6060',
};

export const POWER_UP_LETTERS = {
  EXPAND: 'E',
  SLOW: 'S',
  CATCH: 'C',
  MULTIBALL: 'M',
  EXTRA_LIFE: 'P',
};

export const POWER_UP_DROP_CHANCE = 0.28;
export const POWER_UP_FALL_SPEED = 55;
export const POWER_UP_SIZE = { width: 12, height: 6 };

export const EXPAND_WIDTH_MULTIPLIER = 1.6;
export const EXPAND_DURATION = 12;
export const SLOW_SPEED_MULTIPLIER = 0.65;
export const SLOW_DURATION = 10;
