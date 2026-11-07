"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOutAdmin } from "@/app/logout/actions";
import { getAdminMessages, type AdminLocale } from "@/i18n/messages";
import { AdminLocaleSwitcher } from "@/components/admin-locale-switcher";
import { BrandLogo } from "@/components/brand-logo";

type AdminAppShellProps = {
  children: React.ReactNode;
  email: string | null;
  locale: AdminLocale;
};

type AvailableRoute = {
  key:
    | "overview"
    | "customers"
    | "bookings"
    | "operations"
    | "communications"
    | "subscriptions";
  href: string;
};

const availableRoutes: AvailableRoute[] = [
  { key: "overview", href: "/admin" },
  { key: "customers", href: "/customers" },
  { key: "bookings", href: "/bookings" },
  { key: "operations", href: "/operations" },
  { key: "communications", href: "/communications" },
];

function isRouteActive(pathname: string, route: AvailableRoute) {
  if (route.href === "/admin") return pathname === "/admin";
  return pathname === route.href || pathname.startsWith(`${route.href}/`);
}

function NavigationIcon({ name }: { name: string }) {
  const common = {
    "aria-hidden": true as const,
    fill: "none",
    height: 20,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
    width: 20,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <rect height="7" rx="1.5" width="7" x="3" y="3" />
          <rect height="11" rx="1.5" width="7" x="14" y="3" />
          <rect height="7" rx="1.5" width="7" x="3" y="14" />
          <rect height="7" rx="1.5" width="7" x="14" y="14" />
        </svg>
      );
    case "customers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6V20" />
        </svg>
      );
    case "bookings":
      return (
        <svg {...common}>
          <rect height="16" rx="2" width="18" x="3" y="5" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6" />
        </svg>
      );
    case "operations":
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h17M8 15l3-4 3 2 5-7" />
          <circle cx="8" cy="15" r="1" />
          <circle cx="11" cy="11" r="1" />
          <circle cx="14" cy="13" r="1" />
          <circle cx="19" cy="6" r="1" />
        </svg>
      );
    case "communications":
      return (
        <svg {...common}>
          <path d="M4 5h16v11H8l-4 4V5Z" />
          <path d="M8 9h8M8 12h5" />
        </svg>
      );
    case "subscriptions":
      return (
        <svg {...common}>
          <rect height="14" rx="2" width="18" x="3" y="5" />
          <path d="M3 10h18M7 15h4M7 3v4M17 3v4" />
        </svg>
      );
    default:
      return null;
  }
}

function getCurrentNavigationLabel(
  pathname: string,
  messages: ReturnType<typeof getAdminMessages>,
) {
  if (pathname.startsWith("/customers")) return messages.customers;
  if (pathname.startsWith("/bookings")) return messages.bookings;
  if (pathname.startsWith("/operations")) return messages.operations;
  if (pathname.startsWith("/communications")) return messages.communications;
  if (pathname.startsWith("/subscriptions")) return messages.subscriptions;
  return messages.overview;
}

export function AdminAppShell({ children, email, locale }: AdminAppShellProps) {
  const pathname = usePathname();
  const messages = getAdminMessages(locale);
  const [drawerPathname, setDrawerPathname] = useState<string | null>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerOpen = drawerPathname === pathname;
  const closeDrawer = () => {
    setDrawerPathname(null);
    menuButtonRef.current?.focus();
  };
  useEffect(() => {
    if (!drawerOpen) return;

    const drawer = drawerRef.current;
    const mainContent = document.querySelector<HTMLElement>(".admin-main");
    const wasMainInert = mainContent?.inert ?? false;
    const firstItem = drawer?.querySelector<HTMLElement>(
      "a[href], button:not(:disabled)",
    );
    firstItem?.focus();
    if (mainContent) mainContent.inert = true;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerPathname(null);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !drawer) return;
      const focusableItems = Array.from(
        drawer.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)"),
      );
      if (!focusableItems.length) return;

      const first = focusableItems[0];
      const last = focusableItems[focusableItems.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      if (mainContent) mainContent.inert = wasMainInert;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setDrawerPathname(null);
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const mainNavigation = availableRoutes.map((route) => {
    const active = isRouteActive(pathname, route);
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={`admin-nav-link${active ? " is-active" : ""}`}
        href={route.href}
        key={route.href}
        onClick={() => setDrawerPathname(null)}
      >
        <NavigationIcon name={route.key} />
        <span>{messages[route.key]}</span>
      </Link>
    );
  });

  return (
    <div
      className={`admin-app${drawerOpen ? " drawer-open" : ""}`}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {drawerOpen && (
        <button
          aria-label={messages.closeNavigation}
          className="admin-drawer-backdrop"
          onClick={closeDrawer}
          tabIndex={-1}
          type="button"
        />
      )}
      <aside
        aria-label={messages.coreNavigation}
        aria-modal={drawerOpen ? "true" : undefined}
        className={`admin-sidebar${drawerOpen ? " is-open" : ""}`}
        ref={drawerRef}
        role={drawerOpen ? "dialog" : undefined}
      >
        <div className="admin-sidebar-brand">
          <Link
            aria-label="ZinGo Admin"
            className="admin-brand-link"
            href="/admin"
            onClick={() => setDrawerPathname(null)}
          >
            <BrandLogo className="admin-brand-logo" width={142} />
            <span className="admin-brand-divider" />
            <span className="admin-brand-label">{messages.admin}</span>
          </Link>
          <button
            aria-label={messages.closeNavigation}
            className="admin-drawer-close"
            onClick={closeDrawer}
            type="button"
          >
            <span aria-hidden="true" className="admin-close-glyph" />
          </button>
        </div>

        <nav
          aria-label={messages.coreNavigation}
          className="admin-nav"
          id="admin-primary-navigation"
        >
          <span className="admin-nav-heading">{messages.coreNavigation}</span>
          {mainNavigation}
          <div className="admin-nav-separator" />
          <span className="admin-nav-heading">
            {messages.billingNavigation}
          </span>
          <Link
            aria-current={
              pathname.startsWith("/subscriptions") ? "page" : undefined
            }
            className={`admin-nav-link${
              pathname.startsWith("/subscriptions") ? " is-active" : ""
            }`}
            href="/subscriptions"
            onClick={() => setDrawerPathname(null)}
          >
            <NavigationIcon name="subscriptions" />
            <span>{messages.subscriptions}</span>
          </Link>
        </nav>

        <div className="admin-sidebar-account">
          <span className="admin-account-label">{messages.account}</span>
          <span className="admin-account-email" title={email ?? undefined}>
            {email ?? messages.admin}
          </span>
          <form action={signOutAdmin}>
            <button className="admin-signout-button" type="submit">
              <svg
                aria-hidden="true"
                className="admin-signout-icon admin-directional-icon"
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                width="18"
              >
                <path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
              </svg>
              {messages.signOut}
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            aria-controls="admin-primary-navigation"
            aria-expanded={drawerOpen}
            aria-label={
              drawerOpen ? messages.closeNavigation : messages.openNavigation
            }
            className="admin-menu-button"
            onClick={() =>
              setDrawerPathname((current) =>
                current === pathname ? null : pathname,
              )
            }
            ref={menuButtonRef}
            type="button"
          >
            <span aria-hidden="true" className="admin-menu-glyph" />
          </button>
          <div aria-label={messages.currentPage} className="admin-breadcrumb">
            <Link href="/admin">{messages.home}</Link>
            <span aria-hidden="true" className="admin-breadcrumb-separator">
              /
            </span>
            <span aria-current="page">
              {getCurrentNavigationLabel(pathname, messages)}
            </span>
          </div>
          <AdminLocaleSwitcher locale={locale} returnTo={pathname} />
        </header>

        <div
          className="admin-content"
          dir={locale === "ar" ? "rtl" : "ltr"}
          lang={locale}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
