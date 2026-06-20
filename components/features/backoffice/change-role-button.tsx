"use client";

import { useState } from "react";
import {
  ChangeRoleModal,
  type ChangeRoleMembership,
} from "@/components/features/backoffice/change-role-modal";
import { Button } from "@/components/ui/button";

type Props = ChangeRoleMembership & {
  currentUserIsPlatformAdmin: boolean;
  size?: "xs" | "sm";
  className?: string;
};

export function ChangeRoleButton({
  currentUserIsPlatformAdmin,
  size = "xs",
  className,
  ...membership
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        Changer le rôle
      </Button>

      <ChangeRoleModal
        open={open}
        onClose={() => setOpen(false)}
        membership={membership}
        currentUserIsPlatformAdmin={currentUserIsPlatformAdmin}
      />
    </>
  );
}
