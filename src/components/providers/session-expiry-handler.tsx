"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

type SessionExpiredEvent = CustomEvent<{ returnPath: string }>;

export function SessionExpiryHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let isHandlingExpiry = false;

    function handleSessionExpired(event: Event) {
      if (isHandlingExpiry) return;
      isHandlingExpiry = true;
      const { returnPath } = (event as SessionExpiredEvent).detail;
      void queryClient.cancelQueries().finally(() => {
        queryClient.clear();
        router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
        router.refresh();
      });
    }

    function handleSessionRestored() {
      isHandlingExpiry = false;
    }

    window.addEventListener("doctor-tracker:session-expired", handleSessionExpired);
    window.addEventListener("doctor-tracker:session-restored", handleSessionRestored);
    return () => {
      window.removeEventListener("doctor-tracker:session-expired", handleSessionExpired);
      window.removeEventListener("doctor-tracker:session-restored", handleSessionRestored);
    };
  }, [queryClient, router]);

  return null;
}
