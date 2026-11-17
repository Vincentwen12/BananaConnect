import type { BananaBridge } from "./index";
import type { CoreEvent, LanWorld, Metrics, Player, Room } from "../types";

/* ---------------------------------------------------------------- 工具 */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.round(rand(min, max));
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const roomCode = () =>
  Array.from({ length: 12 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

const WORLDS = [
  { name: "生存世界", version: "1.20.4" },
  { name: "空岛生存", version: "1.20.1" },
  { name: "红石实验室", version: "1.21.4" },
  { name: "暮色森林", version: "1.19.2" },
];

const GUEST_NAMES = [
  "苦力怕酱",
  "小麦种子",
  "钻石君",
  "南瓜头",
  "铁傀儡",
  "史莱姆球",
  "末影珍珠",
  "金胡萝卜",
  "萤石灯",
  "岩浆怪",
];

const HISTORY_LEN = 28;

const seeded = (base: number, spread: number, digits = 0) =>
  Array.from({ length: HISTORY_LEN }, () => Number((base + rand(-spread, spread)).toFixed(digits)));

const seedHistories = (metrics: Metrics): Metrics => ({
  ...metrics,
  history: {
    ping: seeded(46, 14),
    up: seeded(17, 6, 1),
    down: seeded(12, 5, 1),
  },
});

const createMetrics = (): Metrics => ({
  ping: 0,
  upKbps: 0,
  downKbps: 0,
  online: 0,
  capacity: 8,
  uptime: 0,
  history: {
    ping: Array(HISTORY_LEN).fill(0),
    up: Array(HISTORY_LEN).fill(0),
    down: Array(HISTORY_LEN).fill(0),
  },
});

const pushHistory = (arr: number[], value: number) => {
  arr.push(value);
  if (arr.length > HISTORY_LEN) arr.shift();
  return arr;
};

/* ---------------------------------------------------------------- mock 实现 */

export function createMockBridge(): BananaBridge {
  const listeners = new Set<(event: CoreEvent) => void>();
  const emit = (event: CoreEvent) => listeners.forEach((listener) => listener(event));

  let logId = 0;
  const log = (level: "debug" | "info" | "warn" | "error", scope: string, message: string) =>
    emit({
      type: "log",
      entry: { id: ++logId, time: Date.now(), level, scope, message },
    });

  let world: LanWorld | null = {
    name: "生存世界",
    version: "1.20.4",
    port: 25565,
    detectedAt: Date.now(),
  };
  let tunnelEnabled = false;
  let metrics = createMetrics();
  let room: Room | null = null;

  const timers = new Set<number>();
  const every = (ms: number, fn: () => void) => {
    const id = window.setInterval(fn, ms);
    timers.add(id);
    return id;
  };
  const stopTimers = () => {
    timers.forEach((id) => window.clearInterval(id));
    timers.clear();
  };

  const tickMetrics = () => {
    const online = room ? Math.max(room.players.length - 1, 0) : 0;
    const active = tunnelEnabled || (room !== null && room.phase !== "closed");
    metrics = {
      ...metrics,
      ping: active ? randInt(28, 72) : 0,
      upKbps: active ? Number(rand(6, 34).toFixed(1)) : 0,
      downKbps: active ? Number(rand(4, 26).toFixed(1)) : 0,
      online,
      uptime: active ? metrics.uptime + 2 : 0,
      history: {
        ping: pushHistory(metrics.history.ping, active ? randInt(28, 72) : 0),
        up: pushHistory(metrics.history.up, active ? rand(6, 34) : 0),
        down: pushHistory(metrics.history.down, active ? rand(4, 26) : 0),
      },
    };
    emit({ type: "metrics", metrics });
  };

  const joinGuest = () => {
    if (!room || room.phase === "closed") return;
    if (room.players.length >= metrics.capacity) return;
    const used = new Set(room.players.map((player) => player.name));
    const free = GUEST_NAMES.filter((name) => !used.has(name));
    if (!free.length) return;
    const guest: Player = {
      id: `p_${Math.random().toString(36).slice(2, 8)}`,
      name: pick(free),
      isHost: false,
      ping: randInt(30, 120),
      joinedAt: Date.now(),
    };
    room = { ...room, phase: "online", players: [...room.players, guest] };
    emit({ type: "room", room });
    log("info", "房间", `${guest.name} 加入了房间（延迟 ${guest.ping}ms）`);
    if (room.role === "host") {
      emit({ type: "toast", level: "info", message: `${guest.name} 加入了房间` });
    }
  };

  const startRoomTicks = (asHost: boolean) => {
    stopTimers();
    every(2000, tickMetrics);
    every(2000, () => {
      if (!room || room.phase === "closed") return;
      const players = room.players.map((player) =>
        player.isHost ? player : { ...player, ping: randInt(30, 140) },
      );
      room = { ...room, players };
      emit({ type: "room", room });
    });
    if (asHost) {
      const scheduleGuest = () => {
        const delay = randInt(3500, 6500);
        const id = window.setTimeout(() => {
          joinGuest();
          if (room && room.players.length < 4) scheduleGuest();
        }, delay);
        timers.add(id);
      };
      scheduleGuest();
    }
  };

  return {
    async ready() {
      log("info", "内核", "BananaConnect 0.1.0 启动（当前为 UI 预览模式，数据为模拟）");
      log("info", "局域网", "检测到本地广播端口 224.0.2.60:4445");
      log("info", "局域网", `发现世界「${world?.name}」 · ${world?.version} · 端口 ${world?.port}`);
      log("debug", "内核", "配置文件路径：data/settings.json（便携模式）");
      return { world, tunnelEnabled, metrics };
    },

    async detectWorld() {
      log("debug", "局域网", "正在扫描局域网广播包…");
      await wait(680);
      const found = pick(WORLDS);
      world = {
        name: found.name,
        version: found.version,
        port: 25565,
        detectedAt: Date.now(),
      };
      emit({ type: "world", world });
      log("info", "局域网", `发现世界「${world.name}」 · ${world.version} · 端口 ${world.port}`);
      return world;
    },

    async createRoom({ port, note, nickname }) {
      if (!Number.isFinite(port) || port < 1024 || port > 65535) {
        log("error", "房间", `端口 ${port} 不在 1024-65535 范围内，创建失败`);
        throw new Error("端口需要在 1024-65535 之间");
      }
      log("info", "房间", `正在创建房间，目标端口 ${port}`);
      log("debug", "隧道", "申请转发通道…");
      await wait(520);
      metrics = seedHistories({ ...createMetrics(), capacity: 8 });
      const host: Player = {
        id: "p_host",
        name: nickname.trim() || "房主",
        isHost: true,
        ping: randInt(8, 24),
        joinedAt: Date.now(),
      };
      room = {
        code: roomCode(),
        role: "host",
        phase: "connecting",
        note,
        port,
        createdAt: Date.now(),
        players: [host],
      };
      emit({ type: "room", room });
      log("info", "隧道", "转发通道已建立，等待外部玩家接入");
      emit({ type: "toast", level: "success", message: `房间 ${room.code} 已创建` });
      startRoomTicks(true);
      const id = window.setTimeout(() => {
        if (!room) return;
        room = { ...room, phase: "waiting" };
        emit({ type: "room", room });
        tickMetrics();
        log("info", "房间", "房间已开放，把邀请码发给朋友就能进来");
      }, 1400);
      timers.add(id);
      return room;
    },

    async joinRoom({ code, nickname }) {
      const normalized = code.trim().toUpperCase();
      log("info", "房间", `尝试加入房间 ${normalized}`);
      log("debug", "隧道", "连接转发节点…");
      await wait(760);
      if (normalized === "000000000000") {
        log("error", "房间", `房间 ${normalized} 不存在或已关闭`);
        throw new Error("房间不存在，请检查邀请码");
      }
      if (normalized.length !== 12) {
        throw new Error("邀请码应该是 12 位");
      }
      const host: Player = {
        id: "p_host",
        name: "房主",
        isHost: true,
        ping: randInt(32, 60),
        joinedAt: Date.now(),
      };
      const me: Player = {
        id: "p_me",
        name: nickname.trim() || "我",
        isHost: false,
        ping: randInt(30, 58),
        joinedAt: Date.now(),
      };
      metrics = seedHistories({ ...createMetrics(), capacity: 8 });
      room = {
        code: normalized,
        role: "guest",
        phase: "connecting",
        note: "",
        port: 25565,
        createdAt: Date.now(),
        players: [host, me],
      };
      emit({ type: "room", room });
      log("info", "隧道", "已连上房主的转发节点");
      startRoomTicks(false);
      const id = window.setTimeout(() => {
        if (!room) return;
        room = { ...room, phase: "online" };
        emit({ type: "room", room });
        tickMetrics();
        log("info", "房间", "已在房间中，进入游戏 → 多人游戏 → 直接连接即可");
        emit({ type: "toast", level: "success", message: "已加入房间" });
      }, 1100);
      timers.add(id);
      return room;
    },

    async leaveRoom() {
      stopTimers();
      if (room) {
        log("info", "房间", `已离开房间 ${room.code}`);
      }
      room = null;
      metrics = { ...createMetrics(), ping: 0 };
      emit({ type: "room", room: null });
      emit({ type: "metrics", metrics });
    },

    async setTunnelEnabled(enabled) {
      tunnelEnabled = enabled;
      log(enabled ? "info" : "warn", "转发", enabled ? "局域网广播转发已开启" : "局域网广播转发已关闭");
      emit({ type: "tunnel", enabled });
      if (enabled && !room) {
        stopTimers();
        metrics = seedHistories(createMetrics());
        tickMetrics();
        every(2000, tickMetrics);
      } else if (!enabled && !room) {
        stopTimers();
        metrics = createMetrics();
        emit({ type: "metrics", metrics });
      }
    },

    async restartTunnel() {
      log("warn", "转发", "正在重启转发通道…");
      stopTimers();
      await wait(520);
      metrics = { ...createMetrics() };
      emit({ type: "metrics", metrics });
      log("info", "转发", "转发通道已重启");
      emit({ type: "toast", level: "success", message: "转发通道已重启" });
    },

    on(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };
}

export const mockBridge = createMockBridge();
