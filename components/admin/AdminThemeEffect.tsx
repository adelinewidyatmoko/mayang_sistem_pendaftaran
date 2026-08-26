"use client";

import { useEffect, useLayoutEffect } from "react";

// Radix portals (Dialog/AlertDialog/Select/DropdownMenu) render into
// document.body, outside whatever DOM subtree the admin layout wraps — so
// scoping the admin color tokens to a wrapper <div> class doesn't reach
// them. Setting the attribute on <html> instead means every portal (still
// a descendant of <html>, just not of the wrapper div) inherits the tokens
// too, since CSS custom properties cascade through the real DOM tree.
//
// useLayoutEffect (not useEffect) so the attribute is set before the
// browser paints — otherwise every admin page load would briefly flash the
// public site's colors (card/primary/etc. tokens don't exist outside the
// admin scope, so components using them would render unstyled for a frame).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function AdminThemeEffect() {
  useIsomorphicLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", "admin");
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  return null;
}
