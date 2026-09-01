"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";

const goalTypes = ["LEARNING", "PROJECT", "PERSONAL", "HEALTH", "CAREER", "OTHER"];

export default function NewGoalButton() {
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("LEARNING");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      toast("Give your goal a name.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? data.error ?? "Couldn't create the goal.");
      setName("");
      setDescription("");
      setType("LEARNING");
      setOpen(false);
      toast("Goal created.", "success");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't create the goal.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button icon="plus" onClick={() => setOpen(true)}>
        New goal
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create a new goal"
        description="Turn something important into a clear path forward."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-surface-700">Goal name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Learn Spanish, Build a portfolio, Run a 10k"
              required
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-surface-700">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400"
            >
              {goalTypes.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-surface-700">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you want to achieve?"
              rows={4}
              className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" icon="check" loading={loading}>
              Create goal
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
