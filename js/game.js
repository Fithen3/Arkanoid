import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_STATE,
  FIXED_DT,
  MAX_FRAME_DELTA,
  PLAYFIELD,
  PADDLE,
  BALL,
  MAX_BOUNCE_ANGLE,
  BRICK,
} from './constants.js';
import { InputManager } from './input.js';
import { Paddle } from './entities/paddle.js';
import { Ball } from './entities/ball.js';
import { BrickField } from './entities/brick.js';
import { LEVELS } from './levels.js';
import { clamp } from './utils.js';

export class ArkanoidGame {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    this.input = new InputManager();
    this.paddle = new Paddle(
      (PLAYFIELD.left + PLAYFIELD.right) / 2 - PADDLE.width / 2,
      PADDLE.y,
      PADDLE.width,
      PADDLE.height,
      PADDLE.speed
    );

    this.balls = [];
    this.score = 0;
    this.level = 0;
    this.brickField = this.buildBrickField(this.level);

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

    if (state === GAME_STATE.SERVE) {
      this.spawnServeBall();
    }
  }

  spawnServeBall() {
    const ball = new Ball(0, 0, BALL.radius, BALL.speed);
    ball.attached = true;
    this.balls = [ball];
    this.snapBallToPaddle(ball);
  }

  snapBallToPaddle(ball) {
    ball.x = this.paddle.centerX;
    ball.y = this.paddle.y - ball.radius;
  }

  buildBrickField(levelIndex) {
    return new BrickField(LEVELS[levelIndex], PLAYFIELD.left, BRICK.top, BRICK.width, BRICK.height);
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
      case GAME_STATE.SERVE:
        this.updateServe(dt);
        break;
      case GAME_STATE.PLAYING:
        this.updatePlaying(dt);
        break;
      default:
        break;
    }
  }

  updateTitle(_dt) {
    if (this.input.consumePress('Space')) {
      this.setState(GAME_STATE.SERVE);
    }
  }

  updateServe(dt) {
    this.paddle.update(dt, this.input, PLAYFIELD.left, PLAYFIELD.right);
    const ball = this.balls[0];
    this.snapBallToPaddle(ball);

    if (this.input.consumePress('Space')) {
      ball.launch(BALL.launchAngle * (Math.random() < 0.5 ? -1 : 1));
      this.setState(GAME_STATE.PLAYING);
    }
  }

  updatePlaying(dt) {
    this.paddle.update(dt, this.input, PLAYFIELD.left, PLAYFIELD.right);

    for (const ball of this.balls) {
      ball.update(dt);
      this.resolveBallWallCollision(ball);
      this.resolveBallPaddleCollision(ball);
      this.resolveBallBrickCollision(ball);
    }

    this.balls = this.balls.filter((ball) => ball.y - ball.radius <= PLAYFIELD.bottom);

    if (this.balls.length === 0) {
      this.setState(GAME_STATE.SERVE);
    }
  }

  resolveBallWallCollision(ball) {
    if (ball.x - ball.radius <= PLAYFIELD.left) {
      ball.x = PLAYFIELD.left + ball.radius;
      ball.vx = Math.abs(ball.vx);
    } else if (ball.x + ball.radius >= PLAYFIELD.right) {
      ball.x = PLAYFIELD.right - ball.radius;
      ball.vx = -Math.abs(ball.vx);
    }

    if (ball.y - ball.radius <= PLAYFIELD.top) {
      ball.y = PLAYFIELD.top + ball.radius;
      ball.vy = Math.abs(ball.vy);
    }
  }

  resolveBallPaddleCollision(ball) {
    if (ball.vy <= 0) return;

    const rect = this.paddle.getRect();
    const touchesX = ball.x + ball.radius >= rect.x && ball.x - ball.radius <= rect.x + rect.width;
    const touchesY = ball.y + ball.radius >= rect.y && ball.y - ball.radius <= rect.y + rect.height;
    if (!touchesX || !touchesY) return;

    const offset = clamp((ball.x - this.paddle.centerX) / (rect.width / 2), -1, 1);
    let angle = offset * MAX_BOUNCE_ANGLE;
    if (Math.abs(Math.cos((angle * Math.PI) / 180)) < 0.2) {
      angle = Math.sign(angle || 1) * 78;
    }

    const angleRad = (angle * Math.PI) / 180;
    ball.vx = ball.speed * Math.sin(angleRad);
    ball.vy = -ball.speed * Math.cos(angleRad);
    ball.y = rect.y - ball.radius;
  }

  resolveBallBrickCollision(ball) {
    for (const brick of this.brickField.getAliveBricks()) {
      const rect = brick.getRect();
      const closestX = clamp(ball.x, rect.x, rect.x + rect.width);
      const closestY = clamp(ball.y, rect.y, rect.y + rect.height);
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      if (dx * dx + dy * dy > ball.radius * ball.radius) continue;

      if (closestX === ball.x) {
        // Hit the top or bottom face.
        ball.vy = -ball.vy;
        ball.y = ball.y < rect.y + rect.height / 2 ? rect.y - ball.radius : rect.y + rect.height + ball.radius;
      } else if (closestY === ball.y) {
        // Hit the left or right face.
        ball.vx = -ball.vx;
        ball.x = ball.x < rect.x + rect.width / 2 ? rect.x - ball.radius : rect.x + rect.width + ball.radius;
      } else {
        // Corner hit.
        ball.vx = -ball.vx;
        ball.vy = -ball.vy;
      }

      const result = brick.hit();
      if (result.destroyed) {
        this.score += result.scoreValue;
        this.brickField.registerDestroyed();
      }
      break; // resolve at most one brick per ball per frame
    }
  }

  render() {
    const { ctx } = this;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    switch (this.state) {
      case GAME_STATE.TITLE:
        this.renderTitle();
        break;
      case GAME_STATE.SERVE:
      case GAME_STATE.PLAYING:
        this.renderPlayfield();
        this.renderBricks();
        this.renderPaddle();
        this.renderBalls();
        break;
      default:
        break;
    }
  }

  renderBricks() {
    const { ctx } = this;
    for (const brick of this.brickField.getAliveBricks()) {
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.width - 1, brick.height - 1);
    }
  }

  renderBalls() {
    const { ctx } = this;
    ctx.fillStyle = '#e0e0e0';
    for (const ball of this.balls) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderPlayfield() {
    const { ctx } = this;
    ctx.strokeStyle = '#3050c0';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      PLAYFIELD.left,
      PLAYFIELD.top,
      PLAYFIELD.right - PLAYFIELD.left,
      PLAYFIELD.bottom - PLAYFIELD.top
    );
  }

  renderPaddle() {
    const { ctx } = this;
    const rect = this.paddle.getRect();
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
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
