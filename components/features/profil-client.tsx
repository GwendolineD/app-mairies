"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { submitUserReport } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

type TabId = "activity" | "annonces" | "initiatives" | "participations" | "info";

const TABS: { id: TabId; label: string }[] = [
  { id: "activity", label: "Activité" },
  { id: "annonces", label: "Annonces" },
  { id: "initiatives", label: "Initiatives" },
  { id: "participations", label: "Participations" },
  { id: "info", label: "Informations" },
];

type Props = {
  displayName: string;
  bio: string;
  avatarUrl: string;
  stats: {
    announcements: number;
    initiatives: number;
    participations: number;
  };
};

export function ProfilClient({ displayName, bio, avatarUrl, stats }: Props) {
  const [tab, setTab] = useState<TabId>("info");
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Annonces" value={stats.announcements} />
        <StatCard label="Initiatives" value={stats.initiatives} />
        <StatCard label="Participations" value={stats.participations} />
        <StatCard label="Commune" value="—" />
      </div>

      <nav className="flex gap-2 overflow-x-auto border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 cursor-pointer rounded-sm px-3 py-1.5 text-sm font-semibold",
              tab === t.id ? "bg-soft-pink text-purple" : "text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "info" ? (
        <Card className="space-y-4 p-5">
          {!editing ? (
            <>
              <p className="text-xl font-semibold text-text">{displayName}</p>
              <p className="text-sm text-muted">{bio || "Pas de bio pour le moment."}</p>
              <Button type="button" onClick={() => setEditing(true)}>
                Éditer mon profil
              </Button>
            </>
          ) : (
            <form action={updateProfile} className="space-y-3">
              <FormField label="Pseudo affiché">
                <Input name="displayName" defaultValue={displayName} required />
              </FormField>
              <FormField label="Bio">
                <Textarea name="bio" rows={4} defaultValue={bio} />
              </FormField>
              <FormField label="Avatar · URL">
                <Input name="avatarUrl" type="url" defaultValue={avatarUrl} />
              </FormField>
              <div className="flex gap-2">
                <Button type="submit">Enregistrer</Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </Card>
      ) : (
        <Card className="p-5 text-sm text-muted">
          Contenu « {TABS.find((t) => t.id === tab)?.label} » — prochainement enrichi.
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Card>
  );
}

export function ReportUserForm({ reportedUserId }: { reportedUserId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="danger" className="text-xs" onClick={() => setOpen(true)}>
        Signaler cet utilisateur
      </Button>
    );
  }

  return (
    <form action={submitUserReport} className="space-y-2 rounded-2xl border border-coral/30 p-4">
      <input type="hidden" name="reportedUserId" value={reportedUserId} />
      <FormField label="Motif du signalement">
        <Textarea name="reason" rows={3} required minLength={10} />
      </FormField>
      <Button type="submit" variant="danger" className="text-xs">
        Envoyer le signalement
      </Button>
    </form>
  );
}
