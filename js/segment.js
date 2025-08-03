import { ctx } from "./canvas.js";

export let segmentCount = 0;

export class Segment {
  constructor(parent, size, angle, range, stiffness) {
    segmentCount++;
    this.isSegment = true;
    this.parent = parent;
    if (Array.isArray(parent.children)) parent.children.push(this);
    this.children = [];
    this.size = size;
    this.relAngle = angle;
    this.defAngle = angle;
    this.absAngle = parent.absAngle + angle;
    this.range = range;
    this.stiffness = stiffness;
    this.updateRelative(false, true);
  }
  updateRelative(iter, flex) {
    this.relAngle -= 2 * Math.PI * Math.floor((this.relAngle - this.defAngle) / (2 * Math.PI) + 0.5);
    if (flex) {
      this.relAngle = Math.min(
        this.defAngle + this.range / 2,
        Math.max(
          this.defAngle - this.range / 2,
          (this.relAngle - this.defAngle) / this.stiffness + this.defAngle
        )
      );
    }
    this.absAngle = this.parent.absAngle + this.relAngle;
    this.x = this.parent.x + Math.cos(this.absAngle) * this.size;
    this.y = this.parent.y + Math.sin(this.absAngle) * this.size;
    if (iter) this.children.forEach(child => child.updateRelative(iter, flex));
  }
  draw(iter) {
    ctx.beginPath();
    ctx.moveTo(this.parent.x, this.parent.y);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    if (iter) this.children.forEach(child => child.draw(true));
  }
  follow(iter) {
    const x = this.parent.x;
    const y = this.parent.y;
    const dist = Math.hypot(this.x - x, this.y - y);
    this.x = x + this.size * (this.x - x) / dist;
    this.y = y + this.size * (this.y - y) / dist;
    this.absAngle = Math.atan2(this.y - y, this.x - x);
    this.relAngle = this.absAngle - this.parent.absAngle;
    this.updateRelative(false, true);
    if (iter) this.children.forEach(child => child.follow(true));
  }
}