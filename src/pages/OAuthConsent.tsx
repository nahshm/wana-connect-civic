// src/pages/OAuthConsent.tsx
// Supabase OAuth 2.1 authorization-server consent screen.
// Mounted at /.lovable/oauth/consent — Supabase redirects the user here to
// approve or deny a client (e.g. Claude, ChatGPT, Cursor) that wants to act
// on their behalf via the app's MCP server.

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldCheck } from "lucide-react";

// Minimal typed wrapper — supabase.auth.oauth is beta and may be missing
// from generated types depending on the client version.
type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{
    data: {
      client?: { name?: string; client_uri?: string; logo_uri?: string };
      redirect_url?: string;
      redirect_to?: string;
      scopes?: string[];
    } | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
};

function oauthNs(): OAuthNs {
  return (supabase.auth as unknown as { oauth: OAuthNs }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<Awaited<ReturnType<OAuthNs["getAuthorizationDetails"]>>["data"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in URL.");
        return;
      }

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so the user comes back here after login.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }

      try {
        const { data, error } = await oauthNs().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load this authorization request.");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const ns = oauthNs();
      const { data, error } = approve
        ? await ns.approveAuthorization(authorizationId)
        : await ns.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization request failed.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Connect an app to WanaIQ</CardTitle>
          <CardDescription>
            An external app is asking to act on your behalf using WanaIQ's tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && !details && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading authorization request…
            </div>
          )}

          {details && (
            <>
              <div className="rounded-md border p-4 space-y-1">
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{details.client?.name ?? "Unnamed client"}</p>
                {details.client?.client_uri && (
                  <p className="text-xs text-muted-foreground break-all">
                    {details.client.client_uri}
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Approving lets this app read WanaIQ data as you. It cannot see your password
                and any data it fetches is still governed by your account's permissions.
                You can revoke access at any time from your Supabase account.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => decide(true)} disabled={busy} className="w-full">
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Approve
                </Button>
                <Button
                  onClick={() => decide(false)}
                  disabled={busy}
                  variant="outline"
                  className="w-full"
                >
                  Deny
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
