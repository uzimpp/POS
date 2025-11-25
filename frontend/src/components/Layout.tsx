"use client";

import Link from "next/link";
import { useAppSelector } from "../store/hooks";

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((state) => state.theme.colors);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <header
        className="border-b shadow-sm"
        style={{ borderColor: theme.border, backgroundColor: theme.background }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
              POS System
            </h1>
            <nav className="flex gap-4">
              <Link
                href="/"
                className="px-3 py-2 rounded hover:opacity-80"
                style={{ backgroundColor: theme.primary, color: "white" }}
              >
                Dashboard
              </Link>
              <Link
                href="/orders"
                className="px-3 py-2 rounded hover:opacity-80"
                style={{ backgroundColor: theme.secondary, color: "white" }}
              >
                Orders
              </Link>
              <Link
                href="/menu-items"
                className="px-3 py-2 rounded hover:opacity-80"
                style={{ backgroundColor: theme.secondary, color: "white" }}
              >
                Menu Items
              </Link>
              <Link
                href="/stock"
                className="px-3 py-2 rounded hover:opacity-80"
                style={{ backgroundColor: theme.secondary, color: "white" }}
              >
                Stock
              </Link>
              <Link
                href="/memberships"
                className="px-3 py-2 rounded hover:opacity-80"
                style={{ backgroundColor: theme.secondary, color: "white" }}
              >
                Memberships
              </Link>
              <Link
                href="/employees"
                className="px-3 py-2 rounded hover:opacity-80"
                style={{ backgroundColor: theme.secondary, color: "white" }}
              >
                Employees
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
