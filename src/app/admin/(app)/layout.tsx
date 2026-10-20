import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-4">
      <header className="flex items-center justify-between border-b border-olive/40 pb-3">
        <span className="font-display text-lg uppercase tracking-[0.3em]">The Atelier</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button className="text-sm underline">Sign out</button>
        </form>
      </header>
      {children}
    </div>
  );
}
