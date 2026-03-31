import PlannerClient from "./PlannerClient";

export const metadata = {
  title: "Meal Planner — Snax",
};

export default function PlannerPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <PlannerClient />
    </main>
  );
}
