import { Mail, MessageCircle, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const INTEGRATIONS = [
  {
    icon: Mail,
    name: "Gmail / Outlook",
    description:
      "Summarize emails, draft replies for your approval, and auto-categorize by client and urgency. Nothing is ever sent without you clicking send.",
    envHint: "GMAIL_CLIENT_ID / OUTLOOK_CLIENT_ID",
  },
  {
    icon: MessageCircle,
    name: "WhatsApp Business",
    description:
      "Summarize conversations, suggest replies for approval, create reminders, and link chats to client profiles.",
    envHint: "WHATSAPP_BUSINESS_TOKEN",
  },
  {
    icon: Video,
    name: "Video consultations",
    description: "Book and host client video calls directly from a case or client record.",
    envHint: null,
  },
];

export function IntegrationsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {INTEGRATIONS.map((integration) => (
          <div key={integration.name} className="flex items-start gap-3 rounded-lg border border-border p-4">
            <integration.icon className="mt-0.5 size-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{integration.name}</p>
                <Badge variant="outline">Not connected</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
              {integration.envHint && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Configure <code className="font-mono">{integration.envHint}</code> to enable.
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" disabled>
              Connect
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
