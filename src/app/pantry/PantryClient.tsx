"use client";

import { useCallback, useEffect, useState } from "react";

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const UNIT_OPTIONS = ["lbs", "oz", "cups", "pieces", "gallons", "liters"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function expiryStatus(expiresAt: string | null): "ok" | "warning" | "expired" {
  if (!expiresAt) return "ok";
  const now = new Date();
  const exp = new Date(expiresAt);
  if (exp < now) return "expired";
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  if (exp.getTime() - now.getTime() < threeDays) return "warning";
  return "ok";
}

function rowClass(status: "ok" | "warning" | "expired"): string {
  if (status === "expired")
    return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
  if (status === "warning")
    return "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800";
  return "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900";
}

export default function PantryClient() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/pantry");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function resetForm() {
    setName("");
    setQuantity(1);
    setUnit("");
    setCustomUnit("");
    setExpiresAt("");
    setEditingId(null);
    setShowForm(false);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(item: PantryItem) {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(item.quantity);
    if (UNIT_OPTIONS.includes(item.unit)) {
      setUnit(item.unit);
      setCustomUnit("");
    } else if (item.unit) {
      setUnit("custom");
      setCustomUnit(item.unit);
    } else {
      setUnit("");
      setCustomUnit("");
    }
    setExpiresAt(
      item.expiresAt ? new Date(item.expiresAt).toISOString().split("T")[0] : ""
    );
    setShowForm(true);
  }

  function resolvedUnit(): string {
    return unit === "custom" ? customUnit.trim() : unit;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      quantity,
      unit: resolvedUnit(),
      expiresAt: expiresAt || null,
    };

    if (editingId) {
      await fetch(`/api/pantry/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    resetForm();
    fetchItems();
  }

  async function handleDelete(id: string) {
    setDeletingId(null);
    await fetch(`/api/pantry/${id}`, { method: "DELETE" });
    fetchItems();
  }

  async function handleQuantityChange(item: PantryItem, delta: number) {
    const newQty = Math.max(0, item.quantity + delta);
    await fetch(`/api/pantry/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        quantity: newQty,
        unit: item.unit,
        expiresAt: item.expiresAt,
      }),
    });
    fetchItems();
  }

  async function handleClearExpired() {
    await fetch("/api/pantry/expired", { method: "DELETE" });
    fetchItems();
  }

  const hasExpired = items.some(
    (i) => i.expiresAt && new Date(i.expiresAt) < new Date()
  );

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
            Pantry
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track what&apos;s in stock and when it expires
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasExpired && (
            <button
              onClick={handleClearExpired}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              Clear Expired
            </button>
          )}
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Item
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              {editingId ? "Edit Item" : "Add Pantry Item"}
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
              placeholder="e.g. Chicken breast"
              autoFocus
              required
            />

            {/* Quantity */}
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Quantity
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            />

            {/* Unit */}
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
            >
              <option value="">No unit</option>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value="custom">Custom…</option>
            </select>
            {unit === "custom" && (
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                placeholder="e.g. bags, cans"
              />
            )}
            <div className="mb-4" />

            {/* Expires At */}
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Expiration Date
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-5"
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
              Delete Item?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              This will permanently remove this pantry item.
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

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-4xl mb-3">🥫</p>
          <p className="font-medium">Pantry is empty</p>
          <p className="text-sm mt-1">Add your first item to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const status = expiryStatus(item.expiresAt);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl border px-5 py-4 shadow-sm ${rowClass(status)}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h3>
                    {status === "expired" && (
                      <span className="inline-block rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                        Expired
                      </span>
                    )}
                    {status === "warning" && (
                      <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        Expiring soon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                    {item.expiresAt && (
                      <span>Expires {formatDate(item.expiresAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  {/* -1 button */}
                  <button
                    onClick={() => handleQuantityChange(item, -1)}
                    className="rounded-lg p-2 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    title="Decrease quantity"
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
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  {/* +1 button */}
                  <button
                    onClick={() => handleQuantityChange(item, 1)}
                    className="rounded-lg p-2 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    title="Increase quantity"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                  {/* Edit button */}
                  <button
                    onClick={() => openEditForm(item)}
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
                  {/* Delete button */}
                  <button
                    onClick={() => setDeletingId(item.id)}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
