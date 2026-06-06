"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React from "react";
import DynamicInput from "@/components/inputState";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

type Expense = {
  description: string;
  amount: number;
};

export const budgetaAnalysis = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const isEmpty =
    !budget && !target && !targetValue && !targetDate && expenses.length === 0;
  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <div className="mt-10 mx-10">
          <h1 className="text-4xl font-bold">Keputusan Keuangan</h1>
          <span className="text-sm text-muted-foreground font-light">
            Analisis keuangan Anda dengan bantuan AI dan dapatkan rekomendasi
            personal
          </span>
        </div>

        {/* Container Input */}
        <div>
          <div className="shadow-input mx-7 w-full max-w-2xl rounded-none bg-white mt-10 md:rounded-2xl md:p-3 dark:bg-black">
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
              Masukkan Keuangan Anda untuk Analisis
            </h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300 font-light">
              Silakan masukkan informasi keuangan Anda di bawah ini untuk
              memulai analisis.
            </p>

            <form className="mt-8" onSubmit={handleSubmit}>
              <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-6 w-full">
                <LabelInputContainer>
                  <Label htmlFor="targetGoals">Budget Bulanan Anda</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      Rp.
                    </span>

                    <Input
                      id="budgetBulanan"
                      type="number"
                      placeholder="0"
                      className="pl-10"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </LabelInputContainer>

                <LabelInputContainer className="mt-5">
                  <Label htmlFor="targetGoals">
                    Apa Yang Ingin Anda Capai ?
                  </Label>
                  <Input
                    id="targetGoals"
                    placeholder="Apa yang ingin Anda capai dengan keuangan Anda?"
                    type="text"
                    className="h-20"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </LabelInputContainer>

                <LabelInputContainer className="mt-5">
                  <Label htmlFor="firstname">Berapa Nilai Target Anda ?</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      Rp.
                    </span>
                    <Input
                      id="targetValue"
                      placeholder="0"
                      type="number"
                      className="pl-10"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                    />
                  </div>
                </LabelInputContainer>

                <LabelInputContainer className="mt-5">
                  <Label htmlFor="firstname">
                    Kapan Anda Ingin Mencapai Target Ini ?
                  </Label>
                  <Input
                    id="dateAwal"
                    placeholder="Target Awal Mulai"
                    value={targetDate}
                    type="date"
                    onChange={(e) => setTargetDate(e.target.value)}
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
                  <DynamicInput expenses={expenses} setExpenses={setExpenses} />
                </LabelInputContainer>
                <button
                  className="group/btn relative block h-10 w-full rounded-md bg-blue-600 text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] mt-10"
                  type="submit"
                >
                  Analisis Sekarang
                  <BottomGradient />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border bg-card p-4 shadow-sm mt-10"
          >
            <h2 className="text-sm font-semibold ml-4">Ringkasan</h2>

            <p className="text-xs text-muted-foreground ml-4">
              Data yang akan dianalisis AI
            </p>

            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Isi formulir untuk melihat ringkasan
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            layout
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="rounded-2xl border bg-card p-4 shadow-sm mt-10"
          >
            <div className="mb-3">
              <h2 className="text-sm font-semibold">Ringkasan</h2>

              <p className="text-xs text-muted-foreground">
                Data yang akan dianalisis AI
              </p>
            </div>

            <motion.div layout className="space-y-2 text-sm">
              {budget && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">Budget</span>

                  <span className="font-medium">
                    Rp {Number(budget).toLocaleString("id-ID")}
                  </span>
                </motion.div>
              )}

              {target && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">Target</span>

                  <span className="font-medium">{target}</span>
                </motion.div>
              )}

              {targetValue && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">Nominal</span>

                  <span className="font-medium">
                    Rp {Number(targetValue).toLocaleString("id-ID")}
                  </span>
                </motion.div>
              )}

              {targetDate && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">Deadline</span>

                  <span className="font-medium">
                    {new Date(targetDate).toLocaleDateString("id-ID")}
                  </span>
                </motion.div>
              )}

              {expenses.length > 0 && (
                <motion.div layout className="mt-4 rounded-xl border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Pengeluaran</h3>

                    <span className="text-xs text-muted-foreground">
                      {expenses.length} item
                    </span>
                  </div>

                  <AnimatePresence>
                    {expenses.map((expense, index) => (
                      <motion.div
                        key={`${expense.description}-${index}`}
                        layout
                        initial={{
                          opacity: 0,
                          x: -20,
                          scale: 0.95,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          x: 20,
                          scale: 0.95,
                        }}
                        transition={{
                          duration: 0.2,
                        }}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="truncate text-sm">
                          {expense.description}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Rp {expense.amount.toLocaleString("id-ID")}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeExpense(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default budgetaAnalysis;
