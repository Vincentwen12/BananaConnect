import { useEffect } from "react";
import { TitleBar } from "./components/TitleBar";
import { SideNav } from "./components/SideNav";
import { StatusBar } from "./components/StatusBar";
import { Toaster } from "./components/Toaster";
import { HomePage } from "./pages/HomePage";
import { HostPage } from "./pages/HostPage";
import { LogsPage } from "./pages/LogsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAppStore } from "./store/app";
import { applyAccent } from "./lib/color";
import type { TabId } from "./types";

const TAB_IDS: TabId[] = ["home", "host", "logs", "settings"];

const tabFromHash = (): TabId => {
  const raw = window.location.hash.replace(/^#\/?/, "");
  return TAB_IDS.includes(raw as TabId) ? (raw as TabId) : "home";
};

export default function App() {
  const ready = useAppStore((state) => state.ready);
  const tab = useAppStore((state) => state.tab);
  const init = useAppStore((state) => state.init);
  const accent = useAppStore((state) => state.settings.accent);
  const reduceMotion = useAppStore((state) => state.settings.reduceMotion);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    const applyHash = () => useAppStore.getState().setTab(tabFromHash());
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    const target = `#/${tab}`;
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [tab]);

  // 仅开发期：?demo=room / ?demo=guest 用模拟数据直接呈现房间界面，方便截图验收。
  useEffect(() => {
    if (!import.meta.env.DEV || !ready) return;
    const demo = new URLSearchParams(window.location.search).get("demo");
    const state = useAppStore.getState();
    if (state.room) return;
    if (demo === "room") {
      void state.createRoom({ port: state.world?.port ?? 25565, note: "纯净生存，欢迎萌新" });
    } else if (demo === "guest") {
      void state.joinRoom("ABC123");
    } else if (demo === "tunnel") {
      void state.toggleTunnel(true);
    }
  }, [ready]);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion]);

  return (
    <div className="app">
      <TitleBar />
      <div className="shell">
        <SideNav />
        <main className="content">
          {!ready ? (
            <div className="page">
              <div className="empty">正在启动 BananaConnect…</div>
            </div>
          ) : (
            <>
              {tab === "home" ? <HomePage /> : null}
              {tab === "host" ? <HostPage /> : null}
              {tab === "logs" ? <LogsPage /> : null}
              {tab === "settings" ? <SettingsPage /> : null}
            </>
          )}
        </main>
      </div>
      <StatusBar />
      <Toaster />
    </div>
  );
}
