"use client";

import { useEffect, useState } from "react";
import { ReportRestoreActionsClient } from "@/components/features/reports/report-restore-actions-client";
import type { ReportRestoreInfo } from "@/lib/queries/report-restore-context";
import { formatCompactShortDate } from "@/lib/utils/format-date";

type RestorableResolution = "content_suspended" | "user_suspended";

type Props = {
  isStillSuspended: boolean;
  lastRestore: ReportRestoreInfo | null;
  resolution: RestorableResolution;
  contextType: string;
  contextId: string;
  authorMembershipId: string | null;
};

function getRestoreStorageKey(
  resolution: RestorableResolution,
  contextType: string,
  contextId: string,
  authorMembershipId: string | null,
): string {
  if (resolution === "user_suspended") {
    return `vl:report-restore:user:${authorMembershipId ?? contextId}`;
  }

  return `vl:report-restore:content:${contextType}:${contextId}`;
}

export function ReportRestoreStatus({
  isStillSuspended,
  lastRestore,
  resolution,
  contextType,
  contextId,
  authorMembershipId,
}: Props) {
  const storageKey = getRestoreStorageKey(
    resolution,
    contextType,
    contextId,
    authorMembershipId,
  );
  const [localRestore, setLocalRestore] = useState<ReportRestoreInfo | null>(
    null,
  );

  useEffect(() => {
    if (lastRestore) {
      sessionStorage.removeItem(storageKey);
      return;
    }

    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      setLocalRestore(JSON.parse(raw) as ReportRestoreInfo);
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [lastRestore, storageKey]);

  function handleRestored(info: ReportRestoreInfo) {
    sessionStorage.setItem(storageKey, JSON.stringify(info));
    setLocalRestore(info);
  }

  const displayRestore = lastRestore ?? localRestore;

  if (isStillSuspended && !displayRestore) {
    return (
      <ReportRestoreActionsClient
        resolution={resolution}
        contextType={contextType}
        contextId={contextId}
        authorMembershipId={authorMembershipId}
        onRestored={handleRestored}
      />
    );
  }

  if (displayRestore) {
    return (
      <span className="text-xs text-muted">
        Restauré le {formatCompactShortDate(displayRestore.at)} par{" "}
        {displayRestore.actorName}
      </span>
    );
  }

  if (!isStillSuspended) {
    const fallbackLabel =
      resolution === "user_suspended" ? "Auteur restauré" : "Contenu restauré";
    return <span className="text-xs text-muted">{fallbackLabel}</span>;
  }

  return <span aria-hidden className="flex-1" />;
}
