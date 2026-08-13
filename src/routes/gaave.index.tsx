import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useIssues } from "@/hooks/useIssues";
import { VILLAGES, toMarathiDigits } from "@/lib/gp";

export const Route = createFileRoute("/gaave/")({
  head: () => ({
    meta: [
      { title: "आमची गावे | ग्रामपंचायत ढोरजळगाव" },
      {
        name: "description",
        content: "ढोरजळगाव, गरडवाडी, मालकापूर व आपेगाव या गावांतील समस्या व कामांची स्वतंत्र माहिती.",
      },
      { property: "og:title", content: "आमची गावे | ग्रामपंचायत ढोरजळगाव" },
      { property: "og:description", content: "प्रत्येक वाडी-वस्तीची स्वतंत्र माहिती एका ठिकाणी." },
    ],
  }),
  component: GaaveIndex,
});

function GaaveIndex() {
  const { data } = useIssues();

  return (
    <AppShell>
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> मुख्यपृष्ठ
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-foreground">आमची गावे</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ग्रामपंचायत ढोरजळगाव, ता. शेवगाव, जि. अहिल्यानगर
      </p>

      <div className="mt-5 space-y-3">
        {VILLAGES.map((v) => {
          const rows = (data ?? []).filter((r) => r.issue.village === v.name);
          const pending = rows.filter((r) => r.issue.status === "pending").length;
          const done = rows.filter((r) => r.issue.status === "completed").length;
          return (
            <Link
              key={v.name}
              to="/gaave/$village"
              params={{ village: v.name }}
              className="gp-card flex items-center gap-4 p-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <MapPin className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-bold text-foreground">{v.label}</span>
                <span className="block text-sm text-muted-foreground">
                  प्रलंबित {toMarathiDigits(pending)} · पूर्ण {toMarathiDigits(done)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}