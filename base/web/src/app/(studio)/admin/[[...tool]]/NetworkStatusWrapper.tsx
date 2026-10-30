"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { VscDebugDisconnect, VscRefresh, VscLoading } from "react-icons/vsc";

import Button from "@/ui/components/button";

interface NetworkStatusWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const subscribeToNetworkStatus = (handleChange: () => void) => {
  window.addEventListener("online", handleChange);
  window.addEventListener("offline", handleChange);

  return () => {
    window.removeEventListener("online", handleChange);
    window.removeEventListener("offline", handleChange);
  };
};

const getNetworkStatus = () => navigator.onLine;

// The page is prerendered in Node, whose global `navigator` has no `onLine`: without a
// server value the static HTML showed "Studio offline" until hydration.
const getServerNetworkStatus = () => null;

const StudioLoader = () => (
  <div
    role="status"
    className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-800 text-neutral-300"
  >
    <VscLoading aria-hidden className="text-36 motion-safe:animate-spin" />
    <p className="text-14 leading-normal">Loading Studio…</p>
  </div>
);

const NetworkStatusWrapper = ({ children, fallback }: NetworkStatusWrapperProps) => {
  const isBrowserOnline = useSyncExternalStore(
    subscribeToNetworkStatus,
    getNetworkStatus,
    getServerNetworkStatus,
  );
  const [hasReachedServer, setHasReachedServer] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setHasReachedServer(false);
      setIsRetrying(false);
    };

    window.addEventListener("offline", handleOffline);

    return () => window.removeEventListener("offline", handleOffline);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      const response = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-cache",
      });

      if (response.ok) {
        setHasReachedServer(true);
      }
    } catch (error) {
      console.warn("Connection test failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  if (isBrowserOnline === null) {
    return <StudioLoader />;
  }

  if (!isBrowserOnline && !hasReachedServer) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-neutral-800 text-neutral-100">
          <div className="mx-auto max-w-2xl p-8 text-center">
            <div className="mb-8">
              <VscDebugDisconnect className="mx-auto animate-pulse text-8xl text-neutral-400" />
            </div>

            <h1 className="mb-6 text-36 leading-tight font-bold tracking-tight text-neutral-100 md:text-44">
              STUDIO OFFLINE
            </h1>

            <p className="mx-auto mb-8 max-w-lg text-16 leading-relaxed text-neutral-300 md:text-18">
              The Studio requires an internet connection to function properly. Check your
              connection and try again to continue building high-performance websites.
            </p>

            <div className="mb-6">
              <Button
                variant="primary"
                className="inline-flex items-center gap-2"
                onClick={handleRetry}
              >
                {isRetrying ? (
                  <>
                    <VscLoading className="animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <VscRefresh />
                    Try Again
                  </>
                )}
              </Button>
            </div>

            <div className="text-12 leading-normal text-neutral-500 md:text-14">
              This page will automatically refresh when your connection is restored.
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

export default NetworkStatusWrapper;
