import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
  activeStep: number;
  totalSteps?: number;
  steps?: { label: string; description?: string }[];
}

export function BasicStepper({ activeStep, totalSteps = 5, steps }: StepperProps) {
  const stepsArray = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const currentStepInfo = steps && steps[activeStep - 1];

  return (
    <div className="w-full flex flex-col items-center gap-3.5">
      {/* Circle Badges Row */}
      <div className="w-full flex items-center justify-between px-1">
        {stepsArray.map((stepNum, index) => {
          const isCompleted = activeStep > stepNum;
          const isActive = activeStep === stepNum;

          return (
            <React.Fragment key={stepNum}>
              <div className="flex items-center justify-center shrink-0">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300",
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : isActive
                      ? "bg-violet-600 text-white ring-4 ring-violet-500/20 shadow-lg shadow-violet-500/10"
                      : "bg-muted text-muted-foreground border border-muted-foreground/15"
                  )}
                >
                  {isCompleted ? <Check size={13} className="stroke-[3]" /> : stepNum}
                </div>
              </div>
              {index < stepsArray.length - 1 && (
                <div
                  className={cn(
                    "h-[2.5px] flex-1 rounded-full mx-1 sm:mx-2 transition-all duration-500",
                    isCompleted ? "bg-emerald-500" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Centered current step description */}
      {currentStepInfo && (
        <div className="text-center transition-all duration-300 animate-fade-in">
          <p className="text-[10px] sm:text-xs font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest leading-none">
            {currentStepInfo.label}
          </p>
          {currentStepInfo.description && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 font-semibold leading-none">
              {currentStepInfo.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}