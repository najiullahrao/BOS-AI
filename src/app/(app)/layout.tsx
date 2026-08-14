import { NavShell } from "@/components/shared/nav-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <NavShell>{children}</NavShell>;
}
