import { BrandLogo } from "@/components/brand-logo";
import { getAdminLocale } from "@/lib/admin-locale";
import { requestAccountDeletion } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const [{ error, status }, locale] = await Promise.all([
    searchParams,
    getAdminLocale(),
  ]);
  const isArabic = locale === "ar";
  const success = status === "requested";

  return (
    <main className="shell admin-login-page" dir={isArabic ? "rtl" : "ltr"}>
      <header className="topbar admin-login-topbar">
        <BrandLogo width={126} suffix="ZinGo" />
      </header>

      <section className="welcome admin-login-content" lang={locale}>
        <p className="eyebrow">
          {isArabic ? "طلب حذف الحساب" : "SUPPRESSION DE COMPTE"}
        </p>
        <h1>{isArabic ? "حذف حسابك" : "Supprimer mon compte"}</h1>
        <p className="description">
          {isArabic
            ? "أدخل البريد الإلكتروني وكلمة المرور للتحقق من ملكية الحساب. يشترط وجود طلب حذف معلّق خاص بالحساب قبل تنفيذ الإجراء."
            : "Saisissez l’adresse e-mail et le mot de passe pour vérifier le compte. Une demande de suppression en attente, créée pour ce même compte, est nécessaire avant le traitement."}
        </p>

        {success ? (
          <p className="status" role="status">
            {isArabic
              ? "تم التحقق من الحساب وتنفيذ إجراء إخفاء البيانات وإلغاء صلاحيات الدخول الحالية."
              : "Le compte a été vérifié et la procédure actuelle d’anonymisation et de retrait des accès applicatifs a été exécutée."}
          </p>
        ) : null}

        {error ? (
          <p className="status" role="alert">
            {isArabic
              ? "لا يمكن التحقق من ملكية الحساب في هذه اللحظة. لا يكشف النظام ما إذا كان البريد الإلكتروني موجودًا."
              : "Nous n’avons pas pu vérifier la possession de ce compte pour le moment. Le système ne révèle pas si l’e-mail appartient à un compte existant."}
          </p>
        ) : null}

        <form action={requestAccountDeletion} className="login-form">
          <label>
            {isArabic ? "البريد الإلكتروني" : "Adresse e-mail"}
            <input
              autoComplete="username"
              dir="ltr"
              name="email"
              required
              type="email"
            />
          </label>
          <label>
            {isArabic ? "كلمة المرور" : "Mot de passe"}
            <input
              autoComplete="current-password"
              dir="ltr"
              name="password"
              required
              type="password"
            />
          </label>
          <label>
            <input name="confirm" type="checkbox" value="true" required />
            {isArabic
              ? "أؤكد فهمي أن هذا الإجراء يزيل بياناتي الشخصية ويُبقي سجلات التشغيل والمالية اللازمة."
              : "Je comprends que cette action anonymise mes données personnelles et conserve les traces techniques et financières nécessaires."}
          </label>
          <button type="submit">
            {isArabic ? "إرسال طلب الحذف" : "Envoyer la demande de suppression"}
          </button>
        </form>

        <p className="description">
          {isArabic
            ? "لا تحذف العملية الحالية هوية Supabase Auth أو ملفات إثبات الدفع المخزنة. وتُبقي سجلات الحجوزات والاشتراكات والتدقيق وبعض بيانات المواقع مرتبطة بالسجلات التشغيلية. لا يعني ظهور رسالة النجاح محو كل البيانات."
            : "La procédure actuelle ne supprime ni l’identité Supabase Auth ni les fichiers de preuve de paiement stockés. Elle conserve les historiques de réservations, d’abonnements et d’audit ainsi que certaines données de localisation liées aux dossiers opérationnels. Le message de réussite ne signifie pas un effacement intégral."}
        </p>
      </section>
    </main>
  );
}
