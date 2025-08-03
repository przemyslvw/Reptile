const Input = {
  keys: Array(230).fill(false),
  mouse: {
    left: false,
    right: false,
    middle: false,
    x: 0,
    y: 0
  }
};

document.addEventListener("keydown", e => Input.keys[e.keyCode] = true);
document.addEventListener("keyup", e => Input.keys[e.keyCode] = false);

document.addEventListener("mousedown", e => {
  if (e.button === 0) Input.mouse.left = true;
  if (e.button === 1) Input.mouse.middle = true;
  if (e.button === 2) Input.mouse.right = true;
});
document.addEventListener("mouseup", e => {
  if (e.button === 0) Input.mouse.left = false;
  if (e.button === 1) Input.mouse.middle = false;
  if (e.button === 2) Input.mouse.right = false;
});
document.addEventListener("mousemove", e => {
  Input.mouse.x = e.clientX;
  Input.mouse.y = e.clientY;
});

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
document.body.style.overflow = "hidden";
canvas.style.backgroundColor = "black";

const ctx = canvas.getContext("2d");
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0, "#A0A0A0");
gradient.addColorStop(1, "#5A5A5A");
ctx.strokeStyle = gradient;

let segmentCount = 0;

class Segment {
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

class LimbSystem {
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

class LegSystem extends LimbSystem {
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

class Creature {
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

// --- Setup functions ---

function setupSimple() {
  let critter = new Creature(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0, 12, 1, 0.5, 16, 0.5, 0.085, 0.5, 0.3
  );
  let node = critter;
  for (let i = 0; i < 128; i++) node = new Segment(node, 8, 0, Math.PI / 2, 1);
  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    critter.follow(Input.mouse.x, Input.mouse.y);
  }, 33);
}

function setupTentacle() {
  let critter = new Creature(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0, 12, 1, 0.5, 16, 0.5, 0.085, 0.5, 0.3
  );
  let node = critter;
  for (let i = 0; i < 32; i++) node = new Segment(node, 8, 0, 2, 1);
  new LimbSystem(node, 32, 8, critter);
  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    critter.follow(canvas.width / 2, canvas.height / 2);
    ctx.beginPath();
    ctx.arc(Input.mouse.x, Input.mouse.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }, 33);
}

function setupArm() {
  let critter = new Creature(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0, 12, 1, 0.5, 16, 0.5, 0.085, 0.5, 0.3
  );
  let node = critter;
  for (let i = 0; i < 3; i++) node = new Segment(node, 80, 0, Math.PI, 1);
  new LimbSystem(node, 3, critter);
  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    critter.follow(canvas.width / 2, canvas.height / 2);
    ctx.beginPath();
    ctx.arc(Input.mouse.x, Input.mouse.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }, 33);
}

function setupTestSquid(size, legs) {
  let critter = new Creature(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0, size * 10, size * 3, 0.5, 16, 0.5, 0.085, 0.5, 0.3
  );
  let jointNum = 32;
  for (let i = 0; i < legs; i++) {
    let node = critter;
    let ang = Math.PI / 2 * (i / (legs - 1) - 0.5);
    for (let ii = 0; ii < jointNum; ii++) {
      node = new Segment(node, size * 64 / jointNum, ang * (ii === 0), Math.PI, 1.2);
    }
    new LegSystem(node, jointNum, size * 30, critter);
  }
  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    critter.follow(Input.mouse.x, Input.mouse.y);
  }, 33);
}

function createReptile(size, legs, tail) {
  let s = size;
  let critter = new Creature(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0, s * 10, s * 2, 0.5, 16, 0.5, 0.085, 0.5, 0.3
  );
  let spinal = critter;

  for (let i = 0; i < 6; i++) {
    spinal = new Segment(spinal, s * 4, 0, 2 * Math.PI / 3, 1.1);
    for (let ii = -1; ii <= 1; ii += 2) {
      let node = new Segment(spinal, s * 3, ii, 0.1, 2);
      for (let iii = 0; iii < 3; iii++) {
        node = new Segment(node, s * 0.1, -ii * 0.1, 0.1, 2);
      }
    }
  }

  for (let i = 0; i < legs; i++) {
    if (i > 0) {
      for (let ii = 0; ii < 6; ii++) {
        spinal = new Segment(spinal, s * 4, 0, Math.PI / 2, 1.5);
        for (let iii = -1; iii <= 1; iii += 2) {
          let node = new Segment(spinal, s * 3, iii * Math.PI / 2, 0.1, 1.5);
          for (let iv = 0; iv < 3; iv++) {
            node = new Segment(node, s * 3, -iii * 0.3, 0.1, 2);
          }
        }
      }
    }
    for (let ii = -1; ii <= 1; ii += 2) {
      let node = new Segment(spinal, s * 12, ii * Math.PI / 4, 0, 8);
      node = new Segment(node, s * 16, -ii * Math.PI / 4, 2 * Math.PI, 1);
      node = new Segment(node, s * 16, ii * Math.PI / 2, Math.PI, 2);
      for (let iii = 0; iii < 4; iii++) {
        new Segment(node, s * 4, (iii / 3 - 0.5) * Math.PI / 2, 0.1, 4);
      }
      new LegSystem(node, 3, s * 12, critter, 4);
    }
  }

  for (let i = 0; i < tail; i++) {
    spinal = new Segment(spinal, s * 4, 0, 2 * Math.PI / 3, 1.1);
    for (let ii = -1; ii <= 1; ii += 2) {
      let node = new Segment(spinal, s * 3, ii, 0.1, 2);
      for (let iii = 0; iii < 3; iii++) {
        node = new Segment(node, s * 3 * (tail - i) / tail, -ii * 0.1, 0.1, 2);
      }
    }
  }
  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    critter.follow(Input.mouse.x, Input.mouse.y);
  }, 33);
}

// --- Start ---
const legNum = Math.floor(1 + Math.random() * 12);
createReptile(
  8 / Math.sqrt(legNum),
  legNum,
  Math.floor(2 + Math.random() * legNum * 8)
);