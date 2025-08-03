import "./js/input.js";
import "./js/canvas.js";
import { createReptile } from "./js/setup.js";

const legNum = Math.floor(1 + Math.random() * 12);
createReptile(
  8 / Math.sqrt(legNum),
  legNum,
  Math.floor(2 + Math.random() * legNum * 8)
);