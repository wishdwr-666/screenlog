import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env" });

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/screenlog";

type DrizzleDb = ReturnType<typeof drizzle>;

let db: DrizzleDb | null = null;
let isConnected = false;

try {
  const client = postgres(connectionString, {
    max: 1,
    connect_timeout: 5,
  });

  db = drizzle(client);
  isConnected = true;

  console.log("✅ 数据库连接成功");
} catch (error: unknown) {
  console.warn("⚠️ 数据库连接失败，将使用模拟数据");
  if (error instanceof Error) {
    console.warn("错误:", error.message);
  }
}

export { db, isConnected };