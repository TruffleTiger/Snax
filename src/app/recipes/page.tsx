import RecipesClient from "./RecipesClient";

export const metadata = {
  title: "Recipes — Snax",
};

export default function RecipesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <RecipesClient />
    </main>
  );
}
