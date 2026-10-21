import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="at-shell">
      <aside className="at-side">
        <div className="at-brand">
          <Logo size={104} />
          <span className="at-brand-name">The Atelier</span>
        </div>
        <AdminNav variant="side" />
        <form
          className="mt-auto"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button className="at-signout">Sign out</button>
        </form>
      </aside>
      <div className="at-main">
        <div className="at-content">{children}</div>
      </div>
      <nav className="at-bottom">
        <AdminNav variant="bottom" />
      </nav>
    </div>
  );
}
