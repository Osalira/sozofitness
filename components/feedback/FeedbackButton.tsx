"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("other");
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting: prevent spam (30 seconds between submissions)
    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      toast.error("Please wait 30 seconds between feedback submissions");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("Please provide at least 10 characters of feedback");
      return;
    }

    if (message.trim().length > 5000) {
      toast.error("Feedback message is too long (max 5000 characters)");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          category,
          rating,
          pagePath: pathname,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast.success("Thanks! Feedback received.");
      setLastSubmitTime(now);
      setMessage("");
      setCategory("other");
      setRating(null);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Send feedback"
        title="Send feedback"
      >
        <svg
          className="w-6 h-6 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Feedback Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="bug">🐛 Bug Report</option>
                <option value="feature">💡 Feature Request</option>
                <option value="other">💬 Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">How would you rate your experience? (Optional)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? null : star)}
                    className={`w-10 h-10 rounded-md border-2 transition-all ${
                      rating && star <= rating
                        ? "border-warning bg-warning text-warning-foreground"
                        : "border-border hover:border-warning"
                    }`}
                    aria-label={`${star} stars`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                What should we improve? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think, what's broken, or what features you'd like to see..."
                required
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/5000 characters
              </p>
            </div>

            <Alert>
              <AlertDescription>
                Your feedback helps us improve. We'll review every submission but may not respond
                individually.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || message.trim().length < 10}>
                {loading ? "Sending..." : "Send Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

