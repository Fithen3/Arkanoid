import { BRICK_TYPES } from '../constants.js';

export class Brick {
  constructor(x, y, width, height, typeCode) {
    const def = BRICK_TYPES[typeCode];
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.typeCode = typeCode;
    this.color = def.color;
    this.hp = def.hp;
    this.indestructible = def.indestructible;
    this.scoreValue = def.score;
    this.alive = true;
  }

  hit() {
    if (this.indestructible) {
      return { destroyed: false, scoreValue: 0 };
    }
    this.hp -= 1;
    if (this.hp <= 0) {
      this.alive = false;
      return { destroyed: true, scoreValue: this.scoreValue };
    }
    return { destroyed: false, scoreValue: 0 };
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

export class BrickField {
  constructor(levelDef, originX, originY, brickWidth, brickHeight) {
    this.bricks = [];
    this.remainingBreakable = 0;

    levelDef.rows.forEach((row, rowIndex) => {
      row.forEach((code, colIndex) => {
        if (!code) return;
        const x = originX + colIndex * brickWidth;
        const y = originY + rowIndex * brickHeight;
        const brick = new Brick(x, y, brickWidth, brickHeight, code);
        this.bricks.push(brick);
        if (!brick.indestructible) this.remainingBreakable += 1;
      });
    });
  }

  getAliveBricks() {
    return this.bricks.filter((brick) => brick.alive);
  }

  registerDestroyed() {
    this.remainingBreakable -= 1;
  }

  allCleared() {
    return this.remainingBreakable <= 0;
  }
}
