"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { MessagesShell } from "@/components/features/messages-shell";

/**
 * MessagesShell whose mobile mode follows the active child segment of the
 * inbox layout: a selected `[id]` shows the pane, otherwise the list.
 * Must be rendered directly by an inbox layout (`(boite)` or `corbeille`).
 */
export function MessagesShellAuto({
  list,
  pane,
}: {
  list: React.ReactNode;
  pane: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  return (
    <MessagesShell mode={segment ? "pane" : "list"} list={list} pane={pane} />
  );
}
