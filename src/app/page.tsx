import { BrandLogo } from "@/components/brand-logo";

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <BrandLogo width={126} suffix="Admin" />
        <span className="environment">Fondation</span>
      </header>
      <section className="welcome" aria-labelledby="welcome-title">
        <p className="eyebrow">ESPACE D’ADMINISTRATION</p>
        <h1 id="welcome-title">La fondation ZinGo est prête à évoluer.</h1>
        <p className="description">
          Cette base visuelle ne contient aucune donnée métier. Connectez-vous
          avec un compte auquel le rôle administrateur a été attribué par un
          opérateur autorisé.
        </p>
        <div className="status" role="status">
          <span className="status-dot" /> Accès métier disponible uniquement
          après vérification serveur
        </div>
        <p>
          <a href="/login">Accéder à la connexion administrateur</a>
        </p>
        <p>
          <a href="/delete-account">Demande de suppression de compte</a>
        </p>
      </section>
    </main>
  );
}
