import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function SignedImage({
  path,
  alt,
  className,
}: {
  path?: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    void supabase.storage
      .from("issue-photos")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (!path) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground",
          className,
        )}
      >
        छायाचित्र नाही
      </div>
    );
  }

  return url ? (
    <img src={url} alt={alt} loading="lazy" className={cn("rounded-lg object-cover", className)} />
  ) : (
    <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
  );
}