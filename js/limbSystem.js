import { Input } from "./input.js";

export class LimbSystem {
  constructor(end, length, speed, creature) {
    this.end = end;
    this.length = Math.max(1, length);
    this.creature = creature;
    this.speed = speed;
    creature.systems.push(this);
    this.nodes = [];
    let node = end;
    for (let i = 0; i < length; i++) {
      this.nodes.unshift(node);
      node = node.parent;
      if (!node.isSegment) {
        this.length = i + 1;
        break;
      }
    }
    this.hip = this.nodes[0].parent;
  }
  moveTo(x, y) {
    this.nodes[0].updateRelative(true, true);
    let dist = Math.hypot(x - this.end.x, y - this.end.y);
    let len = Math.max(0, dist - this.speed);
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      let node = this.nodes[i];
      let ang = Math.atan2(node.y - y, node.x - x);
      node.x = x + len * Math.cos(ang);
      node.y = y + len * Math.sin(ang);
      x = node.x;
      y = node.y;
      len = node.size;
    }
    for (let node of this.nodes) {
      node.absAngle = Math.atan2(node.y - node.parent.y, node.x - node.parent.x);
      node.relAngle = node.absAngle - node.parent.absAngle;
      node.children.forEach(childNode => {
        if (!this.nodes.includes(childNode)) childNode.updateRelative(true, false);
      });
    }
  }
  update() {
    this.moveTo(Input.mouse.x, Input.mouse.y);
  }
}

export class LegSystem extends LimbSystem {
  constructor(end, length, speed, creature) {
    super(end, length, speed, creature);
    this.goalX = end.x;
    this.goalY = end.y;
    this.step = 0;
    this.forwardness = 0;
    this.reach = 0.9 * Math.hypot(this.end.x - this.hip.x, this.end.y - this.hip.y);
    let relAngle = this.creature.absAngle - Math.atan2(this.end.y - this.hip.y, this.end.x - this.hip.x);
    relAngle -= 2 * Math.PI * Math.floor(relAngle / (2 * Math.PI) + 0.5);
    this.swing = -relAngle + (2 * (relAngle < 0) - 1) * Math.PI / 2;
    this.swingOffset = this.creature.absAngle - this.hip.absAngle;
  }
  update(x, y) {
    this.moveTo(this.goalX, this.goalY);
    if (this.step === 0) {
      let dist = Math.hypot(this.end.x - this.goalX, this.end.y - this.goalY);
      if (dist > 1) {
        this.step = 1;
        this.goalX = this.hip.x + this.reach * Math.cos(this.swing + this.hip.absAngle + this.swingOffset) + (2 * Math.random() - 1) * this.reach / 2;
        this.goalY = this.hip.y + this.reach * Math.sin(this.swing + this.hip.absAngle + this.swingOffset) + (2 * Math.random() - 1) * this.reach / 2;
      }
    } else if (this.step === 1) {
      let theta = Math.atan2(this.end.y - this.hip.y, this.end.x - this.hip.x) - this.hip.absAngle;
      let dist = Math.hypot(this.end.x - this.hip.x, this.end.y - this.hip.y);
      let forwardness2 = dist * Math.cos(theta);
      let dF = this.forwardness - forwardness2;
      this.forwardness = forwardness2;
      if (dF * dF < 1) {
        this.step = 0;
        this.goalX = this.hip.x + (this.end.x - this.hip.x);
        this.goalY = this.hip.y + (this.end.y - this.hip.y);
      }
    }
  }
}