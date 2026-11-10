/* Required by Next.js. The website (/) and the dashboard (/admin) are served as full HTML documents by their
 * route handlers (app/route.js, app/admin/route.js), so this layout is only used for Next's own pages (404). */
export const metadata = { title: "Tawer Academy" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
