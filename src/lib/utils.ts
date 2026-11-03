import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFrom({ fromName, fromEmail }: { fromName: string; fromEmail: string }) {
  return fromName && fromEmail ? `${fromName} <${fromEmail}>` : fromEmail || "";
}

export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Reads a JSON file picked in an <input type="file"> and hands an array to onArray; toasts on bad input. */
export function importJsonArray(event: React.ChangeEvent<HTMLInputElement>, kind: string, onArray: (items: unknown[]) => void) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  file.text().then((content) => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) onArray(parsed);
      else toast.error(`Invalid ${kind} file format.`);
    } catch {
      toast.error(`Failed to parse ${kind} file.`);
    }
  });
}

/** Posts to /api/emails/send (empty fields are skipped) and returns the Message-ID. */
export async function sendEmail(fields: Record<string, string | undefined>, attachments: File[] = []) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) if (value) body.append(key, value);
  attachments.forEach((file) => body.append("attachments", file));
  const res = await fetch("/api/emails/send", { method: "POST", body });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to send email");
  return (json.messageId as string) || "<unknown>";
}
