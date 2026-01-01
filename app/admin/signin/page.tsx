import { Suspense } from "react";
import AdminSignInClient from "./admin-signin-client";

export default function AdminSignInPage() {
  return (
    <Suspense fallback={<p className="px-6 py-12 text-white">Loading...</p>}>
      <AdminSignInClient />
    </Suspense>
  );
}
