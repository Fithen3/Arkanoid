import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class ArkanoidGame {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');
  }

  start() {
    this.render();
  }

  render() {
    const { ctx } = this;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}
