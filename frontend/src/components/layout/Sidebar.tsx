"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { menuItems } from "@/constants/menuItems";

interface SidebarProps {
  onWidthChange?: (width: number) => void;
  isMobile?: boolean;
}

export default function Sidebar({
  onWidthChange,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Measure sidebar width and notify parent
  useEffect(() => {
    const updateWidth = () => {
      if (!isMobile && sidebarRef.current && onWidthChange) {
        onWidthChange(sidebarRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (!isMobile && sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [onWidthChange, isCollapsed, isMobile]);

  if (isMobile) {
    return null; // Mobile sidebar can be implemented later if needed
  }

  return (
    <aside
      ref={sidebarRef}
      className={`hidden md:flex fixed left-0 top-0 h-full bg-black shadow-lg transition-all duration-300 ease-in-out z-50 overflow-visible flex-col p-4 gap-y-2 text-white ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-x-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-white"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-6 h-6 transition-transform duration-300 ease-in-out ${
              isCollapsed ? "rotate-0" : "rotate-180"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.4}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {!isCollapsed && (
          <Link href="/" className="text-white text-xl font-bold text-nowrap">
            POS System
          </Link>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-y-2 overflow-x-visible pt-4 border-t border-white/20">
        {menuItems.map(
          (item: { href: string; label: string; icon: React.ReactNode }) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-x-3 p-3 rounded-lg transition-colors relative group ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-white hover:bg-gray-800 hover:text-white"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 text-xs rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-100 shadow-lg">
                      {item.label}
                    </span>
                  )}
                </Link>
              </div>
            );
          }
        )}
      </nav>
    </aside>
  );
}
