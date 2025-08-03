export const Input = {
  keys: Array(230).fill(false),
  mouse: { left: false, right: false, middle: false, x: 0, y: 0 }
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