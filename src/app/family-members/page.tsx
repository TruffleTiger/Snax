import FamilyMembersClient from "./FamilyMembersClient";

export const metadata = {
  title: "Family Members — Snax",
};

export default function FamilyMembersPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <FamilyMembersClient />
    </main>
  );
}
