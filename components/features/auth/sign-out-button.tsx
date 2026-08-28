"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Props = {
  redirectTo?: string;
};

export function SignOutButton({ redirectTo = "/" }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(redirectTo);
  };

  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={handleSignOut}
      disabled={pending}
    >
      <LogOut className="size-4" strokeWidth={2.25} aria-hidden />
      {pending ? "Déconnexion..." : "Se déconnecter"}
    </Button>
  );
}
