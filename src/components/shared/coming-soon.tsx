import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ComingSoonModule({
  icon: Icon,
  title,
  description,
  roadmap,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  roadmap: string[];
}) {
  return (
    <div>
      <PageHeader title={title} description={description} actions={<Badge variant="gold">Roadmap</Badge>} />
      <Card>
        <CardContent className="flex flex-col gap-6 p-8 sm:flex-row">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <Icon className="size-7" />
          </span>
          <div>
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="size-4 text-gold" />
              Architected, not yet wired up
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The data model and API surface for this module already exist in the schema, so it
              can go live without a rewrite. Planned capabilities:
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {roadmap.map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground/90">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
