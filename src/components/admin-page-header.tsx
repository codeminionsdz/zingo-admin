import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  action?: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
};

export function AdminPageHeader({
  action,
  eyebrow,
  subtitle,
  title,
}: AdminPageHeaderProps) {
  return (
    <div className="admin-page-heading">
      <div>
        {eyebrow && <p className="admin-page-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="admin-page-subtitle">{subtitle}</p>
      </div>
      {action && <div className="admin-page-actions">{action}</div>}
    </div>
  );
}
