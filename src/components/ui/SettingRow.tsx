import type { ReactNode } from "react";

interface SettingRowProps {
  title: string;
  desc?: string;
  control?: ReactNode;
}

export function SettingRow({ title, desc, control }: SettingRowProps) {
  return (
    <div className="setting-row">
      <div className="setting-row__text">
        <div className="setting-row__title">{title}</div>
        {desc ? <div className="setting-row__desc">{desc}</div> : null}
      </div>
      {control ? <div className="setting-row__control">{control}</div> : null}
    </div>
  );
}
