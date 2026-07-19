export class Ball {
  constructor(x, y, radius, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.vx = 0;
    this.vy = 0;
    // Glued to the paddle until launch() is called.
    this.attached = true;
  }

  launch(angleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    this.vx = this.speed * Math.sin(angleRad);
    this.vy = -this.speed * Math.cos(angleRad);
    this.attached = false;
  }

  update(dt) {
    if (this.attached) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  clone() {
    const copy = new Ball(this.x, this.y, this.radius, this.speed);
    copy.vx = this.vx;
    copy.vy = this.vy;
    copy.attached = false;
    return copy;
  }
}
