import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { IssueRow } from "@/components/IssueCard";

export function useIssues(village?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["issues", village ?? "all", user?.id ?? "anon"],
    queryFn: async () => {
      let query = supabase.from("issues").select("*").order("created_at", { ascending: false });
      if (village) query = query.eq("village", village);
      const [{ data: issues, error }, { data: votes }] = await Promise.all([
        query,
        supabase.from("issue_votes").select("issue_id, user_id"),
      ]);
      if (error) throw error;

      let names = new Map<string, string>();
      if (user) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name");
        names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      }

      return (issues ?? []).map((issue) => {
        const rows = (votes ?? []).filter((v) => v.issue_id === issue.id);
        return {
          issue: {
            ...issue,
            reporterName: issue.is_anonymous ? null : (names.get(issue.reporter_id) ?? null),
          } as IssueRow,
          votes: rows.length,
          hasVoted: Boolean(user && rows.some((v) => v.user_id === user.id)),
        };
      });
    },
  });
}

export function useVote() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return async (issueId: string, hasVoted: boolean) => {
    if (!user) {
      toast.error("समर्थन देण्यासाठी कृपया प्रवेश करा");
      return;
    }
    if (hasVoted) {
      await supabase.from("issue_votes").delete().eq("issue_id", issueId).eq("user_id", user.id);
    } else {
      const { error } = await supabase.from("issue_votes").insert({ issue_id: issueId, user_id: user.id });
      if (error) {
        toast.error("समर्थन नोंदवता आले नाही");
        return;
      }
    }
    await qc.invalidateQueries({ queryKey: ["issues"] });
  };
}