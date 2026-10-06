import { NavShell } from "@/components/shared/nav-shell";
import { ImpersonationBanner } from "@/components/shared/impersonation-banner";
import { ImpersonationProvider } from "@/lib/impersonation-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ImpersonationProvider>
      <ImpersonationBanner />
      <NavShell>{children}</NavShell>
    </ImpersonationProvider>
  );
}