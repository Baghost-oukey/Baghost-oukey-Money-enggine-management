"use server";

import { prisma } from "@/lib/prisma";

export async function createDecision(data: {
  userId: string;

  monthlyBudget: number;

  targetName: string;

  targetValue: number;

  targetDate?: Date;

  expenses: {
    name: string;
    amount: number;
  }[];
}) {
  const decision =
    await prisma.decisionAnalysis.create({
      data: {
        userId: data.userId,

        monthlyBudget: data.monthlyBudget,

        targetName: data.targetName,

        targetValue: data.targetValue,

        targetDate: data.targetDate,

        expenses: {
          create: data.expenses,
        },
      },

      include: {
        expenses: true,
      },
    });

  return decision;
}