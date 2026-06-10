import { DEFAULT_NEIGHBOR_INVITE_TEMPLATE } from "@/lib/constants/email-templates";

export type NeighborInviteTemplate = {
  subject: string;
  preheader: string | null;
  body_markdown: string;
  cta_label: string;
};

export type NeighborInviteTemplateView = {
  subject: string;
  preheader: string;
  bodyMarkdown: string;
  ctaLabel: string;
};

type NeighborInviteTemplateValues = {
  senderName: string;
  communeName: string;
  inviteLink: string;
};

export function normalizeNeighborInviteTemplate(
  row?: Partial<NeighborInviteTemplate> | null,
): NeighborInviteTemplateView {
  return {
    subject: row?.subject?.trim() || DEFAULT_NEIGHBOR_INVITE_TEMPLATE.subject,
    preheader:
      row?.preheader?.trim() || DEFAULT_NEIGHBOR_INVITE_TEMPLATE.preheader,
    bodyMarkdown:
      row?.body_markdown?.trim() ||
      DEFAULT_NEIGHBOR_INVITE_TEMPLATE.bodyMarkdown,
    ctaLabel:
      row?.cta_label?.trim() || DEFAULT_NEIGHBOR_INVITE_TEMPLATE.ctaLabel,
  };
}

export function renderNeighborInviteTemplate(
  template: NeighborInviteTemplateView,
  values: NeighborInviteTemplateValues,
) {
  const replacements: Record<string, string> = {
    "{{sender_name}}": values.senderName,
    "{{commune_name}}": values.communeName,
    "{{invite_link}}": values.inviteLink,
  };

  function render(value: string) {
    return Object.entries(replacements).reduce(
      (result, [placeholder, replacement]) =>
        result.split(placeholder).join(replacement),
      value,
    );
  }

  return {
    subject: render(template.subject),
    preheader: render(template.preheader),
    body: render(template.bodyMarkdown),
    ctaLabel: render(template.ctaLabel),
  };
}

export function buildMailtoHref({
  email,
  subject,
  body,
}: {
  email: string;
  subject: string;
  body: string;
}) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(email)}?${params.toString()}`;
}
