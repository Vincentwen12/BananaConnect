import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pngjs from "pngjs";
import gifenc from "gifenc";

const { PNG } = pngjs;
const { GIFEncoder, quantize, applyPalette } = gifenc;

const root = process.cwd();
const framesDir = path.join(root, ".cache", "frames");
const out = path.join(root, "site", "assets", "demo.gif");
const targetWidth = 1280;

const files = readdirSync(framesDir).filter((name) => name.endsWith(".png")).sort();
if (!files.length) throw new Error("no frames");

function resize(source, width) {
  const ratio = width / source.width;
  const height = Math.round(source.height * ratio);
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sy = Math.min(source.height - 1, Math.floor(y / ratio));
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(source.width - 1, Math.floor(x / ratio));
      const from = (sy * source.width + sx) * 4;
      const to = (y * width + x) * 4;
      out[to] = source.data[from];
      out[to + 1] = source.data[from + 1];
      out[to + 2] = source.data[from + 2];
      out[to + 3] = 255;
    }
  }
  return { data: out, width, height };
}

const gif = GIFEncoder();
let size = null;

files.forEach((file, index) => {
  const png = PNG.sync.read(readFileSync(path.join(framesDir, file)));
  const frame = resize(png, targetWidth);
  size = { width: frame.width, height: frame.height };
  const palette = quantize(frame.data, 128);
  const indexed = applyPalette(frame.data, palette);
  gif.writeFrame(indexed, frame.width, frame.height, {
    palette,
    delay: 110,
  });
  if (index % 20 === 0) console.log("frame", index, "/", files.length);
});

gif.finish();
writeFileSync(out, gif.bytes());
console.log("gif", out, files.length, "frames", size.width + "x" + size.height);
