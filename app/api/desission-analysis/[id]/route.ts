import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const data = await prisma.decisionAnalysis.findUnique({
    where: {
      id: params.id,
    },
    include: {
      expenses: true,
    },
  });

  if (!data) {
    return NextResponse.json(
      { message: "Data tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
