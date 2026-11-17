export type TabId = "home" | "host" | "logs" | "settings";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: number;
  time: number;
  level: LogLevel;
  scope: string;
  message: string;
}

export type RoomRole = "host" | "guest";

/** connecting: 正在打隧道 · waiting: 房间已开、等人进 · online: 有外部玩家进来 · closed: 已结束 */
export type RoomPhase = "connecting" | "waiting" | "online" | "closed";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  ping: number;
  joinedAt: number;
}

export interface Room {
  code: string;
  role: RoomRole;
  phase: RoomPhase;
  note: string;
  port: number;
  createdAt: number;
  players: Player[];
}

export interface LanWorld {
  name: string;
  version: string;
  port: number;
  detectedAt: number;
}

export interface Metrics {
  ping: number;
  upKbps: number;
  downKbps: number;
  online: number;
  capacity: number;
  uptime: number;
  history: {
    ping: number[];
    up: number[];
    down: number[];
  };
}

export interface Settings {
  nickname: string;
  autoDetect: boolean;
  closeToTray: boolean;
  launchAtBoot: boolean;
  relayServer: string;
  listenPort: number;
  broadcastAddr: string;
  autoReconnect: boolean;
  ecoMode: boolean;
  accent: string;
  reduceMotion: boolean;
}

export type CoreEvent =
  | { type: "log"; entry: LogEntry }
  | { type: "room"; room: Room | null }
  | { type: "metrics"; metrics: Metrics }
  | { type: "tunnel"; enabled: boolean }
  | { type: "world"; world: LanWorld | null }
  | { type: "toast"; level: "info" | "success" | "error"; message: string };
