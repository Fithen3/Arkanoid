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
