# PR Description: Implement Custom 404 (Not Found) Page

## Overview
This PR implements a custom 404 "Page Not Found" route for the Stellar BatchPay frontend. The implementation aligns with the project's design system, featuring a modern dark-themed aesthetic with radial glows and integrated navigation.

## Changes

### Core Implementation
- **Custom Not Found Page**: Implemented `app/not-found.tsx` as a reusable Next.js route page.
- **Global Navigation**: Integrated the existing `Navbar` component from `@/components/landing/navbar` for site-wide consistency.

### Design Features
- **Visuals**:
  - Large faded "404" background watermark (`text-[#10B981]/30`).
  - Dark-themed container (`bg-[#020B0D]`) with background radial glow effects.
  - Centered messaging: "The page you're looking for may have been moved, deleted, or entered incorrectly."
- **Buttons & Interactions**:
  - **Return to Dashboard**: Primary button styled with `#10B981` and Home icon.
  - **Go to Homepage**: Secondary button with a Globe icon and hover transition to `#10B981`.
- **Secondary Links**: Added "View Documentation" and "Contact Support" footer links with hover effects.

### Layout & Responsiveness
- Implemented responsive design ensuring the page looks great on mobile, tablet, and desktop.
- Adjusted vertical height for medium screens (`md:h-[90vh]`) to maintain layout balance.

## Verification
- Verified production build compatibility.
- Manually tested navigation links for Dashboard, Homepage, and secondary support links.
- Confirmed responsiveness across different device breakpoints.
