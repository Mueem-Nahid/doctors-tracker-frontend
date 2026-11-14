import type { ReactNode } from "react";
import { Button } from "@/components/atoms/button";
import { UiIcon } from "@/components/atoms/icons/ui-icon";

export function StatusPanel({
  title,
  description,
  tone = "empty",
  heading: Heading = "h2",
  actions,
}: {
  title: string;
  description?: string;
  tone?: "empty" | "error" | "missing";
  heading?: "h1" | "h2" | "h3";
  actions?: ReactNode;
}) {
  return (
    <div className={`status-panel status-panel-${tone}`}>
      <span className="status-panel-icon">
        <UiIcon name={tone === "error" ? "alert" : tone === "missing" ? "search" : "records"} />
      </span>
      <div className="status-panel-copy" role={tone === "error" ? "alert" : undefined}>
        <Heading>{title}</Heading>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="status-panel-actions">{actions}</div> : null}
    </div>
  );
}

export function RetryButton({ onRetry, pending }: { onRetry: () => void; pending?: boolean }) {
  return (
    <Button variant="outline" type="button" onClick={onRetry} disabled={pending}>
      <UiIcon name="retry" />
      {pending ? "Trying again…" : "Try again"}
    </Button>
  );
}
