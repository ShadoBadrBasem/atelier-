import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { NavLinks } from "@/components/NavLinks";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="mx-auto min-h-dvh max-w-6xl md:flex">
      <aside className="hidden w-52 shrink-0 flex-col gap-1 border-e border-olive/40 p-4 md:flex">
        <span className="mb-4 font-display text-lg uppercase tracking-[0.3em]">The Atelier</span>
        <NavLinks variant="side" />
        <form
          className="mt-auto"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button className="text-sm underline">Sign out</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1 px-4 pb-24 md:pb-8">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-olive/40 bg-cream pb-[env(safe-area-inset-bottom)] md:hidden">
        <NavLinks variant="bottom" />
      </nav>
    </div>
  );
}
