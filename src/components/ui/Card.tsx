import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  flat?: boolean;
}

export function Card({ children, className = "", hover = false, flat = false }: CardProps) {
  return (
    <section
      className={["card", hover ? "card--hover" : "", flat ? "card--flat" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}

interface CardHeadProps {
  icon?: ReactNode;
  title: string;
  sub?: string;
  extra?: ReactNode;
}

export function CardHead({ icon, title, sub, extra }: CardHeadProps) {
  return (
    <header className="card__head">
      {icon ? <span className="card__icon">{icon}</span> : null}
      <div>
        <div className="card__title">{title}</div>
        {sub ? <div className="card__sub">{sub}</div> : null}
      </div>
      {extra ? <div className="card__extra">{extra}</div> : null}
    </header>
  );
}
