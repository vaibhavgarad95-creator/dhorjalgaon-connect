import { GRAM_PANCHAYAT, DISTRICT, TALUKA, SARPANCH } from "@/lib/gp";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border bg-secondary/60 px-4 py-8 text-center">
      <p className="font-display text-lg font-semibold text-foreground">{GRAM_PANCHAYAT}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        ता. {TALUKA}, जि. {DISTRICT}
      </p>
      <p className="text-sm text-muted-foreground">सरपंच – {SARPANCH}</p>

      <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-card px-4 py-4">
        <p className="text-sm font-semibold text-foreground">Developed By – Vaibhav Arun Garad</p>
        <p className="mt-1 text-sm text-foreground">
          Email –{" "}
          <a
            href="mailto:vaibhavgarad95@gmail.com"
            className="font-medium text-primary underline underline-offset-4"
          >
            vaibhavgarad95@gmail.com
          </a>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          For any queries, suggestions or feedback, please contact me.
        </p>
      </div>
    </footer>
  );
}