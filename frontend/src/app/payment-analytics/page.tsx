"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import Link from "next/link";
import PaymentStats from "@/components/analytics/payment/PaymentStats";
import PaymentMethodShareChart from "@/components/analytics/payment/PaymentMethodShareChart";
import ATVByMethodChart from "@/components/analytics/payment/ATVByMethodChart";
import WalletShareByTierChart from "@/components/analytics/payment/WalletShareByTierChart";
import CashInflowHeatmap from "@/components/analytics/payment/CashInflowHeatmap";

export default function PaymentAnalyticsPage() {
    const [period, setPeriod] = useState("30days");

    return (
        <Layout>
            <div className="pb-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/payment"
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                                Payment Analytics
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-7">Deep dive into revenue, methods, and trends</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                        {["7days", "30days", "1year"].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${period === p
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {p === "7days"
                                    ? "7 Days"
                                    : p === "30days"
                                        ? "30 Days"
                                        : "Yearly"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 1. Stats Cards */}
                <PaymentStats period={period} />

                {/* 2. Charts Row 1: Share & ATV */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="h-full">
                        <PaymentMethodShareChart period={period} />
                    </div>
                    <div className="h-full">
                        <ATVByMethodChart period={period} />
                    </div>
                </div>

                {/* 3. Charts Row 2: Wallet Share by Tier */}
                <div className="mb-6">
                    <WalletShareByTierChart period={period} />
                </div>

                {/* 4. Charts Row 3: Cash Inflow Heatmap */}
                <div className="mb-6">
                    <CashInflowHeatmap period={period} />
                </div>
            </div>
        </Layout>
    );
}
