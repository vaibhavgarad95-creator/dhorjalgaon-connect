import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageSquarePlus, ListChecks, Lightbulb, MapPin, Shield, LogIn, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GRAM_PANCHAYAT, TALUKA, DISTRICT } from "@/lib/gp";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "मुख्य", icon: Home },
  { to: "/samasya", label: "नोंदवा", icon: MessageSquarePlus },
  { to: "/sthiti", label: "सद्यस्थिती", icon: ListChecks },
  { to: "/kalpana", label: "कल्पना", icon: Lightbulb },
  { to: "/gaave", label: "गावे", icon: MapPin },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col gp-surface">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              ग्रा
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-bold text-foreground">
                {GRAM_PANCHAYAT}
              </span>
              <span className="block text-xs text-muted-foreground">
                ता. {TALUKA}, जि. {DISTRICT}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/prashasan"
                aria-label="प्रशासन"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground"
              >
                <Shield className="h-5 w-5" />
              </Link>
            )}
            {user ? (
              <button
                onClick={() => void signOut()}
                aria-label="बाहेर पडा"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : (
              <Link
                to="/pravesh"
                aria-label="प्रवेश"
                className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <LogIn className="h-4 w-4" /> प्रवेश
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5">{children}</main>

      <SiteFooter />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/98 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-6 w-6", active && "scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}