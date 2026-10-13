import { toast } from "sonner";

/** Native share sheet when available, otherwise copy the link — same pattern either way: one tap, done. */
export async function shareLink(title: string, path: string) {
  const url = `${window.location.origin}${path}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
    } catch {
      // Cancelled — not an error.
    }
    return;
  }

  await navigator.clipboard.writeText(url);
  toast.success("Link copied");
}
