import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";
import { bridge, isDesktop } from "../bridge";
import type { CoreEvent, LanWorld, Metrics, Room, Settings, TabId } from "../types";
import { useLogStore } from "./logs";
import { toast } from "./toast";

const emptyMetrics = (): Metrics => ({
  ping: 0,
  upKbps: 0,
  downKbps: 0,
  online: 0,
  capacity: 8,
  uptime: 0,
  history: { ping: [], up: [], down: [] },
});

export const DEFAULT_SETTINGS: Settings = {
  nickname: "Steve",
  autoDetect: true,
  closeToTray: true,
  launchAtBoot: false,
  relayServer: "",
  listenPort: 25565,
  broadcastAddr: "224.0.2.60:4445",
  autoReconnect: true,
  ecoMode: false,
  accent: "#ffd43b",
  reduceMotion: false,
};

type Busy = null | "create" | "join" | "leave" | "detect" | "restart";

interface RoomInfo {
  code: string;
  role: "host" | "guest";
  ip: string;
  port: number;
  uptime: number;
  alive: boolean;
}

const RELAY_DEFAULT = ["tcp://161.33.207.13:51010", "tcp://public.easytier.top:11010"];

const relayList = (settings: Settings) => {
  const list = settings.relayServer.split(/[\s,]+/).filter(Boolean);
  return list.length ? list : RELAY_DEFAULT;
};

const TAB_IDS: TabId[] = ["home", "host", "logs", "settings"];

const initialTab = (): TabId => {
  const raw = window.location.hash.replace(/^#\/?/, "");
  return TAB_IDS.includes(raw as TabId) ? (raw as TabId) : "home";
};

export interface KernelInfo {
  easytierFound: boolean;
  easytierVersion: string | null;
  path: string | null;
}

interface AppState {
  ready: boolean;
  tab: TabId;
  world: LanWorld | null;
  tunnelEnabled: boolean;
  metrics: Metrics;
  room: Room | null;
  busy: Busy;
  settings: Settings;
  kernel: KernelInfo | null;
  setTab: (tab: TabId) => void;
  init: () => Promise<void>;
  detectWorld: () => Promise<void>;
  createRoom: (input: { port: number; note: string }) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleTunnel: (enabled: boolean) => Promise<void>;
  restartTunnel: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "操作失败，请稍后再试";

const handleEvent = (event: CoreEvent) => {
  switch (event.type) {
    case "log":
      useLogStore.getState().add(event.entry);
      break;
    case "room":
      useAppStore.setState({ room: event.room });
      break;
    case "metrics":
      useAppStore.setState({ metrics: event.metrics });
      break;
    case "tunnel":
      useAppStore.setState({ tunnelEnabled: event.enabled });
      break;
    case "world":
      useAppStore.setState({ world: event.world });
      break;
    case "toast":
      toast[event.level](event.message);
      break;
  }
};

let subscribed = false;
let initPromise: Promise<void> | null = null;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ready: false,
      tab: initialTab(),
      world: null,
      tunnelEnabled: false,
      metrics: emptyMetrics(),
      room: null,
      busy: null,
      settings: DEFAULT_SETTINGS,
      kernel: null,

      setTab: (tab) => set({ tab }),

      init: async () => {
        if (get().ready) return;
        if (initPromise) return initPromise;
        if (!subscribed) {
          bridge.on(handleEvent);
          subscribed = true;
        }
        initPromise = (async () => {
          const snapshot = await bridge.ready();
          set({
            ready: true,
            world: snapshot.world,
            tunnelEnabled: snapshot.tunnelEnabled,
            metrics: snapshot.metrics,
          });
          if (isDesktop) {
            try {
              const kernel = await invoke<KernelInfo>("kernel_status");
              set({ kernel });
            } catch {
              set({ kernel: null });
            }
            window.setInterval(() => {
              const state = useAppStore.getState();
              if (!state.room) return;
              void invoke<RoomInfo | null>("room_status")
                .then((info) => {
                  if (!info || !info.alive) {
                    useAppStore.setState({ room: null });
                    toast.error("房间已断开");
                  }
                })
                .catch(() => {});
            }, 2000);
          }
        })();
        return initPromise;
      },

      detectWorld: async () => {
        if (get().busy) return;
        set({ busy: "detect" });
        try {
          const world = await bridge.detectWorld();
          set({ world });
          if (world) toast.success(`发现世界「${world.name}」`);
        } catch (error) {
          toast.error(errorMessage(error));
        } finally {
          set({ busy: null });
        }
      },

      createRoom: async ({ port, note }) => {
        if (get().busy) return;
        set({ busy: "create" });
        try {
          if (isDesktop) {
            const info = await invoke<RoomInfo>("room_create", {
              port,
              note,
              relays: relayList(get().settings),
            });
            const now = Date.now();
            set({
              room: {
                code: info.code,
                role: "host",
                phase: "waiting",
                note,
                port,
                createdAt: now,
                players: [
                  {
                    id: "p_host",
                    name: get().settings.nickname || "房主",
                    isHost: true,
                    ping: 0,
                    joinedAt: now,
                  },
                ],
              },
              tab: "home",
            });
            toast.success(`房间已创建`);
          } else {
            const room = await bridge.createRoom({
              port,
              note,
              nickname: get().settings.nickname,
            });
            set({ room, tab: "home" });
          }
        } catch (error) {
          toast.error(errorMessage(error));
        } finally {
          set({ busy: null });
        }
      },

      joinRoom: async (code) => {
        if (get().busy) return;
        const normalized = code.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
        const need = 12;
        if (normalized.length !== need) {
          toast.error(`邀请码是 ${need} 位字符`);
          return;
        }
        set({ busy: "join" });
        try {
          if (isDesktop) {
            const info = await invoke<RoomInfo>("room_join", {
              code: normalized,
              relays: relayList(get().settings),
            });
            const now = Date.now();
            set({
              room: {
                code: info.code,
                role: "guest",
                phase: "waiting",
                note: "",
                port: 25565,
                createdAt: now,
                players: [
                  {
                    id: "p_me",
                    name: get().settings.nickname || "我",
                    isHost: false,
                    ping: 0,
                    joinedAt: now,
                  },
                ],
              },
              tab: "home",
            });
            toast.success("已加入房间");
          } else {
            const room = await bridge.joinRoom({ code: normalized, nickname: get().settings.nickname });
            set({ room, tab: "home" });
          }
        } catch (error) {
          toast.error(errorMessage(error));
        } finally {
          set({ busy: null });
        }
      },

      leaveRoom: async () => {
        if (get().busy) return;
        set({ busy: "leave" });
        try {
          if (isDesktop) {
            await invoke("room_leave");
            set({ room: null });
          } else {
            await bridge.leaveRoom();
            set({ room: null });
          }
          toast.info("已离开房间");
        } catch (error) {
          toast.error(errorMessage(error));
        } finally {
          set({ busy: null });
        }
      },

      toggleTunnel: async (enabled) => {
        try {
          await bridge.setTunnelEnabled(enabled);
          set({ tunnelEnabled: enabled });
          toast.success(enabled ? "广播转发已开启" : "广播转发已关闭");
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },

      restartTunnel: async () => {
        if (get().busy) return;
        set({ busy: "restart" });
        try {
          await bridge.restartTunnel();
        } catch (error) {
          toast.error(errorMessage(error));
        } finally {
          set({ busy: null });
        }
      },

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
    }),
    {
      name: "banana.settings",
      version: 1,
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);
