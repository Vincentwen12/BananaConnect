import type { CoreEvent, LanWorld, Metrics, Room } from "../types";
import { mockBridge } from "./mock";

/**
 * UI 只依赖这个接口。
 * 现在由 mock 实现驱动；接真实内核时换成 Tauri invoke 实现，页面代码不用改。
 */
export interface BananaBridge {
  ready(): Promise<{
    world: LanWorld | null;
    tunnelEnabled: boolean;
    metrics: Metrics;
  }>;
  detectWorld(): Promise<LanWorld | null>;
  createRoom(input: { port: number; note: string; nickname: string }): Promise<Room>;
  joinRoom(input: { code: string; nickname: string }): Promise<Room>;
  leaveRoom(): Promise<void>;
  setTunnelEnabled(enabled: boolean): Promise<void>;
  restartTunnel(): Promise<void>;
  on(handler: (event: CoreEvent) => void): () => void;
}

/** 是否是 Tauri 运行时（打包后为 true，浏览器预览为 false） */
export const isDesktop = "__TAURI_INTERNALS__" in window;

export const bridge: BananaBridge = mockBridge;
