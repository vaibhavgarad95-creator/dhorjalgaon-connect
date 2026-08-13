import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, MessageSquarePlus, ListChecks, Lightbulb, MapPin, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ANNOUNCEMENT_KIND, SARPANCH, VILLAGES, formatDate, toMarathiDigits } from "@/lib/gp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "मुख्य पृष्ठ | ग्रामपंचायत ढोरजळगाव" },
      {
        name: "description",
        content:
          "ढोरजळगाव ग्रामपंचायतीच्या अधिकृत सूचना, योजना व ग्रामसभा माहिती एकाच ठिकाणी – गरडवाडी, मलकापूर, आपेगाव सह.",
      },
      { property: "og:title", content: "मुख्य पृष्ठ | ग्रामपंचायत ढोरजळगाव" },
      {
        property: "og:description",
        content: "अधिकृत सूचना, योजना, ग्रामसभा व गावातील कामांची पारदर्शक माहिती.",
      },
    ],
  }),
  component: Index,
});

const QUICK = [
  { to: "/samasya", label: "समस्या नोंदवा", icon: MessageSquarePlus, tone: "bg-pending text-pending-foreground" },
  { to: "/sthiti", label: "सद्यस्थिती पहा", icon: ListChecks, tone: "bg-progress text-progress-foreground" },
  { to: "/kalpana", label: "नवीन कल्पना", icon: Lightbulb, tone: "bg-done text-done-foreground" },
  { to: "/gaave", label: "आपले गाव", icon: MapPin, tone: "bg-accent text-accent-foreground" },
] as const;

function Index() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["issue-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("issues").select("status");
      if (error) throw error;
      return {
        pending: data.filter((d) => d.status === "pending").length,
        in_progress: data.filter((d) => d.status === "in_progress").length,
        completed: data.filter((d) => d.status === "completed").length,
      };
    },
  });

  return (
    <AppShell>
      <section className="gp-card overflow-hidden">
        <div className="bg-primary px-5 py-6 text-primary-foreground">
          <p className="text-sm opacity-90">आपले हार्दिक स्वागत</p>
          <h1 className="mt-1 text-2xl font-bold">डिजिटल ग्राम सेवा</h1>
          <p className="mt-2 text-sm opacity-90">सरपंच – {SARPANCH}</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          {(
            [
              ["प्रलंबित", counts?.pending ?? 0, "text-pending"],
              ["सुरू", counts?.in_progress ?? 0, "text-progress"],
              ["पूर्ण", counts?.completed ?? 0, "text-done"],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label} className="px-2 py-4 text-center">
              <p className={`text-2xl font-bold ${tone}`}>{toMarathiDigits(value)}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className="gp-card flex flex-col gap-3 p-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${q.tone}`}>
              <q.icon className="h-6 w-6" />
            </span>
            <span className="text-base font-semibold text-foreground">{q.label}</span>
          </Link>
        ))}
      </section>

      <section className="mt-7">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Megaphone className="h-6 w-6 text-brand" /> सूचना फलक
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">अधिकृत सूचना, योजना व ग्रामसभा</p>

        <div className="mt-4 space-y-3">
          {isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted" />}
          {announcements?.length === 0 && (
            <p className="gp-card p-4 text-sm text-muted-foreground">सध्या कोणतीही सूचना नाही.</p>
          )}
          {announcements?.map((a) => (
            <article key={a.id} className="gp-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {ANNOUNCEMENT_KIND[a.kind] ?? a.kind}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {a.village}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-foreground">{a.title}</h3>
              <p className="mt-1 whitespace-pre-line text-[15px] text-foreground/85">{a.body}</p>
              {a.event_date && (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand">
                  <CalendarDays className="h-4 w-4" /> दिनांक: {formatDate(a.event_date)}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-xl font-bold text-foreground">ग्रामपंचायत अंतर्गत गावे</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {VILLAGES.map((v) => (
            <Link
              key={v.name}
              to="/gaave/$village"
              params={{ village: v.name }}
              className="gp-card p-4"
            >
              <p className="text-base font-bold text-foreground">{v.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{v.note}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
