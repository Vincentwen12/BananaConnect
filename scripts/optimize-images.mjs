import { readdirSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const src = path.join(root, "site", "assets");
const out = path.join(src, "web");
mkdirSync(out, { recursive: true });

const files = readdirSync(src).filter((name) => name.endsWith(".png"));
for (const file of files) {
  const input = path.join(src, file);
  const output = path.join(out, file.replace(/\.png$/, ".webp"));
  const info = await sharp(input)
    .resize({ width: 1800, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(output);
  const before = (statSync(input).size / 1024).toFixed(0);
  const after = (info.size / 1024).toFixed(0);
  console.log(`${file}: ${before} KB -> ${after} KB (${info.width}x${info.height})`);
}
