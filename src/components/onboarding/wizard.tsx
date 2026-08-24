"use client";

import { useState } from "react";
import type { PlanKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { StepTemplate } from "@/components/onboarding/step-template";
import { StepDish } from "@/components/onboarding/step-dish";
import { StepReady } from "@/components/onboarding/step-ready";

const STEPS = [
  { n: 1, label: "Şablon" },
  { n: 2, label: "İlk Yemek" },
  { n: 3, label: "Hazır" },
] as const;

export function OnboardingWizard({
  businessName,
  initialPublished,
  aiEnhanceEnabled,
  plan,
}: {
  businessName: string;
  initialPublished: boolean;
  aiEnhanceEnabled: boolean;
  plan: PlanKey;
}) {
  const [step, setStep] = useState(1);

  const goNext = () => setStep((s) => Math.min(3, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="space-y-8">
      <header className="space-y-1 text-center">
        <p className="text-sm text-muted-foreground">{businessName}</p>
        <h1 className="text-2xl font-semibold">Menünü hazırlayalım</h1>
      </header>

      <ProgressBar current={step} />

      {step === 1 && <StepTemplate onNext={goNext} plan={plan} />}
      {step === 2 && (
        <StepDish
          onNext={goNext}
          onBack={goBack}
          aiEnhanceEnabled={aiEnhanceEnabled}
        />
      )}
      {step === 3 && (
        <StepReady onBack={goBack} initialPublished={initialPublished} />
      )}
    </div>
  );
}

function ProgressBar({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <li key={s.n} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-primary/20 text-primary",
                  !active && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? "✓" : s.n}
              </span>
              <span
                className={cn(
                  "text-xs",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mb-5 h-px w-8 sm:w-16",
                  current > s.n ? "bg-primary/40" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
