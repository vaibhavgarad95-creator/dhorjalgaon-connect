import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IssueCard } from "@/components/IssueCard";
import { useIssues, useVote } from "@/hooks/useIssues";
import { VILLAGES, formatMoney, toMarathiDigits } from "@/lib/gp";

export const Route = createFileRoute("/gaave/$village")({
  head: ({ params }) => {
    const label = VILLAGES.find((v) => v.name === params.village)?.label ?? params.village;
    return {
      meta: [
        { title: `${label} | ग्रामपंचायत ढोरजळगाव` },
        { name: "description", content: `${label} येथील समस्या, सुरू असलेली कामे व खर्चाची माहिती.` },
        { property: "og:title", content: `${label} | ग्रामपंचायत ढोरजळगाव` },
        { property: "og:description", content: `${label} येथील कामांचा पारदर्शक लेखाजोखा.` },
      ],
    };
  },
  component: VillagePage,
});

function VillagePage() {
  const { village } = Route.useParams();
  const label = VILLAGES.find((v) => v.name === village)?.label ?? village;
  const { data, isLoading } = useIssues(village);
  const vote = useVote();

  const rows = data ?? [];
  const spent = rows.reduce((s, r) => s + Number(r.issue.amount_spent ?? 0), 0);

  return (
    <AppShell>
      <Link to="/gaave" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> आमची गावे
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-foreground">{label}</h1>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-pending px-2 py-3 text-pending-foreground">
          <p className="text-xl font-bold">
            {toMarathiDigits(rows.filter((r) => r.issue.status === "pending").length)}
          </p>
          <p className="text-xs font-semibold">प्रलंबित</p>
        </div>
        <div className="rounded-xl bg-progress px-2 py-3 text-progress-foreground">
          <p className="text-xl font-bold">
            {toMarathiDigits(rows.filter((r) => r.issue.status === "in_progress").length)}
          </p>
          <p className="text-xs font-semibold">सुरू</p>
        </div>
        <div className="rounded-xl bg-done px-2 py-3 text-done-foreground">
          <p className="text-xl font-bold">
            {toMarathiDigits(rows.filter((r) => r.issue.status === "completed").length)}
          </p>
          <p className="text-xs font-semibold">पूर्ण</p>
        </div>
      </div>

      <p className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground">
        या गावातील एकूण खर्च: {formatMoney(spent)}
      </p>

      <div className="mt-5 space-y-4">
        {isLoading && <div className="h-40 animate-pulse rounded-xl bg-muted" />}
        {!isLoading && rows.length === 0 && (
          <p className="gp-card p-5 text-center text-sm text-muted-foreground">
            या गावातील अद्याप कोणतीही नोंद नाही.
          </p>
        )}
        {rows.map((r) => (
          <IssueCard
            key={r.issue.id}
            issue={r.issue}
            votes={r.votes}
            hasVoted={r.hasVoted}
            onVote={() => void vote(r.issue.id, r.hasVoted)}
            showAudit={r.issue.status === "completed"}
          />
        ))}
      </div>
    </AppShell>
  );
}