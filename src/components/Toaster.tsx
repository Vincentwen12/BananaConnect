import { useToastStore } from "../store/toast";

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.level}`}>
          <span className="toast__mark" />
          <span className="toast__text">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
