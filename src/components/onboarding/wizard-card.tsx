import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

export interface WizardCardProps {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function WizardCard({ step, totalSteps, title, description, children }: WizardCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <BrandMark />
          <span className="text-sm font-semibold text-neutral-950">AI-BOS</span>
        </div>

        <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    index + 1 <= step ? "bg-primary" : "bg-neutral-200"
                  )}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-neutral-600">
                Step {step} of {totalSteps}
              </p>
              <h1 className="mt-1 text-xl font-semibold text-neutral-950">{title}</h1>
              {description && <p className="mt-1 text-sm text-neutral-600">{description}</p>}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
