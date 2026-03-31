"use client";

import { useCallback, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────

interface FamilyMember {
  id: string;
  name: string;
  sensitivities: string;
}

interface Recipe {
  id: string;
  title: string;
  prepTimeMinutes: number;
  tags: string;
}

interface MealAttendee {
  id: string;
  familyMemberId: string;
  familyMember: FamilyMember;
}

interface MealSlot {
  id: string;
  dayOfWeek: number;
  mealType: string;
  recipeId: string | null;
  notes: string;
  recipe: Recipe | null;
  mealAttendees: MealAttendee[];
}

interface WeekPlan {
  id: string;
  weekStartDate: string;
  mealSlots: MealSlot[];
}

interface MealPreference {
  id: string;
  dayOfWeek: number;
  label: string;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDate(dateStr: string, dayOffset: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + dayOffset);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getWeekString(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  return d.toISOString().split("T")[0];
}

// ─── Component ───────────────────────────────────────────

export default function PlannerClient() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [preferences, setPreferences] = useState<MealPreference[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [recipeModal, setRecipeModal] = useState<MealSlot | null>(null);
  const [attendeeModal, setAttendeeModal] = useState<MealSlot | null>(null);
  const [prefModal, setPrefModal] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());

  // Preference form
  const [prefDay, setPrefDay] = useState(0);
  const [prefLabel, setPrefLabel] = useState("");

  const fetchPlan = useCallback(async () => {
    const weekDate = getWeekString(weekOffset);
    const res = await fetch(`/api/week-plans?week=${weekDate}`);
    const data = await res.json();
    setPlan(data);
  }, [weekOffset]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [membersRes, recipesRes, prefsRes] = await Promise.all([
      fetch("/api/family-members"),
      fetch("/api/recipes"),
      fetch("/api/meal-preferences"),
    ]);
    setAllMembers(await membersRes.json());
    setAllRecipes(await recipesRes.json());
    setPreferences(await prefsRes.json());
    await fetchPlan();
    setLoading(false);
  }, [fetchPlan]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchPlan();
  }, [weekOffset, fetchPlan]);

  // ─── Assign recipe to slot ─────────────────────────

  async function assignRecipe(slotId: string, recipeId: string | null) {
    await fetch(`/api/meal-slots/${slotId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    });
    setRecipeModal(null);
    setRecipeSearch("");
    fetchPlan();
  }

  // ─── Update attendees ──────────────────────────────

  function openAttendeeModal(slot: MealSlot) {
    setSelectedAttendees(new Set(slot.mealAttendees.map((a) => a.familyMemberId)));
    setAttendeeModal(slot);
  }

  async function saveAttendees() {
    if (!attendeeModal) return;
    await fetch(`/api/meal-slots/${attendeeModal.id}/attendees`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyMemberIds: [...selectedAttendees] }),
    });
    setAttendeeModal(null);
    fetchPlan();
  }

  function toggleAttendee(memberId: string) {
    setSelectedAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  // ─── Preferences ───────────────────────────────────

  async function addPreference() {
    if (!prefLabel.trim()) return;
    await fetch("/api/meal-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek: prefDay, label: prefLabel.trim() }),
    });
    setPrefLabel("");
    const res = await fetch("/api/meal-preferences");
    setPreferences(await res.json());
  }

  async function deletePreference(id: string) {
    await fetch(`/api/meal-preferences/${id}`, { method: "DELETE" });
    const res = await fetch("/api/meal-preferences");
    setPreferences(await res.json());
  }

  // ─── Helpers ───────────────────────────────────────

  function getPrefsForDay(day: number): MealPreference[] {
    return preferences.filter((p) => p.dayOfWeek === day);
  }

  function getSlotForDay(day: number): MealSlot | undefined {
    return plan?.mealSlots.find((s) => s.dayOfWeek === day);
  }

  const filteredRecipes = allRecipes.filter((r) => {
    const q = recipeSearch.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.tags.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="flex justify-center py-20 text-zinc-400">Loading…</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Meal Planner</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Plan your week — assign meals and set who&apos;s eating
          </p>
        </div>
        <button
          onClick={() => setPrefModal(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          ⚙️ Day Preferences
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="rounded-lg p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          ← Prev
        </button>
        <div className="text-center">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Week of {plan ? new Date(plan.weekStartDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "..."}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-3 text-xs text-orange-600 hover:text-orange-700 font-medium"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="rounded-lg p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* 7-Day Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {DAY_NAMES.map((dayName, dayIndex) => {
          const slot = getSlotForDay(dayIndex);
          const prefs = getPrefsForDay(dayIndex);
          const attendees = slot?.mealAttendees ?? [];
          const dateLabel = plan ? formatDate(plan.weekStartDate, dayIndex) : "";

          return (
            <div
              key={dayIndex}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Day header */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  <span className="hidden md:inline">{DAY_SHORT[dayIndex]}</span>
                  <span className="md:hidden">{dayName}</span>
                </div>
                <div className="text-xs text-zinc-500">{dateLabel}</div>
              </div>

              {/* Preferences hints */}
              {prefs.length > 0 && (
                <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-wrap gap-1">
                    {prefs.map((p) => (
                      <span key={p.id} className="text-xs bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-full px-2 py-0.5">
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meal content */}
              <div className="px-3 py-3 flex-1 space-y-2">
                {/* Recipe */}
                {slot?.recipe ? (
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{slot.recipe.title}</p>
                      <p className="text-xs text-zinc-500">⏱ {slot.recipe.prepTimeMinutes} min</p>
                    </div>
                    <button
                      onClick={() => assignRecipe(slot.id, null)}
                      className="text-zinc-400 hover:text-red-500 text-xs shrink-0"
                      title="Remove meal"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No meal planned</p>
                )}

                {/* Attendees */}
                {attendees.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {attendees.map((a) => (
                      <span key={a.id} className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full px-2 py-0.5">
                        {a.familyMember.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 flex gap-1">
                <button
                  onClick={() => slot && setRecipeModal(slot)}
                  className="flex-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md py-1.5 transition-colors"
                >
                  {slot?.recipe ? "Change" : "＋ Meal"}
                </button>
                <button
                  onClick={() => slot && openAttendeeModal(slot)}
                  className="flex-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md py-1.5 transition-colors"
                >
                  👥 Who
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Recipe Assignment Modal ─────────────────── */}
      {recipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <h2 className="text-lg font-semibold mb-1 text-zinc-900 dark:text-zinc-100">
              Assign Meal — {DAY_NAMES[recipeModal.dayOfWeek]}
            </h2>
            <p className="text-sm text-zinc-500 mb-4">Pick a recipe from your collection</p>

            <input
              type="text"
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              placeholder="Search recipes…"
              autoFocus
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
            />

            <div className="overflow-y-auto flex-1 space-y-1">
              {filteredRecipes.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">
                  {allRecipes.length === 0 ? "No recipes yet — add some in the Recipes page" : "No matching recipes"}
                </p>
              ) : (
                filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => assignRecipe(recipeModal.id, recipe.id)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      recipeModal.recipeId === recipe.id
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    <div className="font-medium">{recipe.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      ⏱ {recipe.prepTimeMinutes} min
                      {recipe.tags && ` · ${recipe.tags}`}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              {recipeModal.recipeId && (
                <button
                  onClick={() => assignRecipe(recipeModal.id, null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Remove Meal
                </button>
              )}
              <button
                onClick={() => { setRecipeModal(null); setRecipeSearch(""); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Attendee Modal ──────────────────────────── */}
      {attendeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-1 text-zinc-900 dark:text-zinc-100">
              Who&apos;s Eating — {DAY_NAMES[attendeeModal.dayOfWeek]}
            </h2>
            <p className="text-sm text-zinc-500 mb-4">Select family members eating this night</p>

            {allMembers.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">No family members yet — add some first</p>
            ) : (
              <div className="space-y-2 mb-5">
                {allMembers.map((member) => (
                  <label
                    key={member.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      selectedAttendees.has(member.id)
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAttendees.has(member.id)}
                      onChange={() => toggleAttendee(member.id)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{member.name}</span>
                    {member.sensitivities && (
                      <span className="text-xs text-zinc-400 ml-auto">{member.sensitivities}</span>
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setSelectedAttendees(new Set(allMembers.map((m) => m.id)));
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setAttendeeModal(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAttendees}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Preferences Modal ───────────────────────── */}
      {prefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-1 text-zinc-900 dark:text-zinc-100">Day Preferences</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Set recurring preferences like &quot;Fish on Monday&quot; or &quot;Pasta Friday&quot;
            </p>

            {/* Add new preference */}
            <div className="flex gap-2 mb-4">
              <select
                value={prefDay}
                onChange={(e) => setPrefDay(Number(e.target.value))}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <input
                type="text"
                value={prefLabel}
                onChange={(e) => setPrefLabel(e.target.value)}
                placeholder="e.g. Fish, Pasta, Slow cooker"
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPreference(); } }}
              />
              <button
                onClick={addPreference}
                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
              >
                Add
              </button>
            </div>

            {/* List existing preferences */}
            <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
              {preferences.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-3">No preferences set yet</p>
              ) : (
                DAY_NAMES.map((dayName, dayIndex) => {
                  const dayPrefs = getPrefsForDay(dayIndex);
                  if (dayPrefs.length === 0) return null;
                  return (
                    <div key={dayIndex} className="flex items-center gap-2 py-1">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-24 shrink-0">{dayName}</span>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {dayPrefs.map((p) => (
                          <span key={p.id} className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-full px-2.5 py-0.5">
                            {p.label}
                            <button onClick={() => deletePreference(p.id)} className="hover:text-red-500">✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPrefModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
