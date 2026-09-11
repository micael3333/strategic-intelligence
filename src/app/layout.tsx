import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AllMarkets Intelligence", template: "%s · AllMarkets Intelligence" },
  description: "Evidence-first strategic signal discovery across procurement, trade, energy, and corporate filings.",
};

const links = [
  ["/", "Overview"],
  ["/funnel", "Funnel"],
  ["/awards", "Awards"],
  ["/opportunities", "Opportunities"],
  ["/innovation", "Innovation"],
  ["/intelligence", "Intelligence"],
  ["/companies", "Companies"],
  ["/sources", "Sources"],
  ["/themes", "Themes"],
  ["/methodology", "Methodology"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link className="brand" href="/" aria-label="AllMarkets Intelligence home">
            <span className="brand-mark" aria-hidden="true">AM</span>
            <span>
              <strong>AllMarkets Intelligence</strong>
              <small>Evidence-first strategic signals</small>
            </span>
          </Link>
          <nav aria-label="Primary navigation">
            {links.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
          </nav>
          <span className="phase-badge">Engine V2 · Local</span>
        </header>
        <main className="app-shell">{children}</main>
        <footer>
          <span>Starts with the strategic problem.</span>
          <span>No investment recommendations · Official data remains auditable</span>
        </footer>
      </body>
    </html>
  );
}
