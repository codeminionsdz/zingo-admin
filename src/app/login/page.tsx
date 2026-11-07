import { AdminLocaleSwitcher } from "@/components/admin-locale-switcher";
import { BrandLogo } from "@/components/brand-logo";
import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";
import { signInAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, locale] = await Promise.all([
    searchParams,
    getAdminLocale(),
  ]);
  const messages = getAdminMessages(locale);
  return (
    <main
      className="shell admin-login-page"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header className="topbar admin-login-topbar">
        <BrandLogo width={126} suffix="Admin" />
        <AdminLocaleSwitcher locale={locale} returnTo="/login" />
      </header>
      <section className="welcome admin-login-content" lang={locale}>
        <p className="eyebrow">{messages.loginEyebrow}</p>
        <h1>{messages.loginTitle}</h1>
        <p className="description">{messages.loginDescription}</p>
        {error && (
          <p className="status" role="alert">
            {error === "forbidden" ? messages.forbidden : messages.loginError}
          </p>
        )}
        <form action={signInAdmin} className="login-form">
          <label>
            {messages.email}
            <input
              autoComplete="username"
              dir="ltr"
              name="email"
              required
              type="email"
            />
          </label>
          <label>
            {messages.password}
            <input
              autoComplete="current-password"
              dir="ltr"
              name="password"
              required
              type="password"
            />
          </label>
          <button type="submit">{messages.signIn}</button>
        </form>
      </section>
    </main>
  );
}
