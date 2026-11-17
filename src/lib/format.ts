export const pad2 = (value: number) => value.toString().padStart(2, "0");

export const formatClock = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
};

export const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** 12 位邀请码分段显示：ABCD-EFGH-JKLM */
export const formatInvite = (code: string) => code.match(/.{1,4}/g)?.join("-") ?? code;
