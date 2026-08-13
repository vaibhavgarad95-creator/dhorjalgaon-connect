import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { IssueCard } from "@/components/IssueCard";
import { useIssues, useVote } from "@/hooks/useIssues";
import { formatMoney, toMarathiDigits, VILLAGES } from "@/lib/gp";

export const Route = createFileRoute("/sthiti")({
  head: () => ({
    meta: [
      { title: "तक्रारींची सद्यस्थिती | ग्रामपंचायत ढोरजळगाव" },
      {
        name: "description",
        content:
          "प्रलंबित समस्या, सुरू असलेली कामे आणि पूर्ण झालेल्या कामांचा खर्चासह पारदर्शक लेखाजोखा पहा.",
      },
      { property: "og:title", content: "तक्रारींची सद्यस्थिती | ग्रामपंचायत ढोरजळगाव" },
      { property: "og:description", content: "गावातील कामांची स्थिती व खर्चाचा जाहीर लेखाजोखा." },
    ],
  }),
  component: SthitiPage,
});

const TABS = [
  { key: "pending", label: "प्रलंबित समस्या", tone: "data-[on=true]:bg-pending data-[on=true]:text-pending-foreground" },
  { key: "in_progress", label: "सुरू असलेली कामे", tone: "data-[on=true]:bg-progress data-[on=true]:text-progress-foreground" },
  { key: "completed", label: "सोडवलेल्या समस्या", tone: "data-[on=true]:bg-done data-[on=true]:text-done-foreground" },
] as const;

function SthitiPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");
  const [village, setVillage] = useState<string>("");
  const { data, isLoading } = useIssues(village || undefined);
  const vote = useVote();

  const rows = (data ?? []).filter((r) => r.issue.status === tab);
  const sorted =
    tab === "pending" ? [...rows].sort((a, b) => b.votes - a.votes) : rows;
  const totalSpent = (data ?? [])
    .filter((r) => r.issue.status === "completed")
    .reduce((sum, r) => sum + Number(r.issue.amount_spent ?? 0), 0);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">विविध तक्रारींची सद्यस्थिती</h1>
      <p className="mt-1 text-sm text-muted-foreground">थेट व अद्ययावत माहिती</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setVillage("")}
          data-on={village === ""}
          className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold data-[on=true]:bg-primary data-[on=true]:text-primary-foreground"
        >
          सर्व गावे
        </button>
        {VILLAGES.map((v) => (
          <button
            key={v.name}
            onClick={() => setVillage(v.name)}
            data-on={village === v.name}
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold data-[on=true]:bg-primary data-[on=true]:text-primary-foreground"
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-on={tab === t.key}
            className={`rounded-xl border border-border bg-card px-2 py-3 text-sm font-bold leading-tight ${t.tone}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "completed" && (
        <div className="mt-4 rounded-xl bg-done px-4 py-3 font-bold text-done-foreground">
          एकूण खर्च झालेला निधी: {formatMoney(totalSpent)}
          <span className="ml-2 text-sm font-medium opacity-90">
            ({toMarathiDigits(sorted.length)} कामे)
          </span>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {isLoading && <div className="h-40 animate-pulse rounded-xl bg-muted" />}
        {!isLoading && sorted.length === 0 && (
          <p className="gp-card p-5 text-center text-sm text-muted-foreground">
            या विभागात सध्या कोणतीही नोंद नाही.
          </p>
        )}
        {sorted.map((r) => (
          <IssueCard
            key={r.issue.id}
            issue={r.issue}
            votes={r.votes}
            hasVoted={r.hasVoted}
            onVote={tab === "completed" ? undefined : () => void vote(r.issue.id, r.hasVoted)}
            showAudit={tab === "completed"}
          />
        ))}
      </div>
    </AppShell>
  );
}