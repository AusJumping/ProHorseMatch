import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface VerifyCodeDialogProps {
  open: boolean;
  email: string;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, message: data.message || (res.ok ? "" : "Something went wrong. Please try again.") };
  } catch {
    return { ok: false, message: "Could not reach the server. Please check your connection and try again." };
  }
}

// Shown after sign-up (and when someone tries to log in before verifying). The person types
// the 6-digit code from the email here, so they never have to open a browser.
export default function VerifyCodeDialog({ open, email, onOpenChange, onVerified }: VerifyCodeDialogProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCode("");
      setError("");
    }
  }, [open]);

  const submit = async () => {
    if (code.length !== 6) {
      setError("Please enter all 6 digits from the email.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await postJson("/api/auth/verify-code", { email, code });
    setBusy(false);
    if (result.ok) {
      toast({ title: "Email verified", description: "You can now log in with your email and password." });
      onVerified();
    } else {
      setError(result.message);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError("");
    const result = await postJson("/api/auth/resend-verification", { email });
    setBusy(false);
    if (result.ok) {
      setCode("");
      toast({ title: "New code sent", description: "Check your email for a new 6-digit code. Older codes no longer work." });
    } else {
      setError(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Enter your code</DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-300">
            We emailed a 6-digit code to <span className="font-medium text-amber-700 dark:text-amber-400">{email}</span>.
            Type it below. Check your spam folder if you cannot see it.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            aria-label="6-digit verification code"
            className="text-center text-3xl tracking-[0.4em] h-14 font-mono"
            data-testid="input-verification-code"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600 text-center" role="alert" data-testid="text-verification-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
            data-testid="button-verify-code"
          >
            {busy ? "Checking..." : "Verify my email"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={resend}
              disabled={busy}
              className="text-sm text-amber-700 underline underline-offset-2 disabled:opacity-50"
              data-testid="button-resend-code"
            >
              Resend code
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
