"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { StatusBadge } from "./ui/Badge";
import { useToast } from "./ui/Toast";

type Props = {
  id: string;
  status: string;
  name: string;
  description: string | null;
  priority: string;
  estimatedHours: number;
  notes: string | null;
};

export default function TaskActions({ id, status, name, description, priority, estimatedHours, notes }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    name,
    description: description ?? "",
    priority,
    estimatedHours: String(estimatedHours),
    notes: notes ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function patch(body: object, success = "Task updated.") {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Couldn't update the task.");
      setEditing(false);
      toast(success, "success");
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Couldn't update the task.");
    } finally {
      setLoading(false);
    }
  }

  const primaryAction =
    status === "COMPLETED" ? (
      <Button variant="secondary" onClick={() => patch({ status: "IN_PROGRESS" }, "Task reopened.")} disabled={loading}>
        Reopen
      </Button>
    ) : status === "IN_PROGRESS" ? (
      <Button
        variant="success"
        icon="check"
        onClick={() => {
          if (window.confirm(`Complete task "${name}"?`)) patch({ status: "COMPLETED" }, "Task completed. Nice!");
        }}
        disabled={loading}
      >
        Complete task
      </Button>
    ) : (
      <Button
        variant="primary"
        icon="play"
        onClick={() => patch({ status: "IN_PROGRESS" }, "Task started.")}
        disabled={loading}
      >
        Start working
      </Button>
    );

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <StatusBadge status={status} />
      {primaryAction}
      <Button variant="ghost" icon="edit" size="md" onClick={() => setEditing(true)} disabled={loading}>
        Edit
      </Button>
      {error && <p className="w-full text-sm text-danger-600">{error}</p>}

      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit task"
        description="Update the details of this task."
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              placeholder="Task name"
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400"
            />
            <select
              value={values.priority}
              onChange={(e) => setValues({ ...values, priority: e.target.value })}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <textarea
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400"
          />
          <textarea
            value={values.notes}
            onChange={(e) => setValues({ ...values, notes: e.target.value })}
            placeholder="Notes"
            rows={2}
            className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400"
          />
          <input
            type="number"
            min="0"
            step="0.5"
            value={values.estimatedHours}
            onChange={(e) => setValues({ ...values, estimatedHours: e.target.value })}
            placeholder="Estimated hours"
            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400"
          />
          {error && <p className="text-sm text-danger-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(false)} type="button">
              Cancel
            </Button>
            <Button loading={loading} disabled={!values.name.trim()} onClick={() => patch({ ...values, estimatedHours: Number(values.estimatedHours) })}>
              Save changes
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
