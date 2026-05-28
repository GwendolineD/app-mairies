export const CONTENT_TYPE_TAGS = {
  event: {
    label: "Événement",
    className: "bg-orange/10 text-orange",
  },
  initiative: {
    label: "Initiative",
    className: "bg-mint/10 text-mint",
  },
} as const;

export type ContentTypeTagKey = keyof typeof CONTENT_TYPE_TAGS;
