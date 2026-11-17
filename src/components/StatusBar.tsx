import { useAppStore } from "../store/app";
import { isDesktop } from "../bridge";
import { PHASE_TEXT } from "../lib/labels";
import { formatInvite } from "../lib/format";

export function StatusBar() {
  const room = useAppStore((state) => state.room);
  const tunnelEnabled = useAppStore((state) => state.tunnelEnabled);
  const ping = useAppStore((state) => state.metrics.ping);
  const port = useAppStore((state) => state.settings.listenPort);
  const kernel = useAppStore((state) => state.kernel);

  const kernelNote = !isDesktop
    ? "浏览器预览"
    : kernel?.easytierVersion
      ? "EasyTier 就绪"
      : kernel?.easytierFound
        ? "内核异常（缺 DLL）"
        : "内核缺失";

  let dotClass = "status-dot";
  let label = "未连接";

  if (room) {
    if (room.phase === "online") {
      dotClass = "status-dot status-dot--on";
      label = `房间 ${formatInvite(room.code)} · ${room.players.length} 人在线`;
    } else if (room.phase === "closed") {
      label = `房间 ${formatInvite(room.code)} · ${PHASE_TEXT.closed}`;
    } else {
      dotClass = "status-dot status-dot--idle";
      label = `房间 ${formatInvite(room.code)} · ${PHASE_TEXT[room.phase]}`;
    }
  } else if (tunnelEnabled) {
    dotClass = "status-dot status-dot--idle";
    label = "广播转发已开启 · 尚未进房间";
  }

  return (
    <footer className="statusbar">
      <div className="statusbar__group">
        <span className={dotClass} />
        <span>{label}</span>
      </div>
      {room && ping > 0 ? (
        <>
          <span className="statusbar__sep" />
          <div className="statusbar__group tabular">延迟 {ping} ms</div>
        </>
      ) : null}
      <span className="statusbar__sep" />
      <div className="statusbar__group tabular">本机端口 {port}</div>
      <div className="spacer" />
      <span className="statusbar__note">{kernelNote}</span>
      <span className="statusbar__ver">v0.1.0</span>
    </footer>
  );
}
