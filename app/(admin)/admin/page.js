/* /admin: the content dashboard. The JSON defaults are passed in, so boxes are filled even for text that
 * hasn't been saved to the database yet. Login and saving go through /api/*. */
import { DEFAULTS } from "@/lib/defaults";
import AdminApp from "@/components/admin/AdminApp";

export default function AdminPage() {
  return <AdminApp defaults={DEFAULTS} />;
}
