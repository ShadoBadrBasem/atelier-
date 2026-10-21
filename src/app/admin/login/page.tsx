import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { Logo } from "@/components/Logo";
import { Field, btnCls, inputCls } from "@/components/ui";

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
    <main className="at-login">
      <div className="at-login-card">
        <Logo size={180} priority />
        <form action={login} className="flex w-full flex-col gap-3">
          <Field label="Email">
            <input name="email" type="email" required autoComplete="username" className={inputCls} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
          </Field>
          {error && <p role="alert" className="text-sm text-burnt">Incorrect email or password.</p>}
          <button className={`${btnCls} mt-2 w-full`}>Enter the Atelier</button>
        </form>
      </div>
    </main>
  );
}
