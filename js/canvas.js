export const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
document.body.style.overflow = "hidden";
canvas.style.backgroundColor = "black";

export const ctx = canvas.getContext("2d");
export const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0, "#A0A0A0");
gradient.addColorStop(1, "#5A5A5A");
ctx.strokeStyle = gradient;