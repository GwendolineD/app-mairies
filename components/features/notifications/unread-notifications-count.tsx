"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  applyServerUnreadCount,
  clickUnreadNotification,
  confirmUnreadNotification,
  initialUnreadBadgeState,
  markAllUnreadNotificationsRead,
  undoUnreadNotification,
  type UnreadBadgeState,
} from "@/lib/utils/unread-notifications-badge";

type Action =
  | { type: "server"; count: number; communeId: string }
  | { type: "click"; id: string }
  | { type: "confirm"; id: string }
  | { type: "undo"; id: string }
  | { type: "markAll" };

function reducer(state: UnreadBadgeState, action: Action): UnreadBadgeState {
  switch (action.type) {
    case "server":
      return applyServerUnreadCount(state, action.count, action.communeId);
    case "click":
      return clickUnreadNotification(state, action.id);
    case "confirm":
      return confirmUnreadNotification(state, action.id);
    case "undo":
      return undoUnreadNotification(state, action.id);
    case "markAll":
      return markAllUnreadNotificationsRead(state);
  }
}

type UnreadNotificationsApi = {
  displayed: number;
  markOneRead: (id: string) => void;
  confirm: (id: string) => void;
  undo: (id: string) => void;
  markAllRead: () => void;
  applyServer: (count: number, communeId: string) => void;
};

const NOOP: UnreadNotificationsApi = {
  displayed: 0,
  markOneRead: () => {},
  confirm: () => {},
  undo: () => {},
  markAllRead: () => {},
  applyServer: () => {},
};

const UnreadNotificationsContext = createContext<UnreadNotificationsApi | null>(null);

export function UnreadNotificationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, initialUnreadBadgeState);

  const markOneRead = useCallback((id: string) => dispatch({ type: "click", id }), []);
  const confirm = useCallback((id: string) => dispatch({ type: "confirm", id }), []);
  const undo = useCallback((id: string) => dispatch({ type: "undo", id }), []);
  const markAllRead = useCallback(() => dispatch({ type: "markAll" }), []);
  const applyServer = useCallback(
    (count: number, communeId: string) => dispatch({ type: "server", count, communeId }),
    [],
  );

  const api = useMemo<UnreadNotificationsApi>(
    () => ({
      displayed: state.displayed,
      markOneRead,
      confirm,
      undo,
      markAllRead,
      applyServer,
    }),
    [state.displayed, markOneRead, confirm, undo, markAllRead, applyServer],
  );

  return (
    <UnreadNotificationsContext.Provider value={api}>
      {children}
    </UnreadNotificationsContext.Provider>
  );
}

/** No-op outside the resident layout, so a row can render without the provider. */
export function useUnreadNotifications(): UnreadNotificationsApi {
  return useContext(UnreadNotificationsContext) ?? NOOP;
}

/**
 * Publishes a fresh server total. `revision` changes on every server render
 * so an unchanged count (a new notification offsetting a read) is still applied.
 */
export function SyncUnreadCount({
  count,
  communeId,
  revision,
}: {
  count: number;
  communeId: string;
  revision: string;
}) {
  const { applyServer } = useUnreadNotifications();

  useEffect(() => {
    applyServer(count, communeId);
  }, [applyServer, count, communeId, revision]);

  return null;
}

/** Purple pill. Renders nothing when there is nothing unread. */
export function UnreadNotificationsPill() {
  const { displayed } = useUnreadNotifications();
  if (displayed <= 0) return null;

  const label = displayed > 9 ? "9+" : String(displayed);

  return (
    <span
      aria-label={`${displayed} notifications non lues`}
      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple px-1 text-[9px] font-bold leading-none text-white"
    >
      {label}
    </span>
  );
}
