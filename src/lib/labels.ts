import type { RoomPhase, RoomRole } from "../types";

export const PHASE_TEXT: Record<RoomPhase, string> = {
  connecting: "正在建立通道",
  waiting: "等待玩家加入",
  online: "已连接",
  closed: "已关闭",
};

export const ROLE_TEXT: Record<RoomRole, string> = {
  host: "房主",
  guest: "成员",
};

export const LEVEL_TEXT = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
} as const;
