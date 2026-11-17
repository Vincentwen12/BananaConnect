import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Search, Trash2 } from "lucide-react";
import { useLogStore } from "../store/logs";
import { toast } from "../store/toast";
import { copyText } from "../lib/clipboard";
import { formatClock } from "../lib/format";
import { LEVEL_TEXT } from "../lib/labels";
import type { LogLevel } from "../types";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { Toggle } from "../components/ui/Toggle";

type LevelFilter = "all" | LogLevel;

export function LogsPage() {
  const entries = useLogStore((state) => state.entries);
  const clear = useLogStore((state) => state.clear);

  const [level, setLevel] = useState<LevelFilter>("all");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  const consoleRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const base = { all: entries.length, info: 0, warn: 0, error: 0, debug: 0 };
    for (const entry of entries) base[entry.level] += 1;
    return base;
  }, [entries]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (level !== "all" && entry.level !== level) return false;
      if (!keyword) return true;
      return (
        entry.message.toLowerCase().includes(keyword) || entry.scope.toLowerCase().includes(keyword)
      );
    });
  }, [entries, level, search]);

  useEffect(() => {
    if (!autoScroll) return;
    const node = consoleRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [filtered.length, autoScroll]);

  const handleCopy = async () => {
    if (!filtered.length) {
      toast.info("当前没有可复制的日志");
      return;
    }
    const text = filtered
      .map(
        (entry) =>
          `${formatClock(entry.time)} [${LEVEL_TEXT[entry.level]}] [${entry.scope}] ${entry.message}`,
      )
      .join("\n");
    const ok = await copyText(text);
    if (ok) toast.success(`已复制 ${filtered.length} 条日志`);
    else toast.error("复制失败");
  };

  const handleClear = () => {
    if (!entries.length) return;
    clear();
    toast.info("日志已清空");
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>日志</h1>
          <p>连接、隧道与 UDP 转发的运行记录</p>
        </div>
        <div className="page-head__side">
          <span className="tag">缓冲上限 2000 条</span>
        </div>
      </header>

      <div className="logs-toolbar">
        <Segmented<LevelFilter>
          value={level}
          onChange={setLevel}
          options={[
            { value: "all", label: `全部 ${counts.all}` },
            { value: "info", label: `信息 ${counts.info}` },
            { value: "warn", label: `警告 ${counts.warn}` },
            { value: "error", label: `错误 ${counts.error}` },
          ]}
        />

        <div className="logs-search">
          <Search size={14} className="logs-search__icon" />
          <input
            className="input"
            value={search}
            placeholder="搜索内容或模块…"
            onChange={(event) => setSearch(event.target.value)}
            aria-label="搜索日志"
          />
        </div>

        <div className="logs-toolbar__right">
          <span className="row muted" style={{ fontSize: 11.5, gap: 6 }}>
            自动滚动
            <Toggle checked={autoScroll} onChange={setAutoScroll} label="自动滚动" />
          </span>
          <Button variant="secondary" size="sm" icon={<Copy size={13} />} onClick={() => void handleCopy()}>
            复制
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={handleClear}>
            清空
          </Button>
        </div>
      </div>

      <div className="console" ref={consoleRef}>
        {filtered.length === 0 ? (
          <div className="console__empty">
            {entries.length === 0 ? "还没有日志，创建或加入房间后这里会有记录" : "没有匹配的日志"}
          </div>
        ) : (
          filtered.map((entry) => (
            <div className="log-row" key={entry.id} data-level={entry.level}>
              <span className="log-row__time">{formatClock(entry.time)}</span>
              <span className="log-row__level">{LEVEL_TEXT[entry.level]}</span>
              <span className="log-row__scope">{entry.scope}</span>
              <span className="log-row__msg">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
