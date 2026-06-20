"use client";

import { Check, Info, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { changeMembershipRole } from "@/lib/actions/membership-role";
import {
  MEMBERSHIP_ROLE_OPTIONS,
  PLATFORM_ADMIN_LABEL,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import type { MembershipRole } from "@/lib/types";

export type ChangeRoleMembership = {
  membershipId: string;
  userId: string;
  communeId: string;
  role: MembershipRole;
  isPlatformAdmin: boolean;
  memberName?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  membership: ChangeRoleMembership;
  currentUserIsPlatformAdmin: boolean;
};

export function ChangeRoleModal({
  open,
  onClose,
  membership,
  currentUserIsPlatformAdmin,
}: Props) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<MembershipRole>(membership.role);
  const [selectedPlatformAdmin, setSelectedPlatformAdmin] = useState(
    membership.isPlatformAdmin,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setSelectedRole(membership.role);
    setSelectedPlatformAdmin(membership.isPlatformAdmin);
    setError(null);
  }, [open, membership]);

  const hasChanges =
    selectedRole !== membership.role ||
    (currentUserIsPlatformAdmin &&
      selectedPlatformAdmin !== membership.isPlatformAdmin);

  function handleClose() {
    if (isPending) return;
    onClose();
    setError(null);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await changeMembershipRole({
        membershipId: membership.membershipId,
        newRole: selectedRole,
        isPlatformAdmin: currentUserIsPlatformAdmin
          ? selectedPlatformAdmin
          : undefined,
      });

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      handleClose();
      router.refresh();
    });
  }

  const modalTitle = membership.memberName
    ? `Changer le rôle de ${membership.memberName}`
    : "Changer le rôle";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={modalTitle}
      closeDisabled={isPending}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isPending || !hasChanges}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Enregistrement…
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">Rôle dans la commune</p>
          <div className="space-y-2">
            {MEMBERSHIP_ROLE_OPTIONS.map((role) => (
              <RoleOptionCard
                key={role}
                selected={selectedRole === role}
                title={ROLE_LABELS[role]}
                description={ROLE_DESCRIPTIONS[role]}
                onClick={() => {
                  setSelectedRole(role);
                  setError(null);
                }}
              />
            ))}
          </div>
        </div>

        {currentUserIsPlatformAdmin ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text">Accès plateforme</p>
            <RoleOptionCard
              selected={selectedPlatformAdmin}
              title={PLATFORM_ADMIN_LABEL}
              description={ROLE_DESCRIPTIONS.platform_admin}
              onClick={() => {
                setSelectedPlatformAdmin((current) => !current);
                setError(null);
              }}
            />
          </div>
        ) : null}

        {error ? <p className="text-sm font-medium text-coral">{error}</p> : null}
      </div>
    </Modal>
  );
}

function RoleOptionCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] overflow-hidden rounded-lg border-2 transition",
        selected
          ? "border-purple bg-soft-pink shadow-sm"
          : "border-border bg-surface hover:border-purple/20",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-4 py-3 text-left"
      >
        {selected ? (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-purple text-white">
            <Check className="size-2.5" strokeWidth={3} aria-hidden />
          </span>
        ) : null}
        <p className="text-sm font-bold text-text">{title}</p>
      </button>

      <RoleInfoPopover title={title} description={description} />
    </div>
  );
}

function RoleInfoPopover({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Popover>
      <div className="aspect-square h-full min-h-full">
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label={`En savoir plus sur le rôle ${title}`}
              className="flex size-full cursor-pointer items-center justify-center border-l border-border/60 text-muted transition hover:bg-warm hover:text-text"
              onClick={(event) => event.stopPropagation()}
            >
              <Info className="size-4" aria-hidden />
            </button>
          }
        />
      </div>
      <PopoverContent
        side="left"
        align="center"
        sideOffset={8}
        className="max-w-xs rounded-sm p-3"
      >
        <p className="text-xs font-semibold text-text">{title}</p>
        <p className="mt-1 text-xs font-medium leading-4 text-muted">{description}</p>
      </PopoverContent>
    </Popover>
  );
}
