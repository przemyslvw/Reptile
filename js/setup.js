import { Creature } from "./creature.js";
import { Segment } from "./segment.js";
import { LegSystem } from "./limbSystem.js";
import { ctx, canvas } from "./canvas.js";
import { Input } from "./input.js";

export function createReptile(size, legs, tail) {
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