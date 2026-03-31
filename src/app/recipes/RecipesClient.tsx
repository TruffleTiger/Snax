"use client";

import { useCallback, useEffect, useState } from "react";

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  prepTimeMinutes: number;
  source: string;
  tags: string;
  createdAt: string;
}

function parseIngredients(raw: string): Ingredient[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function RecipesClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", quantity: "", unit: "" }]);
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState(30);
  const [tags, setTags] = useState("");

  const fetchRecipes = useCallback(async () => {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    setRecipes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setIngredients([{ name: "", quantity: "", unit: "" }]);
    setInstructions("");
    setPrepTime(30);
    setTags("");
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(recipe: Recipe) {
    setEditingId(recipe.id);
    setTitle(recipe.title);
    setDescription(recipe.description);
    setIngredients(parseIngredients(recipe.ingredients).length > 0 ? parseIngredients(recipe.ingredients) : [{ name: "", quantity: "", unit: "" }]);
    setInstructions(recipe.instructions);
    setPrepTime(recipe.prepTimeMinutes);
    setTags(recipe.tags);
    setShowForm(true);
  }

  function addIngredientRow() {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  }

  function removeIngredientRow(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const validIngredients = ingredients.filter((i) => i.name.trim());
    const payload = {
      title: title.trim(),
      description,
      ingredients: JSON.stringify(validIngredients),
      instructions,
      prepTimeMinutes: prepTime,
      tags,
    };

    if (editingId) {
      await fetch(`/api/recipes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    resetForm();
    fetchRecipes();
  }

  async function handleDelete(id: string) {
    setDeletingId(null);
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    fetchRecipes();
  }

  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.tags.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="flex justify-center py-20 text-zinc-400">Loading…</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Recipes</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your family&apos;s recipe collection</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Recipe
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search recipes by name or tag…"
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-6"
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-lg mx-4"
          >
            <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              {editingId ? "Edit Recipe" : "Add Recipe"}
            </h2>

            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
              placeholder="e.g. Lemon Garlic Salmon" />

            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
              placeholder="A quick and healthy weeknight dinner…" />

            {/* Ingredients */}
            <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Ingredients</label>
            <div className="space-y-2 mb-3">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    placeholder="Ingredient" className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <input type="text" value={ing.quantity} onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                    placeholder="Qty" className="w-16 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <input type="text" value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                    placeholder="Unit" className="w-20 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  {ingredients.length > 1 && (
                    <button type="button" onClick={() => removeIngredientRow(i)}
                      className="text-zinc-400 hover:text-red-500 transition-colors px-1">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addIngredientRow}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium">+ Add ingredient</button>
            </div>

            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Instructions</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
              placeholder="1. Preheat oven to 400°F…" />

            <div className="flex gap-4 mb-3">
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Prep Time (min)</label>
                <input type="number" value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value))} min={1}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags (comma-separated)</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="quick, fish, healthy" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={resetForm}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button type="submit" disabled={saving}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : editingId ? "Update" : "Add Recipe"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Delete Recipe?</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">This will permanently remove this recipe.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deletingId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">{recipes.length === 0 ? "No recipes yet" : "No matching recipes"}</p>
          <p className="text-sm mt-1">{recipes.length === 0 ? "Add your first recipe to get started" : "Try a different search"}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((recipe) => {
            const expanded = expandedId === recipe.id;
            const ings = parseIngredients(recipe.ingredients);
            return (
              <div key={recipe.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpandedId(expanded ? null : recipe.id)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{recipe.title}</h3>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${recipe.source === "ai" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                        {recipe.source === "ai" ? "AI" : "Manual"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                      <span>⏱ {recipe.prepTimeMinutes} min</span>
                      {recipe.tags && (
                        <div className="flex gap-1">
                          {recipe.tags.split(",").map((t) => (
                            <span key={t} className="bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full px-2 py-0.5">
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(recipe); }}
                      className="rounded-lg p-2 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingId(recipe.id); }}
                      className="rounded-lg p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <span className={`text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 space-y-3">
                    {recipe.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{recipe.description}</p>
                    )}
                    {ings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ingredients</h4>
                        <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-0.5">
                          {ings.map((ing, i) => (
                            <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recipe.instructions && (
                      <div>
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Instructions</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">{recipe.instructions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
