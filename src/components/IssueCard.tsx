import { ArrowBigUp, MapPin, CalendarClock, IndianRupee } from "lucide-react";
import { StatusTag } from "@/components/StatusTag";
import { SignedImage } from "@/components/SignedImage";
import { categoryLabel, formatDate, formatMoney, toMarathiDigits, type IssueStatus } from "@/lib/gp";
import { cn } from "@/lib/utils";

export type IssueRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  village: string;
  photo_url: string | null;
  after_photo_url: string | null;
  location_text: string | null;
  is_anonymous: boolean;
  status: IssueStatus;
  expected_date: string | null;
  resolution_notes: string | null;
  amount_spent: number | string | null;
  created_at: string;
  reporterName?: string | null;
};

export function IssueCard({
  issue,
  votes,
  hasVoted,
  onVote,
  showAudit,
  children,
}: {
  issue: IssueRow;
  votes: number;
  hasVoted?: boolean;
  onVote?: () => void;
  showAudit?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article className="gp-card overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag status={issue.status} />
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {categoryLabel(issue.category)}
            </span>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {issue.village}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold leading-snug text-foreground">{issue.title}</h3>
          {issue.description && (
            <p className="mt-1 whitespace-pre-line text-[15px] text-foreground/80">{issue.description}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            नोंद: {issue.is_anonymous ? "गुप्त ग्रामस्थ" : (issue.reporterName || "ग्रामस्थ")} ·{" "}
            {formatDate(issue.created_at)}
          </p>
        </div>

        {onVote && (
          <button
            onClick={onVote}
            aria-label="समर्थन द्या"
            className={cn(
              "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border transition-colors",
              hasVoted
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground",
            )}
          >
            <ArrowBigUp className="h-6 w-6" />
            <span className="text-sm font-bold">{toMarathiDigits(votes)}</span>
          </button>
        )}
        {!onVote && (
          <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <ArrowBigUp className="h-6 w-6" />
            <span className="text-sm font-bold">{toMarathiDigits(votes)}</span>
          </div>
        )}
      </div>

      {issue.location_text && (
        <p className="flex items-center gap-1.5 px-4 pb-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {issue.location_text}
        </p>
      )}

      {issue.status !== "completed" && issue.expected_date && (
        <p className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-progress/25 px-3 py-2 text-sm font-semibold text-foreground">
          <CalendarClock className="h-4 w-4" /> अंदाजे पूर्ण होण्याची तारीख: {formatDate(issue.expected_date)}
        </p>
      )}

      {showAudit ? (
        <div className="border-t border-border bg-secondary/40 p-4">
          <div className="grid grid-cols-2 gap-3">
            <figure>
              <figcaption className="mb-1 text-xs font-semibold text-muted-foreground">पूर्वीचे छायाचित्र</figcaption>
              <SignedImage path={issue.photo_url} alt="कामापूर्वीचे छायाचित्र" className="h-32 w-full" />
            </figure>
            <figure>
              <figcaption className="mb-1 text-xs font-semibold text-muted-foreground">नंतरचे छायाचित्र</figcaption>
              <SignedImage path={issue.after_photo_url} alt="काम पूर्ण झाल्यानंतरचे छायाचित्र" className="h-32 w-full" />
            </figure>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">कार्यवाही / उपाययोजना</p>
            <p className="text-[15px] text-foreground">{issue.resolution_notes || "—"}</p>
          </div>
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-done px-3 py-2 font-bold text-done-foreground">
            <IndianRupee className="h-4 w-4" /> एकूण खर्च झालेला निधी: {formatMoney(issue.amount_spent)}
          </p>
        </div>
      ) : (
        issue.photo_url && (
          <div className="px-4 pb-4">
            <SignedImage path={issue.photo_url} alt={issue.title} className="h-44 w-full" />
          </div>
        )
      )}

      {children}
    </article>
  );
}