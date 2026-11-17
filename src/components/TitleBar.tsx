import { useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Minus, X } from "lucide-react";
import { isDesktop } from "../bridge";
import { toast } from "../store/toast";
import { BrandMark } from "./ui/BrandMark";

export function TitleBar() {
  const dragTimer = useRef<number | null>(null);

  const clearDragTimer = () => {
    if (dragTimer.current !== null) {
      window.clearTimeout(dragTimer.current);
      dragTimer.current = null;
    }
  };

  /** 按住 150ms 后才拖动窗口，避免单击也触发拖动。 */
  const handleMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    if (!isDesktop || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-no-drag]")) return;
    clearDragTimer();
    dragTimer.current = window.setTimeout(() => {
      dragTimer.current = null;
      void getCurrentWindow().startDragging();
    }, 150);
  };

  const minimize = () => {
    if (!isDesktop) return;
    void invoke("window_minimize").catch((error) => toast.error(String(error)));
  };

  const close = () => {
    if (!isDesktop) return;
    void invoke("window_close").catch((error) => toast.error(String(error)));
  };

  return (
    <header
      className="titlebar"
      onMouseDown={handleMouseDown}
      onMouseUp={clearDragTimer}
      onMouseLeave={clearDragTimer}
    >
      <div className="brand">
        <BrandMark size={20} />
        <span className="brand__name">BananaConnect</span>
        <span className="brand__ver">v0.1.0</span>
      </div>

      {isDesktop ? (
        <div className="window-btns" data-no-drag>
          <button type="button" className="window-btn" onClick={minimize} title="最小化" aria-label="最小化">
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="window-btn window-btn--close"
            onClick={close}
            title="关闭"
            aria-label="关闭"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <span className="titlebar__note">浏览器预览</span>
      )}
    </header>
  );
}
