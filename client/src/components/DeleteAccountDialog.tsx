import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// apiRequest throws "401: {json}" - pull the readable message back out.
function readableError(error: any): string {
  const raw = String(error?.message ?? "");
  try {
    return JSON.parse(raw.slice(raw.indexOf(":") + 1).trim()).message ?? raw;
  } catch {
    return raw || "Something went wrong. Please try again.";
  }
}

export function DeleteAccountDialog() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (isDeleting) return;
    setOpen(next);
    if (!next) {
      setPassword("");
      setError("");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError("");
      await apiRequest("DELETE", "/api/account", { password });

      localStorage.removeItem("authToken");
      localStorage.removeItem("user_data");
      queryClient.clear();
      toast({
        title: "Account deleted",
        description: "Your account and all of your data have been permanently deleted.",
      });
      navigate("/");
    } catch (err) {
      setError(readableError(err));
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
        data-testid="button-delete-account"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Account
      </Button>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-neutral-600">
                <p>
                  This permanently deletes your account and everything linked to it: your horse listings
                  (including photos and videos), your messages and conversations, favourites, saved searches
                  and notification settings.
                </p>
                <p>
                  <strong>This can't be undone.</strong> If you have a paid plan, any time remaining on it
                  will be lost and isn't refunded.
                </p>
                <p>To confirm, enter your password.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting}
              data-testid="input-delete-account-password"
            />
            {error && (
              <p className="text-sm text-red-600" role="alert" data-testid="text-delete-account-error">
                {error}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting || password.length === 0}
              onClick={handleDelete}
              data-testid="button-confirm-delete-account"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete my account"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
