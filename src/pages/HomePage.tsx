import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Copy,
  Info,
  Link2,
  LogIn,
  LogOut,
  Radar,
  Rocket,
  ScrollText,
  Share2,
  Users,
} from "lucide-react";
import { useAppStore } from "../store/app";
import { useLogStore } from "../store/logs";
import { toast } from "../store/toast";
import { copyText } from "../lib/clipboard";
import { formatInvite, formatClock, formatDuration } from "../lib/format";
import { PHASE_TEXT, ROLE_TEXT } from "../lib/labels";
import type { Room } from "../types";
import { Button } from "../components/ui/Button";
import { Card, CardHead } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";

export function HomePage() {
  const nickname = useAppStore((state) => state.settings.nickname);
  const world = useAppStore((state) => state.world);
  const room = useAppStore((state) => state.room);

  return (
    <div className="page page--home">
      <header className="page-head">
        <div>
          <h1>你好，{nickname || "玩家"}</h1>
          <p>{room ? "房间已开好，把邀请码发给朋友" : "和朋友一起玩"}</p>
        </div>
        <div className="page-head__side">
          <span className="world-state">
            <span className={world ? "dot dot--on" : "dot"} />
            {world ? `${world.name} · ${world.port}` : "未检测到局域网世界"}
          </span>
        </div>
      </header>

      {room ? <RoomPanel room={room} /> : <JoinOrCreate />}
    </div>
  );
}

function JoinOrCreate() {
  const world = useAppStore((state) => state.world);
  const busy = useAppStore((state) => state.busy);
  const detectWorld = useAppStore((state) => state.detectWorld);
  const createRoom = useAppStore((state) => state.createRoom);
  const joinRoom = useAppStore((state) => state.joinRoom);

  const [port, setPort] = useState(String(world?.port ?? 25565));
  const [portTouched, setPortTouched] = useState(false);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!portTouched && world) {
      setPort(String(world.port));
    }
  }, [world, portTouched]);

  const handleDetect = async () => {
    await detectWorld();
    setPortTouched(false);
  };

  const handleCreate = () => {
    const value = Number(port);
    if (!Number.isFinite(value)) {
      toast.error("端口需要是数字");
      return;
    }
    void createRoom({ port: value, note: note.trim() });
  };

  return (
    <div className="home-grid">
      <Card>
        <CardHead icon={<Rocket size={15} />} title="创建房间" sub="把自己的世界开放给朋友" />
        <div className="home-form">
          <div className="home-form__row">
            <div className="field">
              <label className="field__label" htmlFor="world-port">
                世界端口
                <span className="field__hint">游戏内「对局域网开放」后显示</span>
              </label>
              <input
                id="world-port"
                className="input input--mono"
                inputMode="numeric"
                value={port}
                onChange={(event) => {
                  setPortTouched(true);
                  setPort(event.target.value.replace(/[^0-9]/g, "").slice(0, 5));
                }}
                placeholder="25565"
              />
            </div>
            <button
              type="button"
              className="text-action"
              onClick={() => void handleDetect()}
              disabled={busy === "detect"}
            >
              <Radar size={13} />
              {busy === "detect" ? "检测中…" : "自动检测"}
            </button>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="room-note">
              房间备注
              <span className="field__hint">可选</span>
            </label>
            <input
              id="room-note"
              className="input"
              value={note}
              maxLength={24}
              placeholder="例如：纯净生存，欢迎萌新"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            block
            loading={busy === "create"}
            onClick={handleCreate}
          >
            创建房间
          </Button>
        </div>
        <div className="card__foot">
          <Info size={13} />
          <span>先在游戏里按 ESC →「对局域网开放」，再创建房间。</span>
        </div>
      </Card>

      <Card>
        <CardHead icon={<LogIn size={15} />} title="加入房间" sub="输入朋友分享的 12 位邀请码" />
        <div className="home-form">
          <input
            className="code-input"
            value={code}
            placeholder="ABCD-EFGH-JKLM"
            maxLength={12}
            spellCheck={false}
            aria-label="邀请码"
            onChange={(event) =>
              setCode(
                event.target.value
                  .replace(/[^0-9a-zA-Z]/g, "")
                  .toUpperCase()
                  .slice(0, 12),
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && code.length === 12) void joinRoom(code);
            }}
          />
          <Button
            variant={code.length === 12 ? "primary" : "secondary"}
            size="lg"
            block
            loading={busy === "join"}
            disabled={code.length !== 12}
            onClick={() => void joinRoom(code)}
          >
            加入房间
          </Button>
          <p className="join-hint">还没有邀请码？让房主点「复制邀请」发你一份。</p>
        </div>
        <div className="card__foot">
          <Users size={13} />
          <span>一个房间最多 8 人，房主离开后房间会自动关闭。</span>
        </div>
      </Card>
    </div>
  );
}

function RoomPanel({ room }: { room: Room }) {
  const capacity = useAppStore((state) => state.metrics.capacity);
  const busy = useAppStore((state) => state.busy);
  const leaveRoom = useAppStore((state) => state.leaveRoom);
  const setTab = useAppStore((state) => state.setTab);
  const logs = useLogStore((state) => state.entries);

  const feed = useMemo(
    () =>
      logs
        .filter((entry) => entry.scope === "房间" || entry.scope === "隧道" || entry.scope === "转发")
        .slice(-4)
        .reverse(),
    [logs],
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = Math.floor((now - room.createdAt) / 1000);

  const handleCopyCode = async () => {
    const ok = await copyText(formatInvite(room.code));
    if (ok) toast.success(`邀请码 ${formatInvite(room.code)} 已复制`);
    else toast.error("复制失败，请手动选择");
  };

  const handleCopyInvite = async () => {
    const text = `打开 BananaConnect 输入邀请码 ${formatInvite(room.code)} 就能进我的世界房间。`;
    const ok = await copyText(text);
    if (ok) toast.success("邀请文案已复制");
    else toast.error("复制失败，请手动选择");
  };

  return (
    <div className="stack">
      <Card>
        <div className="room-hero">
          <div className="room-hero__info">
            <div className="room-status">
              <span className={room.phase === "online" ? "dot dot--on" : "dot dot--idle"} />
              <span>{PHASE_TEXT[room.phase]}</span>
              <span className="room-status__sep" />
              <span>{ROLE_TEXT[room.role]}</span>
              <span className="room-status__sep" />
              <span>端口 {room.port}</span>
              <span className="room-status__sep" />
              <span className="tabular">{formatDuration(elapsed)}</span>
              {room.note ? (
                <>
                  <span className="room-status__sep" />
                  <span>{room.note}</span>
                </>
              ) : null}
            </div>
            <div className="room-code-wrap">
              <span className="room-code">{formatInvite(room.code)}</span>
              <Button
                variant="ghost"
                size="sm"
                icon={<Copy size={14} />}
                onClick={() => void handleCopyCode()}
              >
                复制
              </Button>
            </div>
          </div>

          <div className="room-hero__actions">
            <Button variant="secondary" icon={<Share2 size={15} />} onClick={() => void handleCopyInvite()}>
              复制邀请
            </Button>
            <Button variant="ghost" icon={<ScrollText size={15} />} onClick={() => setTab("logs")}>
              日志
            </Button>
            <Button
              variant="danger"
              icon={<LogOut size={15} />}
              loading={busy === "leave"}
              onClick={() => void leaveRoom()}
            >
              离开
            </Button>
          </div>
        </div>

        <p className="room-hint">
          {room.role === "host"
            ? "朋友加入后，在游戏「多人游戏」里会直接看到你的世界；没出现就让对方用「直接连接」输入邀请码。"
            : "进入游戏 → 多人游戏 → 直接连接，房间地址会自动出现在列表里。"}
        </p>

        <div className="players">
          <div className="players__head">
            <span>
              在线玩家 {room.players.length}/{capacity}
            </span>
          </div>
          <div className="player-list">
            {room.players.map((player) => (
              <div className="player-row" key={player.id}>
                <Avatar name={player.name} size="sm" />
                <div className="player-row__name">
                  <span>{player.name}</span>
                  {player.isHost ? <em>房主</em> : null}
                  {player.id === "p_me" ? <em>你</em> : null}
                </div>
                <div className="player-row__ping">
                  <span>{player.ping} ms</span>
                </div>
              </div>
            ))}
          </div>

          {room.players.length <= 1 && room.role === "host" ? (
            <div className="empty">
              还没有人加入
              <div className="empty__hint">把邀请码 {formatInvite(room.code)} 发给朋友吧</div>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="room-extra">
        <Card flat>
          <CardHead icon={<Link2 size={15} />} title="连接信息" />
          <div className="kv">
            <span className="kv__k">邀请码</span>
            <span className="kv__v mono">{formatInvite(room.code)}</span>
          </div>
          <div className="kv">
            <span className="kv__k">本机端口</span>
            <span className="kv__v mono">{room.port}</span>
          </div>
          <div className="kv">
            <span className="kv__k">隧道</span>
            <span className="kv__v">{room.role === "host" ? "上行转发已就绪" : "房主节点转发"}</span>
          </div>
          <div className="kv">
            <span className="kv__k">加密</span>
            <span className="kv__v">内核接入后启用</span>
          </div>
        </Card>

        <Card flat>
          <CardHead icon={<Activity size={15} />} title="最近动态" />
          {feed.length ? (
            <ul className="mini-feed">
              {feed.map((entry) => (
                <li key={entry.id}>
                  <span className="mini-feed__time">{formatClock(entry.time)}</span>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">还没有动态</div>
          )}
        </Card>
      </div>
    </div>
  );
}
