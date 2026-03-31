import PantryClient from "./PantryClient";

export const metadata = {
  title: "Pantry — Snax",
};

export default function PantryPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <PantryClient />
    </main>
  );
}
