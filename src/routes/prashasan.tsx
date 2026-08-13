import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { IssueCard, type IssueRow } from "@/components/IssueCard";
import { useIssues } from "@/hooks/useIssues";
import { STATUSES, statusLabel, toMarathiDigits, type IssueStatus } from "@/lib/gp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/prashasan")({
  head: () => ({
    meta: [
      { title: "प्रशासन कक्ष | ग्रामपंचायत ढोरजळगाव" },
      { name: "description", content: "सरपंच व ग्रामपंचायत प्रशासनासाठी कामांची स्थिती व खर्च नोंदविण्याचा कक्ष." },
      { property: "og:title", content: "प्रशासन कक्ष | ग्रामपंचायत ढोरजळगाव" },
      { property: "og:description", content: "कामांची स्थिती, खर्च व घोषणा व्यवस्थापन." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { loading, isAdmin, user } = useAuth();
  const { data } = useIssues();
  const qc = useQueryClient();

  if (loading) return <AppShell><div className="h-40 animate-pulse rounded-xl bg-muted" /></AppShell>;

  if (!user || !isAdmin) {
    return (
      <AppShell>
        <div className="gp-card p-6 text-center">
          <h1 className="text-xl font-bold text-foreground">हा विभाग फक्त ग्रामपंचायत प्रशासनासाठी आहे</h1>
          <p className="mt-2 text-sm text-muted-foreground">कृपया अधिकृत खात्याने प्रवेश करा.</p>
          <Link
            to="/pravesh"
            className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground"
          >
            प्रवेश करा
          </Link>
        </div>
      </AppShell>
    );
  }

  const rows = data ?? [];

  return (
    <AppShell>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <ShieldCheck className="h-7 w-7 text-brand" /> प्रशासन कक्ष
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        सरपंच सुवर्णा गिऱ्हे यांच्या मार्गदर्शनाखाली · एकूण नोंदी {toMarathiDigits(rows.length)}
      </p>

      <AnnouncementForm onDone={() => void qc.invalidateQueries({ queryKey: ["announcements"] })} authorId={user.id} />

      <h2 className="mt-8 text-lg font-bold text-foreground">तक्रारींचे व्यवस्थापन</h2>
      <div className="mt-3 space-y-4">
        {rows.map((r) => (
          <IssueCard key={r.issue.id} issue={r.issue} votes={r.votes}>
            <AdminIssueForm issue={r.issue} onDone={() => void qc.invalidateQueries({ queryKey: ["issues"] })} />
          </IssueCard>
        ))}
        {rows.length === 0 && (
          <p className="gp-card p-5 text-center text-sm text-muted-foreground">अद्याप कोणतीही तक्रार नाही.</p>
        )}
      </div>
    </AppShell>
  );
}

function AnnouncementForm({ authorId, onDone }: { authorId: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      toast.error("घोषणेचे शीर्षक लिहा");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("announcements").insert({
      title: title.trim().slice(0, 150),
      body: body.trim().slice(0, 2000),
      author_id: authorId,
    });
    setBusy(false);
    if (error) {
      toast.error("घोषणा प्रसिद्ध करता आली नाही");
      return;
    }
    toast.success("घोषणा प्रसिद्ध झाली");
    setTitle("");
    setBody("");
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-6 gp-card space-y-4 p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <Megaphone className="h-5 w-5 text-brand" /> नवीन घोषणा / सूचना
      </h2>
      <div>
        <Label htmlFor="ann-title">शीर्षक</Label>
        <Input
          id="ann-title"
          value={title}
          maxLength={150}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="उदा. ग्रामसभा दिनांक १५ रोजी"
          className="mt-1 h-12 text-base"
        />
      </div>
      <div>
        <Label htmlFor="ann-body">सविस्तर मजकूर</Label>
        <Textarea
          id="ann-body"
          value={body}
          maxLength={2000}
          rows={3}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 text-base"
        />
      </div>
      <Button type="submit" disabled={busy} className="h-12 w-full text-base font-semibold">
        {busy ? "प्रसिद्ध करत आहे..." : "घोषणा प्रसिद्ध करा"}
      </Button>
    </form>
  );
}

function AdminIssueForm({ issue, onDone }: { issue: IssueRow; onDone: () => void }) {
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [expected, setExpected] = useState(issue.expected_date ?? "");
  const [notes, setNotes] = useState(issue.resolution_notes ?? "");
  const [amount, setAmount] = useState(issue.amount_spent ? String(issue.amount_spent) : "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const amt = amount === "" ? null : Number(amount);
    if (amt !== null && (!Number.isFinite(amt) || amt < 0)) {
      toast.error("खर्चाची रक्कम योग्य नाही");
      return;
    }
    setBusy(true);
    try {
      let afterPath = issue.after_photo_url;
      if (file) {
        if (file.size > 8 * 1024 * 1024) throw new Error("छायाचित्र ८ MB पेक्षा लहान असावे");
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `after/${issue.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("issue-photos").upload(path, file);
        if (upErr) throw upErr;
        afterPath = path;
      }
      const { error } = await supabase
        .from("issues")
        .update({
          status,
          expected_date: expected || null,
          resolution_notes: notes.trim().slice(0, 1000) || null,
          amount_spent: amt,
          after_photo_url: afterPath,
        })
        .eq("id", issue.id);
      if (error) throw error;
      toast.success("माहिती जतन झाली");
      setFile(null);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "जतन करता आले नाही");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-border bg-card p-4">
      <div>
        <Label htmlFor={`st-${issue.id}`}>सद्यस्थिती</Label>
        <select
          id={`st-${issue.id}`}
          value={status}
          onChange={(e) => setStatus(e.target.value as IssueStatus)}
          className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`ed-${issue.id}`}>अंदाजे पूर्ण होण्याची तारीख</Label>
        <Input
          id={`ed-${issue.id}`}
          type="date"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          className="mt-1 h-12 text-base"
        />
      </div>
      <div>
        <Label htmlFor={`nt-${issue.id}`}>कार्यवाही / उपाययोजना</Label>
        <Textarea
          id={`nt-${issue.id}`}
          value={notes}
          maxLength={1000}
          rows={2}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 text-base"
        />
      </div>
      <div>
        <Label htmlFor={`am-${issue.id}`}>एकूण खर्च झालेला निधी (रुपये)</Label>
        <Input
          id={`am-${issue.id}`}
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 h-12 text-base"
        />
      </div>
      <div>
        <Label htmlFor={`ph-${issue.id}`}>काम पूर्ण झाल्यानंतरचे छायाचित्र</Label>
        <input
          id={`ph-${issue.id}`}
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm"
        />
      </div>
      <Button onClick={() => void save()} disabled={busy} className="h-12 w-full text-base font-semibold">
        {busy ? "जतन करत आहे..." : "बदल जतन करा"}
      </Button>
    </div>
  );
}