"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";

type Review = {
  id?: string;
  periodStart: string;
  periodEnd: string;
  understanding: number | null;
  wentWell: string | null;
  difficulties: string | null;
  improvements: string | null;
  nextFocus: string | null;
};

type Props = {
  goalId: string;
  periodStart: string;
  periodEnd: string;
  metrics: { learningHours: number; tasksCompleted: number; understanding: number | null };
  review: Review | null;
};

export default function ReviewForm({ goalId, periodStart, periodEnd, metrics, review }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState({
    wentWell: review?.wentWell ?? "",
    difficulties: review?.difficulties ?? "",
    improvements: review?.improvements ?? "",
    nextFocus: review?.nextFocus ?? "",
    understanding: review?.understanding ?? metrics.understanding ?? 3,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        review?.id ? `/api/reviews/${review.id}` : `/api/goals/${goalId}/reviews`,
        {
          method: review?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ periodStart, periodEnd, ...values }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Couldn't save the review.");
      toast(review?.id ? "Review updated." : "Review saved.", "success");
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Couldn't save the review.");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: "wentWell" | "difficulties" | "improvements" | "nextFocus", placeholder: string) => (
    <textarea
      value={values[key]}
      onChange={(event) => setValues({ ...values, [key]: event.target.value })}
      placeholder={placeholder}
      rows={3}
      className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
    />
  );

  return (
    <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-50 p-3">
          <p className="text-xs text-surface-500">Learning time</p>
          <p className="mt-1 text-xl font-bold text-surface-900">{metrics.learningHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-xl bg-surface-50 p-3">
          <p className="text-xs text-surface-500">Tasks completed</p>
          <p className="mt-1 text-xl font-bold text-surface-900">{metrics.tasksCompleted}</p>
        </div>
        <div className="rounded-xl bg-surface-50 p-3">
          <p className="text-xs text-surface-500">Understanding</p>
          <div className="mt-1.5 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setValues({ ...values, understanding: value })}
                aria-pressed={values.understanding === value}
                aria-label={`Understanding ${value} of 5`}
                className={`h-8 flex-1 rounded-lg border text-xs font-semibold transition ${
                  values.understanding === value
                    ? "border-ai-500 bg-ai-600 text-white"
                    : "border-surface-200 bg-surface-0 text-surface-500 hover:bg-surface-100"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-surface-600">What went well?</span>
          {field("wentWell", "Reflect on what worked…")}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-surface-600">What was difficult?</span>
          {field("difficulties", "Be honest about the friction…")}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-surface-600">What should improve?</span>
          {field("improvements", "Small, real changes…")}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-surface-600">Next focus</span>
          {field("nextFocus", "Where will you point your energy next?")}
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving} icon="check">
          {saving ? "Saving…" : review?.id ? "Update review" : "Save review"}
        </Button>
      </div>
    </section>
  );
}
