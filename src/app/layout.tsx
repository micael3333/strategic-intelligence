import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Strategic Intelligence", template: "%s · Strategic Intelligence" },
  description: "Evidence-first strategic procurement intelligence foundation.",
};

const links = [
  ["/", "Overview"],
  ["/funnel", "Funnel"],
  ["/sources", "Sources"],
  ["/themes", "Themes"],
  ["/methodology", "Methodology"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Strategic Intelligence home">
            <span className="brand-mark" aria-hidden="true">SI</span>
            <span>
              <strong>Strategic Intelligence</strong>
              <small>Evidence-first procurement signals</small>
            </span>
          </Link>
          <nav aria-label="Primary navigation">
            {links.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
          </nav>
          <span className="phase-badge">Phase 1 · Local</span>
        </header>
        <main className="app-shell">{children}</main>
        <footer>
          <span>Starts with the strategic problem.</span>
          <span>No investment recommendations · No live provider claims</span>
        </footer>
      </body>
    </html>
  );
}
