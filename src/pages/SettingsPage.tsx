import {
  Info,
  Palette,
  RefreshCw,
  RotateCcw,
  Settings2,
  Wifi,
} from "lucide-react";
import { DEFAULT_SETTINGS, useAppStore } from "../store/app";
import { isDesktop } from "../bridge";
import { toast } from "../store/toast";
import { ACCENT_PRESETS, accentTokens } from "../lib/color";
import { Button } from "../components/ui/Button";
import { Card, CardHead } from "../components/ui/Card";
import { Toggle } from "../components/ui/Toggle";
import { SettingRow } from "../components/ui/SettingRow";
import { BrandMark } from "../components/ui/BrandMark";

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings);
  const kernel = useAppStore((state) => state.kernel);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const currentAccent =
    ACCENT_PRESETS.find((preset) => preset.value === settings.accent)?.name ?? "自定义";

  const handleRestore = () => {
    updateSettings({ ...DEFAULT_SETTINGS });
    toast.success("已恢复默认设置");
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>设置</h1>
          <p>昵称、网络与外观选项，修改后立即生效</p>
        </div>
        <div className="page-head__side">
          <span className="tag">便携模式</span>
        </div>
      </header>

      <div className="settings-grid">
        <div className="settings-col">
          <Card>
            <CardHead icon={<Settings2 size={16} />} title="常规" sub="启动和窗口行为" />

            <SettingRow
              title="昵称"
              desc="显示在房间玩家列表里"
              control={
                <input
                  className="input"
                  style={{ width: 160 }}
                  value={settings.nickname}
                  maxLength={16}
                  placeholder="输入昵称"
                  onChange={(event) => updateSettings({ nickname: event.target.value })}
                />
              }
            />
            <SettingRow
              title="启动时自动检测世界"
              desc="打开软件后自动扫描局域网内已开放的世界"
              control={
                <Toggle
                  checked={settings.autoDetect}
                  onChange={(value) => updateSettings({ autoDetect: value })}
                  label="启动时自动检测世界"
                />
              }
            />
            <SettingRow
              title="关闭窗口时最小化到托盘"
              desc="留在后台继续维持房间，不会断开朋友连接"
              control={
                <Toggle
                  checked={settings.closeToTray}
                  onChange={(value) => updateSettings({ closeToTray: value })}
                  label="关闭窗口时最小化到托盘"
                />
              }
            />
            <SettingRow
              title="开机自动启动"
              desc="开机后在后台准备好，进游戏即可开房"
              control={
                <Toggle
                  checked={settings.launchAtBoot}
                  onChange={(value) => updateSettings({ launchAtBoot: value })}
                  label="开机自动启动"
                />
              }
            />
          </Card>

          <Card>
            <CardHead icon={<Wifi size={16} />} title="网络" sub="转发服务器与端口配置" />

            <SettingRow
              title="监听端口"
              desc="本地游戏世界使用的端口，默认 25565"
              control={
                <input
                  className="input input--mono input--narrow"
                  inputMode="numeric"
                  value={settings.listenPort}
                  onChange={(event) => {
                    const value = Number(event.target.value.replace(/[^0-9]/g, "").slice(0, 5));
                    updateSettings({ listenPort: value || 0 });
                  }}
                  onBlur={() => {
                    if (settings.listenPort < 1024 || settings.listenPort > 65535) {
                      updateSettings({ listenPort: 25565 });
                      toast.info("端口需在 1024-65535，已恢复为 25565");
                    }
                  }}
                />
              }
            />
            <SettingRow
              title="广播地址"
              desc="Minecraft 局域网发现使用的组播地址"
              control={
                <input
                  className="input input--mono"
                  value={settings.broadcastAddr}
                  onChange={(event) => updateSettings({ broadcastAddr: event.target.value })}
                />
              }
            />
            <SettingRow
              title="自定义转发服务器"
              desc="留空则自动选择延迟最低的节点"
              control={
                <input
                  className="input"
                  value={settings.relayServer}
                  placeholder="留空 = 自动选择节点"
                  onChange={(event) => updateSettings({ relayServer: event.target.value })}
                />
              }
            />
            <SettingRow
              title="断线自动重连"
              desc="网络波动时自动重连转发通道，尽量不掉线"
              control={
                <Toggle
                  checked={settings.autoReconnect}
                  onChange={(value) => updateSettings({ autoReconnect: value })}
                  label="断线自动重连"
                />
              }
            />
            <SettingRow
              title="省电模式"
              desc="切到后台时暂停刷新和动画，降低老设备占用"
              control={
                <Toggle
                  checked={settings.ecoMode}
                  onChange={(value) => updateSettings({ ecoMode: value })}
                  label="省电模式"
                />
              }
            />
          </Card>
        </div>

        <div className="settings-col">
          <Card>
            <CardHead
              icon={<Palette size={16} />}
              title="外观"
              sub="主题色会立刻应用到整个界面"
              extra={<span className="tag tag--accent">{currentAccent}</span>}
            />

            <SettingRow
              title="主题色"
              desc="香蕉黄为主色，黄底自动配深色文字保证可读"
              control={
                <div className="swatches">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="swatch"
                      style={{ background: preset.value }}
                      data-active={preset.value === settings.accent}
                      title={preset.name}
                      aria-label={preset.name}
                      onClick={() => {
                        updateSettings({ accent: preset.value });
                        toast.success(`已切换到「${preset.name}」`);
                      }}
                    />
                  ))}
                </div>
              }
            />

            <SettingRow
              title="减少界面动画"
              desc="关闭页面切换和呼吸灯动画，适合低配设备"
              control={
                <Toggle
                  checked={settings.reduceMotion}
                  onChange={(value) => updateSettings({ reduceMotion: value })}
                  label="减少界面动画"
                />
              }
            />

            <SettingRow
              title="界面预览"
              desc="主题色在邀请码、按钮和选中项上生效"
              control={
                <div className="row" style={{ gap: 8 }}>
                  <span
                    className="tag"
                    style={{
                      background: accentTokens(settings.accent).accentSoft,
                      color: accentTokens(settings.accent).accentInk,
                    }}
                  >
                    邀请码
                  </span>
                  <span
                    style={{
                      width: 54,
                      height: 24,
                      borderRadius: 7,
                      background: accentTokens(settings.accent).accent,
                      color: accentTokens(settings.accent).onAccent,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    按钮
                  </span>
                </div>
              }
            />
          </Card>

          <Card>
            <CardHead icon={<Info size={16} />} title="关于" />

            <div className="about-row">
              <BrandMark size={40} />
              <div>
                <div className="about-name">BananaConnect</div>
                <div className="about-version">v0.1.0 · UI 预览版</div>
              </div>
            </div>

            <div className="kv">
              <span className="kv__k">运行模式</span>
              <span className="kv__v">
                <span className={kernel?.easytierVersion ? "tag tag--ok" : "tag tag--warn"}>
                  {kernel?.easytierVersion
                    ? "EasyTier 已就绪"
                    : kernel?.easytierFound
                      ? "内核异常（缺 DLL）"
                      : "内核未接入"}
                </span>
              </span>
            </div>
            <div className="kv">
              <span className="kv__k">内核版本</span>
              <span className="kv__v mono">{kernel?.easytierVersion ?? "未检测到"}</span>
            </div>
            <div className="kv">
              <span className="kv__k">当前数据</span>
              <span className="kv__v">
                {isDesktop ? "EasyTier 房间已接入 · 玩家列表待接入" : "浏览器模拟数据"}
              </span>
            </div>
            <div className="kv">
              <span className="kv__k">数据目录</span>
              <span className="kv__v mono">data/（便携）</span>
            </div>

            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={13} />}
                disabled
                title="内核接入后开放"
              >
                检查更新
              </Button>
              <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={handleRestore}>
                恢复默认设置
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
