import dns from "node:dns";
import net from "node:net";
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { config } from "dotenv";
config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 10, // pool size — don't over-provision on small DB plans
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
const prisma = new PrismaClient({ adapter });

export default prisma;
