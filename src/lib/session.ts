import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Call at the top of every server action and admin route handler. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session.user;
}
