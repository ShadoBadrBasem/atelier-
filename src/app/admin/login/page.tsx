import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { Logo } from "@/components/Logo";
import { Field, btnCls, inputCls } from "@/components/ui";
import { clientIp, loginThrottle } from "@/lib/loginThrottle";

async function login(formData: FormData) {
  "use server";
  const ip = clientIp(await headers());
  if (loginThrottle.blockedFor(ip) > 0) redirect("/admin/login?error=locked");
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      loginThrottle.fail(ip);
      redirect("/admin/login?error=1");
    }
    loginThrottle.succeed(ip); // signIn signals success by throwing its redirect
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
          {error && (
            <p role="alert" className="text-sm text-burnt">
              {error === "locked" ? "Too many attempts. Please wait 15 minutes and try again." : "Incorrect email or password."}
            </p>
          )}
          <button className={`${btnCls} mt-2 w-full`}>Enter the Atelier</button>
        </form>
      </div>
    </main>
  );
}
