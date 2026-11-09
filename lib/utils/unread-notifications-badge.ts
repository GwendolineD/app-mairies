/**
 * Optimistic unread-badge count.
 *
 * The displayed number starts from the server total. A click lowers it at
 * once and remembers the id. A server total that arrives while a click is
 * still in flight is ignored. The next total, once the write has finished,
 * replaces the local number. A commune change always takes the new total.
 */

export type UnreadBadgeState = {
  displayed: number;
  /** Ids whose read-write has not settled yet. */
  inFlight: ReadonlySet<string>;
  communeId: string | null;
};

export function initialUnreadBadgeState(): UnreadBadgeState {
  return { displayed: 0, inFlight: new Set(), communeId: null };
}

export function applyServerUnreadCount(
  state: UnreadBadgeState,
  count: number,
  communeId: string,
): UnreadBadgeState {
  if (state.communeId !== communeId) {
    return { displayed: count, inFlight: new Set(), communeId };
  }
  if (state.inFlight.size > 0) return state;
  return { ...state, displayed: count };
}

/** Lower the badge by one. A second click on the same id does nothing. */
export function clickUnreadNotification(
  state: UnreadBadgeState,
  id: string,
): UnreadBadgeState {
  if (state.inFlight.has(id)) return state;
  const inFlight = new Set(state.inFlight);
  inFlight.add(id);
  return {
    ...state,
    displayed: Math.max(0, state.displayed - 1),
    inFlight,
  };
}

/**
 * The write succeeded. The local number stays; the id leaves the in-flight
 * set so the next server total can replace it.
 */
export function confirmUnreadNotification(
  state: UnreadBadgeState,
  id: string,
): UnreadBadgeState {
  if (!state.inFlight.has(id)) return state;
  const inFlight = new Set(state.inFlight);
  inFlight.delete(id);
  return { ...state, inFlight };
}

/** The write failed. Give the count back and forget the id. */
export function undoUnreadNotification(
  state: UnreadBadgeState,
  id: string,
): UnreadBadgeState {
  if (!state.inFlight.has(id)) return state;
  const inFlight = new Set(state.inFlight);
  inFlight.delete(id);
  return { ...state, displayed: state.displayed + 1, inFlight };
}

/** Mark-all. The following server refresh is expected to report zero. */
export function markAllUnreadNotificationsRead(
  state: UnreadBadgeState,
): UnreadBadgeState {
  return { ...state, displayed: 0, inFlight: new Set() };
}
