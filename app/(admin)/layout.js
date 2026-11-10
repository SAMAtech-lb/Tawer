/* Root layout of the content dashboard (/admin). The dashboard's own labels are English. */
import "remixicon/fonts/remixicon.css";
import "./admin.css";
import { fontVariables } from "@/lib/fonts";

export const metadata = { title: "Tawer Admin", robots: { index: false, follow: false } };
export const viewport = { themeColor: "#6A0DAD", width: "device-width", initialScale: 1 };

export default function AdminLayout({ children }) {
  return (
    // suppressHydrationWarning: ignore attributes that browser extensions add to <html>/<body> (only these two tags).
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
