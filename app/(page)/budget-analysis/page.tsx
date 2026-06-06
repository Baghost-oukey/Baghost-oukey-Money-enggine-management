"use client";
import { div } from "motion/react-client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React from "react";
import DynamicInput  from "@/components/inputState";

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

export const budgetaAnalysis = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <div>
        <div className="mt-10 mx-10">
          <h1 className="text-4xl font-bold">Budget Analisis</h1>
          <span className="text-sm text-muted-foreground font-light">
            Analisis keuangan Anda dengan bantuan AI dan dapatkan rekomendasi
            personal
          </span>
        </div>

        {/* Container Input */}
        <div>
          <div className="shadow-input mx-7 w-full max-w-md rounded-none bg-white mt-10 md:rounded-2xl md:p-3 dark:bg-black">
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
              Masukkan Keuangan Anda untuk Analisis
            </h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300 font-light">
              Silakan masukkan informasi keuangan Anda di bawah ini untuk
              memulai analisis.
            </p>

            <form className="my-8" onSubmit={handleSubmit}>
              <LabelInputContainer>
                <Label htmlFor="firstname">Budget Bulanan Anda</Label>
                <Input
                  id="budgetBulanan"
                  placeholder="Masukkan Budget Bulanan Anda"
                  type="number"
                />
              </LabelInputContainer>

              <LabelInputContainer className="mt-5">
                <Label htmlFor="lastname">Apa Yang Ingin Anda Capai ?</Label>
                <Input
                  id="targetGoals"
                  placeholder="Masukkan Target"
                  type="text"
                  className="h-20"
                />
              </LabelInputContainer>
              <LabelInputContainer className="mt-5">
                <Label htmlFor="firstname">Berapa Nilai Target Anda ?</Label>
                <Input
                  id="targetValue"
                  placeholder="Masukkan Nilai Target"
                  type="number"
                />
              </LabelInputContainer>

              <LabelInputContainer className="mt-5">
                <Label htmlFor="firstname">
                  Kapan Target anda Akan Anda Capai ?
                </Label>
                <Input
                  id="dateAwal"
                  placeholder="Target Awal Mulai"
                  type="date"
                />
              </LabelInputContainer>
              {/* <LabelInputContainer className="mb-4">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  placeholder="projectmayhem@fc.com"
                  type="email"
                />
              </LabelInputContainer> */}
              <LabelInputContainer className="mt-5">
                <Label>Daftar Pengeluaran</Label>
                <DynamicInput />
              </LabelInputContainer>
              <button
                className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] mt-10"
                type="submit"
              >
                Analisis Sekarang
                <BottomGradient />
              </button>

              <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default budgetaAnalysis;
