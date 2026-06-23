import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const plans = await prisma.budgetPlan.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  
  plans.forEach((p, idx) => {
    console.log(`Plan ${idx + 1} - ID: ${p.id}, Salary: ${p.monthlyBudget}, CreatedAt: ${p.createdAt.toISOString()}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
