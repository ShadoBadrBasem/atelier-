import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { Logo } from "@/components/Logo";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    });
  } catch (e) {
    if (e instanceof AuthError) redirect("/admin/login?error=1");
    throw e;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await auth()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-4">
      <Logo size={180} priority />
      <form action={login} className="flex w-full flex-col gap-3">
        <input name="email" type="email" required autoComplete="username" placeholder="Email"
          className="border border-olive/60 bg-transparent px-3 py-3" />
        <input name="password" type="password" required autoComplete="current-password" placeholder="Password"
          className="border border-olive/60 bg-transparent px-3 py-3" />
        {error && <p role="alert" className="text-sm text-burnt">Incorrect email or password.</p>}
        <button className="bg-oxblood px-4 py-3 text-sm uppercase tracking-[0.25em] text-cream">
          Enter the Atelier
        </button>
      </form>
    </main>
  );
}
