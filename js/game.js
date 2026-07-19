import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATE, FIXED_DT, MAX_FRAME_DELTA } from './constants.js';

export class ArkanoidGame {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    this.state = GAME_STATE.TITLE;
    this.stateTime = 0;

    this._accumulator = 0;
    this._lastTs = null;
    this._rafId = null;

    this.loop = this.loop.bind(this);
  }

  setState(state) {
    this.state = state;
    this.stateTime = 0;
  }

  start() {
    this._rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  loop(ts) {
    if (this._lastTs === null) this._lastTs = ts;
    let delta = (ts - this._lastTs) / 1000;
    this._lastTs = ts;
    if (delta > MAX_FRAME_DELTA) delta = MAX_FRAME_DELTA;

    this._accumulator += delta;
    while (this._accumulator >= FIXED_DT) {
      this.update(FIXED_DT);
      this._accumulator -= FIXED_DT;
    }

    this.render();
    this._rafId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.stateTime += dt;

    switch (this.state) {
      case GAME_STATE.TITLE:
        this.updateTitle(dt);
        break;
      default:
        break;
    }
  }

  updateTitle(_dt) {
    // Placeholder: title screen is static for now, no input handling yet.
  }

  render() {
    const { ctx } = this;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    switch (this.state) {
      case GAME_STATE.TITLE:
        this.renderTitle();
        break;
      default:
        break;
    }
  }

  renderTitle() {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText('ARKANOID', CANVAS_WIDTH / 2, 100);

    const blinkOn = Math.floor(this.stateTime / 0.5) % 2 === 0;
    if (blinkOn) {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('PUSH SPACE KEY', CANVAS_WIDTH / 2, 160);
    }
  }
}
