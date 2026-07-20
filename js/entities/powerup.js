export class PowerUp {
  constructor(x, y, type, width, height, fallSpeed) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = width;
    this.height = height;
    this.vy = fallSpeed;
  }

  update(dt) {
    this.y += this.vy * dt;
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  isCaughtBy(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }
}
