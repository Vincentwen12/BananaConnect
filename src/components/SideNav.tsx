import { Home, ScrollText, Server, Settings2 } from "lucide-react";
import type { TabId } from "../types";
import { useAppStore } from "../store/app";
import { Avatar } from "./ui/Avatar";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "联机", icon: Home },
  { id: "host", label: "主机", icon: Server },
  { id: "logs", label: "日志", icon: ScrollText },
  { id: "settings", label: "设置", icon: Settings2 },
];

export function SideNav() {
  const tab = useAppStore((state) => state.tab);
  const setTab = useAppStore((state) => state.setTab);
  const nickname = useAppStore((state) => state.settings.nickname);
  const roomActive = useAppStore((state) => state.room !== null);

  return (
    <nav className="sidenav" aria-label="主导航">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={`nav-item${tab === item.id ? " is-active" : ""}`}
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? "page" : undefined}
          >
            <Icon size={19} strokeWidth={2} />
            <span>{item.label}</span>
            {item.id === "home" && roomActive ? <span className="nav-item__badge" /> : null}
          </button>
        );
      })}

      <button
        type="button"
        className="nav-profile"
        onClick={() => setTab("settings")}
        title="修改昵称"
      >
        <Avatar name={nickname} size="sm" />
        <span className="nav-profile__name">{nickname || "未命名"}</span>
      </button>
      <div className="nav-version">v0.1.0</div>
    </nav>
  );
}
