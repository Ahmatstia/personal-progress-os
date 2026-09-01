"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";

type TaskFormProps = {
  stageId: string;
  label?: string;
};

export default function TaskForm({ stageId, label = "Add task" }: TaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      toast("Task name is required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          name,
          description,
          type: "TASK",
          priority,
          estimatedHours: estimatedHours === "" ? 0 : Number(estimatedHours),
          notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || data.error || "Couldn't create the task.");
      setName("");
      setDescription("");
      setPriority("MEDIUM");
      setEstimatedHours("");
      setNotes("");
      setOpen(false);
      toast("Task added.", "success");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't create the task.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-surface-300 bg-surface-0 px-4 py-3 text-sm font-medium text-surface-500 transition hover:border-primary-400 hover:bg-primary-50/40 hover:text-primary-700"
      >
        <span className="text-lg leading-none">+</span> {label}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add a new task"
        description="Define a single concrete piece of work for this stage."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-surface-700">Task name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Study Python variables"
              required
              autoFocus
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-surface-700">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should be learned or done?"
              rows={2}
              className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-surface-700">Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-surface-700">Estimated hours</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g. 2"
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-surface-700">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else?"
              rows={2}
              className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" icon="check" loading={submitting}>
              Create task
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
