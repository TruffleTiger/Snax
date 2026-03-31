"use client";

import { useCallback, useEffect, useState } from "react";

interface FamilyMember {
  id: string;
  name: string;
  sensitivities: string;
  createdAt: string;
  updatedAt: string;
}

const COMMON_SENSITIVITIES = [
  "Gluten",
  "Dairy",
  "Nuts",
  "Shellfish",
  "Eggs",
  "Soy",
];

const BADGE_COLORS: Record<string, string> = {
  gluten: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  dairy: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  nuts: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  shellfish: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  eggs: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  soy: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

function badgeColor(sensitivity: string): string {
  return (
    BADGE_COLORS[sensitivity.toLowerCase()] ??
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
  );
}

export default function FamilyMembersClient() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [checkedSensitivities, setCheckedSensitivities] = useState<
    Set<string>
  >(new Set());
  const [customSensitivity, setCustomSensitivity] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/family-members");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function resetForm() {
    setName("");
    setCheckedSensitivities(new Set());
    setCustomSensitivity("");
    setEditingId(null);
    setShowForm(false);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(member: FamilyMember) {
    setEditingId(member.id);
    setName(member.name);
    const sens = member.sensitivities
      ? member.sensitivities.split(",").map((s) => s.trim())
      : [];
    const common = new Set(
      sens.filter((s) =>
        COMMON_SENSITIVITIES.map((c) => c.toLowerCase()).includes(
          s.toLowerCase()
        )
      )
    );
    const custom = sens
      .filter(
        (s) =>
          !COMMON_SENSITIVITIES.map((c) => c.toLowerCase()).includes(
            s.toLowerCase()
          )
      )
      .join(", ");
    setCheckedSensitivities(
      new Set([...common].map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()))
    );
    setCustomSensitivity(custom);
    setShowForm(true);
  }

  function toggleSensitivity(s: string) {
    setCheckedSensitivities((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function buildSensitivitiesString(): string {
    const selected = [...checkedSensitivities].map((s) => s.toLowerCase());
    const custom = customSensitivity
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return [...new Set([...selected, ...custom])].join(",");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const sensitivities = buildSensitivitiesString();

    if (editingId) {
      await fetch(`/api/family-members/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), sensitivities }),
      });
    } else {
      await fetch("/api/family-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), sensitivities }),
      });
    }

    setSaving(false);
    resetForm();
    fetchMembers();
  }

  async function handleDelete(id: string) {
    setDeletingId(null);
    await fetch(`/api/family-members/${id}`, { method: "DELETE" });
    fetchMembers();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">Loading…</div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Family Members
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your household and their food sensitivities
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Member
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              {editingId ? "Edit Member" : "Add Family Member"}
            </h2>

            {/* Name */}
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
              placeholder="e.g. Alex"
              autoFocus
              required
            />

            {/* Common Sensitivities */}
            <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Food Sensitivities
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {COMMON_SENSITIVITIES.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                    checkedSensitivities.has(s)
                      ? "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checkedSensitivities.has(s)}
                    onChange={() => toggleSensitivity(s)}
                  />
                  {s}
                </label>
              ))}
            </div>

            {/* Custom */}
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Other (comma-separated)
            </label>
            <input
              type="text"
              value={customSensitivity}
              onChange={(e) => setCustomSensitivity(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-5"
              placeholder="e.g. sesame, fish"
            />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              Delete Member?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              This will permanently remove this family member and their meal
              associations.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      {members.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-4xl mb-3">👨‍👩‍👧‍👦</p>
          <p className="font-medium">No family members yet</p>
          <p className="text-sm mt-1">Add your first member to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 shadow-sm"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {member.name}
                </h3>
                {member.sensitivities ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {member.sensitivities.split(",").map((s) => (
                      <span
                        key={s}
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor(s.trim())}`}
                      >
                        {s.trim().charAt(0).toUpperCase() +
                          s.trim().slice(1)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 mt-1.5">
                    No sensitivities
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={() => openEditForm(member)}
                  className="rounded-lg p-2 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  title="Edit"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setDeletingId(member.id)}
                  className="rounded-lg p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
