"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isPlatformAdminEnabled, usePlatformAdmin } from "@/lib/use-platform-admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [adminEnabled] = usePlatformAdmin();
  const router = useRouter();
  const initialChecked = useRef(false);

  useEffect(() => {
    if (!initialChecked.current) {
      initialChecked.current = true;
      if (!isPlatformAdminEnabled()) {
        router.replace("/dashboard");
      }
      return;
    }
    if (!adminEnabled) {
      router.replace("/dashboard");
    }
  }, [adminEnabled, router]);

  if (!adminEnabled) return null;
  return <>{children}</>;
}