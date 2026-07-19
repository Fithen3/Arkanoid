export class Paddle {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.baseWidth = width;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  update(dt, input, minX, maxX) {
    let dir = 0;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) dir -= 1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) dir += 1;

    this.x += dir * this.speed * dt;
    if (this.x < minX) this.x = minX;
    if (this.x + this.width > maxX) this.x = maxX - this.width;
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}
