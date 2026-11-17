/** 主题色工具：从单个主色推导整套 accent token（香蕉黄为默认）。 */

export const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace("#", "").trim();
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;

const mixChannel = (channel: number, target: number, weight: number) =>
  channel + (target - channel) * weight;

export const mix = (hex: string, target: string, weight: number) => {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex([
    mixChannel(a[0], b[0], weight),
    mixChannel(a[1], b[1], weight),
    mixChannel(a[2], b[2], weight),
  ]);
};

export const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const darken = (hex: string, weight: number) => mix(hex, "#000000", weight);
const lighten = (hex: string, weight: number) => mix(hex, "#ffffff", weight);

export interface AccentTokens {
  accent: string;
  accentHover: string;
  accentActive: string;
  accentSoft: string;
  accentLine: string;
  accentInk: string;
  onAccent: string;
}

export function accentTokens(hex: string): AccentTokens {
  const safe = /^#[0-9a-f]{3,6}$/i.test(hex) ? hex : "#ffd43b";
  return {
    accent: safe,
    accentHover: lighten(safe, 0.14),
    accentActive: darken(safe, 0.1),
    accentSoft: mix(safe, "#ffffff", 0.88),
    accentLine: mix(safe, "#ffffff", 0.42),
    accentInk: darken(safe, 0.45),
    onAccent: luminance(safe) > 0.45 ? "#2b2200" : "#ffffff",
  };
}

export function applyAccent(hex: string) {
  const tokens = accentTokens(hex);
  const root = document.documentElement;
  root.style.setProperty("--accent", tokens.accent);
  root.style.setProperty("--accent-hover", tokens.accentHover);
  root.style.setProperty("--accent-active", tokens.accentActive);
  root.style.setProperty("--accent-soft", tokens.accentSoft);
  root.style.setProperty("--accent-line", tokens.accentLine);
  root.style.setProperty("--accent-ink", tokens.accentInk);
  root.style.setProperty("--on-accent", tokens.onAccent);
}

/** 预设主题色板 */
export const ACCENT_PRESETS = [
  { name: "香蕉黄", value: "#ffd43b" },
  { name: "PCL 蓝", value: "#2a6ee8" },
  { name: "草绿", value: "#34a853" },
  { name: "樱花粉", value: "#e86a92" },
  { name: "石墨灰", value: "#5b6472" },
];
