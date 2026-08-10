import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminPage() {
  return (
    <PageShell title="Admin Dashboard" description="Platform stats and game management.">
      <AdminDashboard />
    </PageShell>
  );
}
