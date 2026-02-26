"use client";

import Link from "next/link";
import type { FC, ReactNode, SVGProps } from "react";
import styles from "./StellarFooter.module.css";

// ─── Public types ─────────────────────────────────────────────────────────────
// Exported so consumers can build typed config objects outside this file.

export interface FooterNavLink {
  label: string;
  /** Internal path (e.g. "/pricing") → next/link. Full URL → plain <a>. */
  href: string;
}

export interface FooterNavSection {
  title: string;
  links: FooterNavLink[];
}

export interface FooterSocialLink {
  label: string;
  href: string;
  /** Any React node — SVG icon, next/image, etc. */
  icon: ReactNode;
}

export interface FooterBrand {
  /** Text before the accent word. Include trailing space if needed. */
  name?: string;
  /** Accent-coloured portion rendered in brand green. */
  accentName?: string;
  /** Route for the logo / brand-name link. Defaults to "/". */
  logoHref?: string;
  /**
   * Tagline rendered below the brand name.
   * Pass `null` to suppress the tagline entirely.
   */
  tagline?: string | null;
  /** Slot for a custom logo node. Defaults to the built-in SVG mark. */
  logo?: ReactNode;
}

export interface StellarFooterProps {
  /** Brand block configuration. Merged with defaults — override only what you need. */
  brand?: FooterBrand;
  /** Navigation columns. Defaults to Product + Company. Pass `[]` to hide all nav. */
  navSections?: FooterNavSection[];
  /** Social icon links. Defaults to Twitter, GitHub, Discord. Pass `[]` to hide. */
  socialLinks?: FooterSocialLink[];
  /** Name used in the copyright line. Defaults to "Stellar BatchPay". */
  copyrightOwner?: string;
  /** Override the copyright year. Defaults to `new Date().getFullYear()`. */
  copyrightYear?: number;
}

// ─── Built-in icon components (also exported for re-use) ──────────────────────

export const TwitterIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
    aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const GitHubIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
    aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const DiscordIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"
    aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.033.05a19.9 19.9 0 0 0 5.993 3.03.079.079 0 0 0 .085-.026 14.09 14.09 0 0 0 1.226-1.994.075.075 0 0 0-.041-.104 13.2 13.2 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.030zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

// ─── Default data (also exported so callers can extend rather than replace) ───

export const DEFAULT_BRAND: Required<FooterBrand> = {
  name: "Stellar ",
  accentName: "BatchPay",
  logoHref: "/",
  tagline:
    "Streamline bulk cryptocurrency payments on the Stellar blockchain with enterprise-grade security and efficiency.",
  logo: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
      aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill="#22C55E" />
      <path d="M8 14.5L18 9L28 14.5L18 20L8 14.5Z" fill="white" fillOpacity="0.9" />
      <path d="M8 19L18 24.5L28 19" stroke="white" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" />
      <path d="M8 22.5L18 28L28 22.5" stroke="white" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" />
    </svg>
  ),
};

export const DEFAULT_NAV_SECTIONS: FooterNavSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export const DEFAULT_SOCIAL_LINKS: FooterSocialLink[] = [
  { label: "Twitter", href: "https://twitter.com", icon: <TwitterIcon /> },
  { label: "GitHub", href: "https://github.com", icon: <GitHubIcon /> },
  { label: "Discord", href: "https://discord.com", icon: <DiscordIcon /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

// ─── Private sub-components ───────────────────────────────────────────────────

function BrandBlock({ brand }: { brand: Required<FooterBrand> }) {
  return (
    <div className={styles.brand}>
      <Link
        href={brand.logoHref}
        className={styles.brandName}
        aria-label={`${brand.name}${brand.accentName} — home`}
      >
        {brand.logo}
        <span className={styles.wordmark}>
          <span className={styles.wordmarkRegular}>{brand.name}</span>
          <span className={styles.wordmarkAccent}>{brand.accentName}</span>
        </span>
      </Link>

      {brand.tagline != null && (
        <p className={styles.description}>{brand.tagline}</p>
      )}
    </div>
  );
}

function NavColumn({ section }: { section: FooterNavSection }) {
  const headingId = `footer-nav-${section.title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <nav className={styles.navColumn} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.navTitle}>
        {section.title}
      </h3>
      <ul className={styles.navList} role="list">
        {section.links.map(({ label, href }) => (
          <li key={label}>
            {isExternal(href) ? (
              <a href={href} className={styles.navLink}
                target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            ) : (
              <Link href={href} className={styles.navLink}>
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BottomBar({
  owner,
  year,
  socialLinks,
}: {
  owner: string;
  year: number;
  socialLinks: FooterSocialLink[];
}) {
  return (
    <div className={styles.bottom}>
      <p className={styles.copyright}>
        © {year} {owner}. All rights reserved.
      </p>

      {socialLinks.length > 0 && (
        <div className={styles.social} role="list">
          {socialLinks.map(({ label, href, icon }) => (
            <a
              key={label}
              href={href}
              className={styles.socialLink}
              aria-label={`${label} (opens in new tab)`}
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
            >
              {icon}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function StellarFooter({
  brand = {},
  navSections = DEFAULT_NAV_SECTIONS,
  socialLinks = DEFAULT_SOCIAL_LINKS,
  copyrightOwner = "Stellar BatchPay",
  copyrightYear = new Date().getFullYear(),
}: StellarFooterProps) {
  const resolvedBrand: Required<FooterBrand> = { ...DEFAULT_BRAND, ...brand };

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>

        <div className={styles.upper}>
          <BrandBlock brand={resolvedBrand} />

          {navSections.length > 0 && (
            <div className={styles.navGroup}>
              {navSections.map((section) => (
                <NavColumn key={section.title} section={section} />
              ))}
            </div>
          )}
        </div>

        <hr className={styles.divider} aria-hidden="true" />

        <BottomBar owner={copyrightOwner} year={copyrightYear} socialLinks={socialLinks} />
      </div>
    </footer>
  );
}
