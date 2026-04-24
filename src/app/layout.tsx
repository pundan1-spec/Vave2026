import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAVE BIW Studio",
  description:
    "Automotive Body-in-White VAVE idea generator — steel grade, welding, joining, coating, weight and cost integrated.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <header className="border-b border-steel-700 bg-steel-900/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-accent-500 grid place-items-center font-bold text-steel-900">
                V
              </div>
              <div>
                <div className="text-sm font-semibold text-steel-50">VAVE BIW Studio</div>
                <div className="text-xs text-steel-400">
                  Steel grade · thickness · welding · joining · coating
                </div>
              </div>
            </div>
            <nav className="text-xs text-steel-300 flex gap-4">
              <a href="/" className="hover:text-accent-500">Generate</a>
              <a href="/sources" className="hover:text-accent-500">Data sources</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-6 py-8 text-xs text-steel-500">
          Data anchored to WorldAutoSteel AHSS Application Guidelines & AHSS Insights
          (public references cited per row).
        </footer>
      </body>
    </html>
  );
}
