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
