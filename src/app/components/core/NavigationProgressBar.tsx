"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeUrl, setActiveUrl] = useState(`${pathname}?${searchParams.toString()}`);

  const currentUrl = `${pathname}?${searchParams.toString()}`;
  if (currentUrl !== activeUrl) {
    setActiveUrl(currentUrl);
    if (loading) {
      setLoading(false);
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // Same page click ignore
      if (href === pathname || href === window.location.pathname) return;

      setLoading(true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] overflow-hidden bg-primary-100/50">
      <div className="h-full bg-gradient-to-r from-primary-500 via-ai-500 to-warning-400 animate-[navProgress_1.2s_ease-in-out_infinite]" />
      <style jsx>{`
        @keyframes navProgress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 70%;
            margin-left: 15%;
          }
          100% {
            width: 100%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
