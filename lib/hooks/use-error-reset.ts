import { useRouter } from "next/navigation";
import { useCallback } from "react";

/** Re-render the failed segment and refresh server data. */
export function useErrorReset(reset: () => void) {
  const router = useRouter();
  return useCallback(() => {
    reset();
    router.refresh();
  }, [reset, router]);
}
