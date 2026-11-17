import { useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Radar,
  Radio,
  RefreshCw,
  ScrollText,
  Settings2,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { useAppStore } from "../store/app";
import { toast } from "../store/toast";
import { copyText } from "../lib/clipboard";
import { formatClock, formatDuration } from "../lib/format";
import { Button } from "../components/ui/Button";
import { Card, CardHead } from "../components/ui/Card";
import { Toggle } from "../components/ui/Toggle";
import { Sparkline } from "../components/ui/Sparkline";

const RELAY_NODES = [
  { value: "auto", label: "自动选择" },
  { value: "sh", label: "上海" },
  { value: "hk", label: "香港" },
  { value: "tyo", label: "东京" },
  { value: "sg", label: "新加坡" },
];

export function HostPage() {
  const world = useAppStore((state) => state.world);
  const tunnelEnabled = useAppStore((state) => state.tunnelEnabled);
  const metrics = useAppStore((state) => state.metrics);
  const busy = useAppStore((state) => state.busy);
  const settings = useAppStore((state) => state.settings);
  const detectWorld = useAppStore((state) => state.detectWorld);
  const toggleTunnel = useAppStore((state) => state.toggleTunnel);
  const restartTunnel = useAppStore((state) => state.restartTunnel);
  const setTab = useAppStore((state) => state.setTab);

  const [node, setNode] = useState("auto");

  const localAddress = `127.0.0.1:${world?.port ?? settings.listenPort}`;

  const handleCopyAddress = async () => {
    const ok = await copyText(localAddress);
    if (ok) toast.success("本机地址已复制");
    else toast.error("复制失败");
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>主机状态</h1>
          <p>检测本地世界、管理广播转发和隧道节点</p>
        </div>
        <div className="page-head__side">
          {tunnelEnabled ? (
            <span className="tag tag--ok">转发中</span>
          ) : (
            <span className="tag">转发未开启</span>
          )}
        </div>
      </header>

      <div className="host-grid">
        <div className="stack">
          <Card>
            <CardHead
              icon={<Radar size={16} />}
              title="局域网世界"
              sub="自动检测游戏里对局域网开放的世界"
              extra={
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw size={13} />}
                  loading={busy === "detect"}
                  onClick={() => void detectWorld()}
                >
                  重新检测
                </Button>
              }
            />

            {world ? (
              <>
                <div className="kv">
                  <span className="kv__k">世界名称</span>
                  <span className="kv__v">{world.name}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">游戏版本</span>
                  <span className="kv__v">{world.version}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">世界端口</span>
                  <span className="kv__v mono">{world.port}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">检测时间</span>
                  <span className="kv__v">{formatClock(world.detectedAt)}</span>
                </div>
              </>
            ) : (
              <div className="empty">
                没有检测到局域网世界
                <div className="empty__hint">进入存档后按 ESC →「对局域网开放」</div>
              </div>
            )}
          </Card>

          <Card>
            <CardHead icon={<Radio size={16} />} title="广播转发" sub="把 224.0.2.60 的广播包送进隧道" />

            <div className="setting-row" style={{ paddingTop: 0 }}>
              <div className="setting-row__text">
                <div className="setting-row__title">开启广播转发</div>
                <div className="setting-row__desc">开启后朋友能在「多人游戏」里直接看到你的世界</div>
              </div>
              <div className="setting-row__control">
                <Toggle checked={tunnelEnabled} onChange={(value) => void toggleTunnel(value)} label="开启广播转发" />
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-row__text">
                <div className="setting-row__title">隧道节点</div>
                <div className="setting-row__desc">自动模式会挑选延迟最低的节点</div>
              </div>
              <div className="setting-row__control">
                <select className="input select" style={{ width: 128 }} value={node} onChange={(event) => setNode(event.target.value)}>
                  {RELAY_NODES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-row__text">
                <div className="setting-row__title">本机地址</div>
                <div className="setting-row__desc">同一局域网内的朋友可以直接用这个地址</div>
              </div>
              <div className="setting-row__control">
                <button type="button" className="copy-addr" onClick={() => void handleCopyAddress()} title="复制本机地址">
                  <Copy size={12} />
                  {localAddress}
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-row__text">
                <div className="setting-row__title">广播地址</div>
                <div className="setting-row__desc">Minecraft 局域网发现使用的组播地址</div>
              </div>
              <div className="setting-row__control">
                <span className="tag tag--mono">{settings.broadcastAddr}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <CardHead icon={<Activity size={16} />} title="实时指标" sub="每 2 秒刷新一次" extra={<span className="tag">{node === "auto" ? "自动节点" : RELAY_NODES.find((item) => item.value === node)?.label}</span>} />

            <div className="metrics">
              <div className="metric">
                <div className="metric__label">
                  <Wifi size={12} /> 延迟
                </div>
                <div className="metric__value">
                  {metrics.ping}
                  <span className="metric__unit">ms</span>
                </div>
              </div>
              <div className="metric">
                <div className="metric__label">
                  <Users size={12} /> 在线
                </div>
                <div className="metric__value">
                  {metrics.online}
                  <span className="metric__unit">/ {metrics.capacity}</span>
                </div>
              </div>
              <div className="metric">
                <div className="metric__label">
                  <ArrowUpRight size={12} /> 上行
                </div>
                <div className="metric__value">
                  {metrics.upKbps.toFixed(1)}
                  <span className="metric__unit">KB/s</span>
                </div>
              </div>
              <div className="metric">
                <div className="metric__label">
                  <ArrowDownRight size={12} /> 下行
                </div>
                <div className="metric__value">
                  {metrics.downKbps.toFixed(1)}
                  <span className="metric__unit">KB/s</span>
                </div>
              </div>
            </div>

            <div className="spark-block">
              <div className="spark-block__head">
                <span>延迟走势</span>
                <span className="spark-block__value">{metrics.ping} ms</span>
              </div>
              <Sparkline values={metrics.history.ping} />
            </div>

            <div className="spark-block">
              <div className="spark-block__head">
                <span>上行走势</span>
                <span className="spark-block__value">{metrics.upKbps.toFixed(1)} KB/s</span>
              </div>
              <Sparkline values={metrics.history.up} />
            </div>

            <div className="uptime">
              <span>运行时长</span>
              <span className="mono">{formatDuration(metrics.uptime)}</span>
            </div>
          </Card>

          <Card flat>
            <CardHead icon={<Zap size={16} />} title="快捷操作" />
            <div className="host-actions">
              <Button
                variant="secondary"
                icon={<RefreshCw size={15} />}
                loading={busy === "restart"}
                onClick={() => void restartTunnel()}
              >
                重启转发
              </Button>
              <Button variant="secondary" icon={<Copy size={15} />} onClick={() => void handleCopyAddress()}>
                复制地址
              </Button>
              <Button variant="secondary" icon={<ScrollText size={15} />} onClick={() => setTab("logs")}>
                打开日志
              </Button>
              <Button variant="secondary" icon={<Settings2 size={15} />} onClick={() => setTab("settings")}>
                网络设置
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
