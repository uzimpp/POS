"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "../store/hooks";
import Sidebar from "./Sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((state) => state.theme.colors);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default width when expanded
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Sidebar */}
      <Sidebar onWidthChange={setSidebarWidth} />

      {/* Main Content */}
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isMobile ? "0px" : `${sidebarWidth}px`,
        }}
      >
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
