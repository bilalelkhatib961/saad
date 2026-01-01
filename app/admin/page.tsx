import { Suspense } from "react";
import AdminPageClient from "./admin-page-client";

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="px-6 py-12 text-white">Loading...</p>}>
      <AdminPageClient />
    </Suspense>
  );
}
