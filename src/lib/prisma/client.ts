import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function prismaClientFactory() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  client.$use(async (params, next) => {
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await next(params);
      } catch (err: any) {
        const isConnectionError =
          err?.message?.includes("Can't reach database") ||
          err?.message?.includes("Connection pool timeout") ||
          err?.message?.includes("database connection") ||
          err?.message?.includes("Connection terminated") ||
          err?.message?.includes("Closed") ||
          err?.code === "P1001" ||
          err?.code === "P1002" ||
          err?.code === "P2024";
        if (isConnectionError && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        throw err;
      }
    }
  });

  return client;
}

export const prisma =
  globalForPrisma.prisma ??
  prismaClientFactory();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
