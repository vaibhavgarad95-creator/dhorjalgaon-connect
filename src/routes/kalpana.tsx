import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, MessageCircle, Lightbulb, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { VILLAGES, formatDate, toMarathiDigits } from "@/lib/gp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kalpana")({
  head: () => ({
    meta: [
      { title: "नवीन कल्पना आणि सूचना | ग्रामपंचायत ढोरजळगाव" },
      {
        name: "description",
        content: "गावाच्या विकासासाठी ग्रामस्थांच्या कल्पना मांडा, आवडलेल्या कल्पनांना पाठिंबा द्या.",
      },
      { property: "og:title", content: "नवीन कल्पना आणि सूचना | ग्रामपंचायत ढोरजळगाव" },
      { property: "og:description", content: "गावाच्या विकासासाठी सामुहिक विचारमंथन." },
    ],
  }),
  component: KalpanaPage,
});

const schema = z.object({
  title: z.string().trim().min(4, "कल्पनेचे शीर्षक लिहा").max(120),
  description: z.string().trim().max(1000),
  village: z.string().min(1),
});

function KalpanaPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", village: "" });
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["ideas", user?.id ?? "anon"],
    queryFn: async () => {
      const [{ data: ideas, error }, { data: likes }, { data: comments }] = await Promise.all([
        supabase.from("ideas").select("*").order("created_at", { ascending: false }),
        supabase.from("idea_likes").select("idea_id, user_id"),
        supabase.from("idea_comments").select("*").order("created_at", { ascending: true }),
      ]);
      if (error) throw error;
      let names = new Map<string, string>();
      if (user) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name");
        names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      }
      return (ideas ?? []).map((idea) => ({
        idea,
        authorName: names.get(idea.author_id) ?? "ग्रामस्थ",
        likes: (likes ?? []).filter((l) => l.idea_id === idea.id).length,
        liked: Boolean(user && (likes ?? []).some((l) => l.idea_id === idea.id && l.user_id === user.id)),
        comments: (comments ?? [])
          .filter((c) => c.idea_id === idea.id)
          .map((c) => ({ ...c, name: names.get(c.user_id) ?? "ग्रामस्थ" })),
      }));
    },
  });

  async function submitIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ ...form, village: form.village || profile?.village || VILLAGES[0].name });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "माहिती तपासा");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("ideas").insert({ ...parsed.data, author_id: user.id });
    setBusy(false);
    if (error) {
      toast.error("कल्पना नोंदवता आली नाही");
      return;
    }
    toast.success("आपली कल्पना नोंदवली गेली");
    setForm({ title: "", description: "", village: "" });
    await qc.invalidateQueries({ queryKey: ["ideas"] });
  }

  async function toggleLike(ideaId: string, liked: boolean) {
    if (!user) {
      toast.error("पाठिंबा देण्यासाठी कृपया प्रवेश करा");
      return;
    }
    if (liked) await supabase.from("idea_likes").delete().eq("idea_id", ideaId).eq("user_id", user.id);
    else await supabase.from("idea_likes").insert({ idea_id: ideaId, user_id: user.id });
    await qc.invalidateQueries({ queryKey: ["ideas"] });
  }

  async function addComment(ideaId: string) {
    if (!user) {
      toast.error("प्रतिक्रिया देण्यासाठी कृपया प्रवेश करा");
      return;
    }
    const body = commentText.trim().slice(0, 500);
    if (!body) return;
    const { error } = await supabase.from("idea_comments").insert({ idea_id: ideaId, user_id: user.id, body });
    if (error) {
      toast.error("प्रतिक्रिया पाठवता आली नाही");
      return;
    }
    setCommentText("");
    await qc.invalidateQueries({ queryKey: ["ideas"] });
  }

  return (
    <AppShell>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <Lightbulb className="h-7 w-7 text-brand" /> नवीन कल्पना आणि सूचना
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">गावाच्या विकासासाठी आपले विचार मांडा.</p>

      {user ? (
        <form onSubmit={submitIdea} className="mt-5 space-y-4 gp-card p-5">
          <div>
            <Label htmlFor="idea-title">कल्पनेचे शीर्षक</Label>
            <Input
              id="idea-title"
              value={form.title}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="उदा. गावात सौर पथदिवे बसवावेत"
              className="mt-1 h-12 text-base"
            />
          </div>
          <div>
            <Label htmlFor="idea-desc">सविस्तर माहिती</Label>
            <Textarea
              id="idea-desc"
              value={form.description}
              maxLength={1000}
              rows={3}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 text-base"
            />
          </div>
          <div>
            <Label htmlFor="idea-village">गाव</Label>
            <select
              id="idea-village"
              value={form.village || profile?.village || VILLAGES[0].name}
              onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
              className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
            >
              {VILLAGES.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full text-base font-semibold">
            {busy ? "पाठवत आहे..." : "कल्पना मांडा"}
          </Button>
        </form>
      ) : (
        <div className="mt-5 gp-card p-5 text-center">
          <p className="text-sm text-muted-foreground">कल्पना मांडण्यासाठी प्रवेश करा.</p>
          <Link
            to="/pravesh"
            className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground"
          >
            प्रवेश करा
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {isLoading && <div className="h-32 animate-pulse rounded-xl bg-muted" />}
        {!isLoading && data?.length === 0 && (
          <p className="gp-card p-5 text-center text-sm text-muted-foreground">
            अजून कोणतीही कल्पना मांडलेली नाही. पहिली कल्पना आपण मांडा!
          </p>
        )}
        {data?.map((row) => (
          <article key={row.idea.id} className="gp-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                {row.idea.village}
              </span>
              <span className="text-xs text-muted-foreground">
                {row.authorName} · {formatDate(row.idea.created_at)}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold text-foreground">{row.idea.title}</h2>
            {row.idea.description && (
              <p className="mt-1 whitespace-pre-line text-[15px] text-foreground/80">{row.idea.description}</p>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => void toggleLike(row.idea.id, row.liked)}
                className={cn(
                  "flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold",
                  row.liked ? "bg-brand text-brand-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                <Heart className="h-4 w-4" /> {toMarathiDigits(row.likes)}
              </button>
              <button
                onClick={() => setOpenComments(openComments === row.idea.id ? null : row.idea.id)}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"
              >
                <MessageCircle className="h-4 w-4" /> {toMarathiDigits(row.comments.length)}
              </button>
            </div>

            {openComments === row.idea.id && (
              <div className="mt-4 space-y-3 border-t border-border pt-3">
                {row.comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-secondary/60 px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground">{c.name}</p>
                    <p className="text-[15px] text-foreground">{c.body}</p>
                  </div>
                ))}
                {row.comments.length === 0 && (
                  <p className="text-sm text-muted-foreground">अजून कोणतीही प्रतिक्रिया नाही.</p>
                )}
                {user && (
                  <div className="flex gap-2">
                    <Input
                      value={commentText}
                      maxLength={500}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="आपली प्रतिक्रिया लिहा"
                      className="h-11 text-base"
                    />
                    <Button onClick={() => void addComment(row.idea.id)} className="h-11 px-4" aria-label="पाठवा">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}