import { headers } from "next/headers";
import { authorizeAdmin } from "./admin-auth";

export async function requireAdmin(): Promise<void> {
  if (!authorizeAdmin(await headers())) throw new Error("Administrator authentication required");
}
