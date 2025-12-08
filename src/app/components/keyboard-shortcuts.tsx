"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Initialize from localStorage after mount
  useEffect(() => {
    const hasSeenHint =
      localStorage.getItem("keyboard-shortcuts-hint-seen") === "true";

    if (!hasSeenHint) {
      //acceptable for use in modal rendering
      setShowHint(true);

      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem("keyboard-shortcuts-hint-seen", "true");
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  function dismissHint() {
    setShowHint(false);
    localStorage.setItem("keyboard-shortcuts-hint-seen", "true");
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        dismissHint();
        return;
      }

      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }

      if (e.key === "n") {
        e.preventDefault();
        router.push("/inventory/new");
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="text"][placeholder*="Search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        } else {
          router.push("/inventory");
        }
        return;
      }

      if (e.key === "g") {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === "h") {
            e2.preventDefault();
            router.push("/");
          } else if (e2.key === "i") {
            e2.preventDefault();
            router.push("/inventory");
          } else if (e2.key === "r") {
            e2.preventDefault();
            router.push("/reports");
          } else if (e2.key === "c") {
            e2.preventDefault();
            router.push("/ai/chat");
          }
          window.removeEventListener("keydown", handleSecondKey);
        };

        window.addEventListener("keydown", handleSecondKey);
        setTimeout(
          () => window.removeEventListener("keydown", handleSecondKey),
          1000
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <>
      {showHint && (
        <div className="fixed bottom-4 left-4 z-40 animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-400">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono">
              ?
            </kbd>
            <span>for keyboard shortcuts</span>
            <button
              onClick={dismissHint}
              className="ml-1 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <ShortcutGroup title="Navigation">
                <Shortcut keys={["g", "h"]} description="Go to Dashboard" />
                <Shortcut keys={["g", "i"]} description="Go to Inventory" />
                <Shortcut keys={["g", "r"]} description="Go to Reports" />
                <Shortcut keys={["g", "c"]} description="Go to AI Chat" />
              </ShortcutGroup>

              <ShortcutGroup title="Actions">
                <Shortcut keys={["n"]} description="New watch" />
                <Shortcut keys={["/"]} description="Focus search" />
              </ShortcutGroup>

              <ShortcutGroup title="General">
                <Shortcut keys={["?"]} description="Show/hide shortcuts" />
                <Shortcut keys={["Esc"]} description="Close dialogs" />
              </ShortcutGroup>
            </div>

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                ?
              </kbd>{" "}
              anytime to toggle this menu
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Shortcut({
  keys,
  description,
}: {
  keys: string[];
  description: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {description}
      </span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300 min-w-[24px] text-center">
              {key}
            </kbd>
            {i < keys.length - 1 && (
              <span className="text-gray-400 dark:text-gray-500 mx-1 text-xs">
                then
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
