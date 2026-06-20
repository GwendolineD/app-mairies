"use client";

import { createContext, useContext } from "react";

export type MessagingContextValue = {
  unreadCount: number;
  refreshUnread: () => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
};

export const MessagingContext = createContext<MessagingContextValue | null>(
  null,
);

export function useMessaging(): MessagingContextValue | null {
  return useContext(MessagingContext);
}
