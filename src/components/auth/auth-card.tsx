import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";

export interface AuthCardProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center justify-center gap-2">
          <BrandMark />
          <span className="text-sm font-semibold text-neutral-950">AI-BOS</span>
        </Link>

        <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-1 text-center">
            <h1 className="text-xl font-semibold text-neutral-950">{title}</h1>
            {description && <p className="text-sm text-neutral-600">{description}</p>}
          </div>
          {children}
        </div>

        {footer && <div className="text-center text-sm text-neutral-600">{footer}</div>}
      </div>
    </div>
  );
}
