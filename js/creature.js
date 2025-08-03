import { ctx } from "./canvas.js";

export class Creature {
  constructor(x, y, angle, fAccel, fFric, fRes, fThresh, rAccel, rFric, rRes, rThresh) {
    this.x = x;
    this.y = y;
    this.absAngle = angle;
    this.fSpeed = 0;
    this.fAccel = fAccel;
    this.fFric = fFric;
    this.fRes = fRes;
    this.fThresh = fThresh;
    this.rSpeed = 0;
    this.rAccel = rAccel;
    this.rFric = rFric;
    this.rRes = rRes;
    this.rThresh = rThresh;
    this.children = [];
    this.systems = [];
  }
  follow(x, y) {
    const dist = Math.hypot(this.x - x, this.y - y);
    const angle = Math.atan2(y - this.y, x - this.x);
    let accel = this.fAccel;
    if (this.systems.length > 0) {
      let sum = this.systems.reduce((acc, sys) => acc + (sys.step === 0), 0);
      accel *= sum / this.systems.length;
    }
    this.fSpeed += accel * (dist > this.fThresh);
    this.fSpeed *= 1 - this.fRes;
    this.speed = Math.max(0, this.fSpeed - this.fFric);

    let dif = this.absAngle - angle;
    dif -= 2 * Math.PI * Math.floor(dif / (2 * Math.PI) + 0.5);
    if (Math.abs(dif) > this.rThresh && dist > this.fThresh) {
      this.rSpeed -= this.rAccel * (2 * (dif > 0) - 1);
    }
    this.rSpeed *= 1 - this.rRes;
    if (Math.abs(this.rSpeed) > this.rFric) {
      this.rSpeed -= this.rFric * (2 * (this.rSpeed > 0) - 1);
    } else {
      this.rSpeed = 0;
    }

    this.absAngle += this.rSpeed;
    this.absAngle -= 2 * Math.PI * Math.floor(this.absAngle / (2 * Math.PI) + 0.5);
    this.x += this.speed * Math.cos(this.absAngle);
    this.y += this.speed * Math.sin(this.absAngle);
    this.absAngle += Math.PI;
    this.children.forEach(child => child.follow(true, true));
    this.systems.forEach(sys => sys.update(x, y));
    this.absAngle -= Math.PI;
    this.draw(true);
  }
  draw(iter) {
    const r = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, Math.PI / 4 + this.absAngle, 7 * Math.PI / 4 + this.absAngle);
    ctx.moveTo(
      this.x + r * Math.cos(7 * Math.PI / 4 + this.absAngle),
      this.y + r * Math.sin(7 * Math.PI / 4 + this.absAngle)
    );
    ctx.lineTo(
      this.x + r * Math.cos(this.absAngle) * Math.SQRT2,
      this.y + r * Math.sin(this.absAngle) * Math.SQRT2
    );
    ctx.lineTo(
      this.x + r * Math.cos(Math.PI / 4 + this.absAngle),
      this.y + r * Math.sin(Math.PI / 4 + this.absAngle)
    );
    ctx.stroke();
    if (iter) this.children.forEach(child => child.draw(true));
  }
}