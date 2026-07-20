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
  STARTING_LIVES,
  BALL_LOST_PAUSE,
  ROUND_INTRO_DURATION,
  ROUND_CLEAR_DURATION,
  SILVER_BRICK_CODE,
  POWER_UP_TYPE,
  POWER_UP_COLORS,
  POWER_UP_LETTERS,
  POWER_UP_DROP_CHANCE,
  POWER_UP_FALL_SPEED,
  POWER_UP_SIZE,
  EXPAND_WIDTH_MULTIPLIER,
  EXPAND_DURATION,
  SLOW_SPEED_MULTIPLIER,
  SLOW_DURATION,
} from './constants.js';
import { InputManager } from './input.js';
import { Paddle } from './entities/paddle.js';
import { Ball } from './entities/ball.js';
import { BrickField } from './entities/brick.js';
import { PowerUp } from './entities/powerup.js';
import { LEVELS } from './levels.js';
import { clamp, choice } from './utils.js';
import { renderHud, renderCenterMessage } from './hud.js';
import { ParticleSystem } from './particles.js';

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
    this.lives = STARTING_LIVES;
    this.brickField = this.buildBrickField(this.level);
    this.powerUp = null;
    this.effectTimers = { expand: 0, slow: 0 };
    this.ballSpeedMultiplier = 1;
    this.particles = new ParticleSystem();

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
    this.particles.update(dt);

    switch (this.state) {
      case GAME_STATE.TITLE:
        this.updateTitle(dt);
        break;
      case GAME_STATE.INSTRUCTIONS:
        this.updateInstructions(dt);
        break;
      case GAME_STATE.SERVE:
        this.updateServe(dt);
        break;
      case GAME_STATE.PLAYING:
        this.updatePlaying(dt);
        break;
      case GAME_STATE.BALL_LOST:
        this.updateBallLost(dt);
        break;
      case GAME_STATE.ROUND_INTRO:
        this.updateRoundIntro(dt);
        break;
      case GAME_STATE.ROUND_CLEAR:
        this.updateRoundClear(dt);
        break;
      case GAME_STATE.GAME_OVER:
        this.updateGameOver(dt);
        break;
      case GAME_STATE.VICTORY:
        this.updateVictory(dt);
        break;
      default:
        break;
    }
  }

  updateTitle(_dt) {
    if (this.input.consumePress('Space')) {
      this.setState(GAME_STATE.INSTRUCTIONS);
    }
  }

  updateInstructions(_dt) {
    if (this.input.consumePress('Space')) {
      this.resetGame();
      this.startRound(0);
    } else if (this.input.consumePress('Escape')) {
      this.setState(GAME_STATE.TITLE);
    }
  }

  updateRoundIntro(_dt) {
    if (this.stateTime >= ROUND_INTRO_DURATION) {
      this.setState(GAME_STATE.SERVE);
    }
  }

  updateRoundClear(_dt) {
    if (this.stateTime >= ROUND_CLEAR_DURATION) {
      this.startRound(this.level + 1);
    }
  }

  updateVictory(_dt) {
    if (this.stateTime > 1.0 && this.input.consumePress('Space')) {
      this.resetGame();
      this.setState(GAME_STATE.TITLE);
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
    this.tickEffectTimers(dt);

    const hasAttachedBalls = this.balls.some((ball) => ball.attached);
    if (hasAttachedBalls && this.input.consumePress('Space')) {
      this.launchAttachedBalls();
    }

    for (const ball of this.balls) {
      if (ball.attached) {
        this.followPaddleSticky(ball);
        continue;
      }
      this.stepBall(ball, dt);
    }

    this.updatePowerUp(dt);

    if (this.brickField.allCleared()) {
      this.handleRoundClear();
      return;
    }

    this.balls = this.balls.filter((ball) => ball.attached || ball.y - ball.radius <= PLAYFIELD.bottom);

    if (this.balls.length === 0) {
      this.handleBallLost();
    }
  }

  followPaddleSticky(ball) {
    ball.x = clamp(
      this.paddle.centerX + ball.stickyOffsetX,
      PLAYFIELD.left + ball.radius,
      PLAYFIELD.right - ball.radius
    );
    ball.y = this.paddle.y - ball.radius;
  }

  launchAttachedBalls() {
    for (const ball of this.balls) {
      if (!ball.attached) continue;
      const offset = clamp(ball.stickyOffsetX / (this.paddle.width / 2), -1, 1);
      ball.launch(offset * MAX_BOUNCE_ANGLE);
    }
  }

  tickEffectTimers(dt) {
    if (this.effectTimers.expand > 0) {
      this.effectTimers.expand -= dt;
      if (this.effectTimers.expand <= 0) {
        this.effectTimers.expand = 0;
        this.paddle.width = this.paddle.baseWidth;
        this.paddle.x = clamp(this.paddle.x, PLAYFIELD.left, PLAYFIELD.right - this.paddle.width);
      }
    }

    if (this.effectTimers.slow > 0) {
      this.effectTimers.slow -= dt;
      if (this.effectTimers.slow <= 0) {
        this.effectTimers.slow = 0;
        this.ballSpeedMultiplier = 1;
        this.balls.forEach((ball) => {
          if (!ball.attached) this.rescaleBallSpeed(ball, BALL.speed);
        });
      }
    }
  }

  rescaleBallSpeed(ball, newSpeed) {
    const currentSpeed = Math.hypot(ball.vx, ball.vy) || newSpeed;
    const scale = newSpeed / currentSpeed;
    ball.vx *= scale;
    ball.vy *= scale;
    ball.speed = newSpeed;
  }

  updatePowerUp(dt) {
    if (!this.powerUp) return;
    this.powerUp.update(dt);

    if (this.powerUp.isCaughtBy(this.paddle.getRect())) {
      this.applyPowerUp(this.powerUp.type);
      this.powerUp = null;
      return;
    }
    if (this.powerUp.y > PLAYFIELD.bottom) {
      this.powerUp = null;
    }
  }

  maybeSpawnPowerUp(brick) {
    if (this.powerUp) return;
    if (brick.typeCode === SILVER_BRICK_CODE) return;
    if (Math.random() > POWER_UP_DROP_CHANCE) return;

    const type = choice(Object.values(POWER_UP_TYPE));
    this.powerUp = new PowerUp(
      brick.x + brick.width / 2 - POWER_UP_SIZE.width / 2,
      brick.y + brick.height / 2 - POWER_UP_SIZE.height / 2,
      type,
      POWER_UP_SIZE.width,
      POWER_UP_SIZE.height,
      POWER_UP_FALL_SPEED
    );
  }

  applyPowerUp(type) {
    switch (type) {
      case POWER_UP_TYPE.EXPAND:
        this.paddle.width = this.paddle.baseWidth * EXPAND_WIDTH_MULTIPLIER;
        this.paddle.x = clamp(this.paddle.x, PLAYFIELD.left, PLAYFIELD.right - this.paddle.width);
        this.effectTimers.expand = EXPAND_DURATION;
        break;
      case POWER_UP_TYPE.SLOW:
        this.ballSpeedMultiplier = SLOW_SPEED_MULTIPLIER;
        this.balls.forEach((ball) => {
          if (!ball.attached) this.rescaleBallSpeed(ball, BALL.speed * this.ballSpeedMultiplier);
        });
        this.effectTimers.slow = SLOW_DURATION;
        break;
      case POWER_UP_TYPE.CATCH:
        this.paddle.sticky = true;
        break;
      case POWER_UP_TYPE.MULTIBALL:
        this.applyMultiball();
        break;
      case POWER_UP_TYPE.EXTRA_LIFE:
        this.lives += 1;
        break;
      default:
        break;
    }
  }

  applyMultiball() {
    const newBalls = [];
    for (const ball of this.balls) {
      newBalls.push(ball);
      if (ball.attached) continue;
      newBalls.push(this.spawnBallClone(ball, 18));
      newBalls.push(this.spawnBallClone(ball, -18));
    }
    this.balls = newBalls;
  }

  spawnBallClone(ball, angleOffsetDeg) {
    const clone = ball.clone();
    const baseAngle = Math.atan2(ball.vx, -ball.vy);
    const angle = baseAngle + (angleOffsetDeg * Math.PI) / 180;
    clone.vx = clone.speed * Math.sin(angle);
    clone.vy = -clone.speed * Math.cos(angle);
    return clone;
  }

  handleRoundClear() {
    this.balls = [];
    if (this.level + 1 >= LEVELS.length) {
      this.setState(GAME_STATE.VICTORY);
    } else {
      this.setState(GAME_STATE.ROUND_CLEAR);
    }
  }

  handleBallLost() {
    this.powerUp = null;
    this.lives -= 1;
    if (this.lives <= 0) {
      this.setState(GAME_STATE.GAME_OVER);
    } else {
      this.setState(GAME_STATE.BALL_LOST);
    }
  }

  updateBallLost(_dt) {
    if (this.stateTime >= BALL_LOST_PAUSE) {
      this.setState(GAME_STATE.SERVE);
    }
  }

  updateGameOver(_dt) {
    if (this.stateTime > 1.0 && this.input.consumePress('Space')) {
      this.resetGame();
      this.setState(GAME_STATE.TITLE);
    }
  }

  resetGame() {
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.balls = [];
  }

  startRound(levelIndex) {
    this.level = levelIndex;
    this.brickField = this.buildBrickField(this.level);
    this.paddle.width = this.paddle.baseWidth;
    this.paddle.x = (PLAYFIELD.left + PLAYFIELD.right) / 2 - this.paddle.width / 2;
    this.paddle.sticky = false;
    this.powerUp = null;
    this.effectTimers = { expand: 0, slow: 0 };
    this.ballSpeedMultiplier = 1;
    this.setState(GAME_STATE.ROUND_INTRO);
  }

  // Advance a ball in several small sub-steps so a fast ball can't tunnel
  // through a brick or the paddle between two frames.
  stepBall(ball, dt) {
    const speed = Math.hypot(ball.vx, ball.vy) || ball.speed;
    const maxStep = Math.min(BRICK.width, BRICK.height, ball.radius) * 0.5;
    const steps = Math.max(1, Math.ceil((speed * dt) / maxStep));
    const subDt = dt / steps;

    for (let i = 0; i < steps; i += 1) {
      const prevX = ball.x;
      const prevY = ball.y;
      ball.update(subDt);
      this.resolveBallWallCollision(ball);
      this.resolveBallPaddleCollision(ball);
      this.resolveBallBrickCollision(ball, prevX, prevY);
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

    if (this.paddle.sticky) {
      ball.attached = true;
      ball.stickyOffsetX = clamp(ball.x - this.paddle.centerX, -rect.width / 2, rect.width / 2);
      ball.vx = 0;
      ball.vy = 0;
      ball.y = rect.y - ball.radius;
      return;
    }

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

  resolveBallBrickCollision(ball, prevX, prevY) {
    for (const brick of this.brickField.getAliveBricks()) {
      const rect = brick.getRect();
      const closestX = clamp(ball.x, rect.x, rect.x + rect.width);
      const closestY = clamp(ball.y, rect.y, rect.y + rect.height);
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      if (dx * dx + dy * dy > ball.radius * ball.radius) continue;

      // Decide which face was hit from where the ball came from, not from
      // penetration depth - depth comparison is fragile right at corners
      // and where two bricks sit side by side.
      const cameFromAbove = prevY + ball.radius <= rect.y;
      const cameFromBelow = prevY - ball.radius >= rect.y + rect.height;
      const cameFromLeft = prevX + ball.radius <= rect.x;
      const cameFromRight = prevX - ball.radius >= rect.x + rect.width;

      if (cameFromAbove || cameFromBelow) {
        ball.vy = -ball.vy;
        ball.y = cameFromAbove ? rect.y - ball.radius : rect.y + rect.height + ball.radius;
      } else if (cameFromLeft || cameFromRight) {
        ball.vx = -ball.vx;
        ball.x = cameFromLeft ? rect.x - ball.radius : rect.x + rect.width + ball.radius;
      } else {
        // Was already overlapping both axes at the start of this sub-step
        // (corner case) - reflect both as a reasonable fallback.
        ball.vx = -ball.vx;
        ball.vy = -ball.vy;
      }

      const result = brick.hit();
      const burstX = brick.x + brick.width / 2;
      const burstY = brick.y + brick.height / 2;
      if (result.destroyed) {
        this.score += result.scoreValue;
        this.brickField.registerDestroyed();
        this.maybeSpawnPowerUp(brick);
        this.particles.spawnBurst(burstX, burstY, brick.color, 14);
      } else {
        this.particles.spawnBurst(burstX, burstY, brick.color, 5);
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
      case GAME_STATE.INSTRUCTIONS:
        this.renderInstructions();
        break;
      case GAME_STATE.SERVE:
      case GAME_STATE.PLAYING:
      case GAME_STATE.BALL_LOST:
      case GAME_STATE.ROUND_INTRO:
      case GAME_STATE.ROUND_CLEAR:
        this.renderPlayfield();
        this.renderBricks();
        this.renderPaddle();
        this.renderBalls();
        this.renderPowerUp();
        this.particles.render(ctx);
        renderHud(ctx, {
          score: this.score,
          level: this.level,
          lives: this.lives,
          canvasWidth: CANVAS_WIDTH,
          canvasHeight: CANVAS_HEIGHT,
        });
        if (this.state === GAME_STATE.ROUND_INTRO) {
          renderCenterMessage(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, [`ROUND ${this.level + 1}`]);
        } else if (this.state === GAME_STATE.ROUND_CLEAR) {
          renderCenterMessage(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, ['ROUND CLEAR']);
        }
        break;
      case GAME_STATE.GAME_OVER:
        renderCenterMessage(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, [
          'GAME OVER',
          `SCORE ${this.score}`,
          'PUSH SPACE KEY',
        ]);
        break;
      case GAME_STATE.VICTORY:
        renderCenterMessage(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, [
          'CONGRATULATIONS',
          `SCORE ${this.score}`,
          'PUSH SPACE KEY',
        ]);
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

  renderPowerUp() {
    if (!this.powerUp) return;
    const { ctx } = this;
    const rect = this.powerUp.getRect();
    ctx.fillStyle = POWER_UP_COLORS[this.powerUp.type];
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = '#000000';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(POWER_UP_LETTERS[this.powerUp.type], rect.x + rect.width / 2, rect.y + rect.height - 1);
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
    ctx.fillStyle = this.paddle.sticky ? '#d070f0' : '#e0e0e0';
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

  renderInstructions() {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('HOW TO PLAY', CANVAS_WIDTH / 2, 26);

    ctx.font = '7px "Press Start 2P", monospace';
    const lines = [
      'ARROWS OR A/D - MOVE PADDLE',
      'SPACE - LAUNCH BALL',
      '',
      'BREAK EVERY BRICK TO',
      'CLEAR THE ROUND',
      '',
      'SILVER BRICKS TAKE 2 HITS',
      'GOLD BRICKS NEVER BREAK',
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, 52 + i * 13);
    });

    const blinkOn = Math.floor(this.stateTime / 0.5) % 2 === 0;
    if (blinkOn) {
      ctx.fillText('PUSH SPACE KEY', CANVAS_WIDTH / 2, 224);
    }
  }
}
