const GRAVITY = 90;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.25,
        color,
        size: 1 + Math.random() * 1.5,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(1 - p.life / p.maxLife, 0);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
