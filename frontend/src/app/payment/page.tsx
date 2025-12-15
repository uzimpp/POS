"use client";

import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { useGetPaymentsQuery, PaymentFilters } from "@/store/api/paymentsApi";

export default function PaymentPage() {
  const currentYear = new Date().getFullYear();

  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [selectedQuarter, setSelectedQuarter] = useState<number | "">("");
  const [filterType, setFilterType] = useState<"month" | "quarter" | "year">(
    "year"
  );
  const [filterMinPaid, setFilterMinPaid] = useState<string>("");
  const [filterMaxPaid, setFilterMaxPaid] = useState<string>("");
  const [filterPaidFrom, setFilterPaidFrom] = useState<string>("");
  const [filterPaidTo, setFilterPaidTo] = useState<string>("");
  const [filterMembershipOnly, setFilterMembershipOnly] =
    useState<string>("all");

  // Build filter object
  const filters: PaymentFilters | undefined = useMemo(() => {
    const filterObj: PaymentFilters = {};

    if (filterMethod !== "all") {
      filterObj.payment_method = filterMethod;
    }

    // Include year if selected
    if (selectedYear) {
      filterObj.year = Number(selectedYear);
    }

    // Month and quarter can work with or without year
    if (filterType === "month" && selectedMonth) {
      filterObj.month = Number(selectedMonth);
    } else if (filterType === "quarter" && selectedQuarter) {
      filterObj.quarter = Number(selectedQuarter);
    }

    if (searchTerm.trim()) {
      filterObj.search = searchTerm.trim();
    }

    if (filterMinPaid) filterObj.min_paid = Number(filterMinPaid);
    if (filterMaxPaid) filterObj.max_paid = Number(filterMaxPaid);
    if (filterPaidFrom) filterObj.paid_from = `${filterPaidFrom}T00:00:00`;
    if (filterPaidTo) filterObj.paid_to = `${filterPaidTo}T23:59:59`;
    if (filterMembershipOnly !== "all") {
      filterObj.membership_only = filterMembershipOnly === "yes";
    }

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [
    filterMethod,
    selectedYear,
    selectedMonth,
    selectedQuarter,
    filterType,
    searchTerm,
    filterMinPaid,
    filterMaxPaid,
    filterPaidFrom,
    filterPaidTo,
    filterMembershipOnly,
  ]);

  const { data: payments, isLoading, error } = useGetPaymentsQuery(filters);

  // Backend filters payments, so no need for client-side filtering
  const filteredPayments = payments || [];

  // Calculate total revenue from filtered payments
  const totalRevenue = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => {
      return sum + parseFloat(payment.paid_price || "0");
    }, 0);
  }, [filteredPayments]);

  // Membership proxy: payments using points are considered membership-related
  const membershipPayments = filteredPayments.filter(
    (p) => p.payment_method?.toUpperCase() === "POINTS"
  );
  const membershipCount = membershipPayments.length;
  const totalPayments = filteredPayments.length;

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Generate quarter options
  const quarterOptions = [
    { value: 1, label: "Q1 (Jan-Mar)" },
    { value: 2, label: "Q2 (Apr-Jun)" },
    { value: 3, label: "Q3 (Jul-Sep)" },
    { value: 4, label: "Q4 (Oct-Dec)" },
  ];

  const handleClearFilters = () => {
    setFilterMethod("all");
    setSearchTerm("");
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedQuarter("");
    setFilterType("year");
  };

  const hasActiveFilters =
    filterMethod !== "all" ||
    searchTerm ||
    selectedYear !== "" ||
    selectedMonth !== "" ||
    selectedQuarter !== "" ||
    filterMinPaid ||
    filterMaxPaid ||
    filterPaidFrom ||
    filterPaidTo ||
    filterMembershipOnly !== "all";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading payments...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading payments</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
              <p className="text-gray-600 mt-2">
                View and manage payment records
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Filters Section */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Order ID or Payment Ref"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Min Paid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Paid
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filterMinPaid}
                  onChange={(e) => setFilterMinPaid(e.target.value)}
                  placeholder="e.g., 500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Max Paid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Paid
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filterMaxPaid}
                  onChange={(e) => setFilterMaxPaid(e.target.value)}
                  placeholder="e.g., 5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Paid From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid From
                </label>
                <input
                  type="date"
                  value={filterPaidFrom}
                  onChange={(e) => setFilterPaidFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Paid To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid To
                </label>
                <input
                  type="date"
                  value={filterPaidTo}
                  onChange={(e) => setFilterPaidTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Membership Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membership Payments
                </label>
                <select
                  value={filterMembershipOnly}
                  onChange={(e) => setFilterMembershipOnly(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="yes">Membership only</option>
                  <option value="no">Non-membership only</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="QR">QR</option>
                  <option value="POINTS">Points</option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedYear(val ? Number(val) : "");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Years</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Type Toggle - always visible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter By
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("year");
                      setSelectedMonth("");
                      setSelectedQuarter("");
                    }}
                    className={`flex-1 px-2 py-2 text-sm border rounded-md transition-colors ${
                      filterType === "year"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {selectedYear ? "Year" : "All"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("month");
                      setSelectedQuarter("");
                    }}
                    className={`flex-1 px-2 py-2 text-sm border rounded-md transition-colors ${
                      filterType === "month"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("quarter");
                      setSelectedMonth("");
                    }}
                    className={`flex-1 px-2 py-2 text-sm border rounded-md transition-colors ${
                      filterType === "quarter"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Quarter
                  </button>
                </div>
              </div>

              {/* Month Dropdown - show when filter type is month */}
              {filterType === "month" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month {!selectedYear && "(All Years)"}
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) =>
                      setSelectedMonth(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Months</option>
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quarter Dropdown - show when filter type is quarter */}
              {filterType === "quarter" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quarter {!selectedYear && "(All Years)"}
                  </label>
                  <select
                    value={selectedQuarter}
                    onChange={(e) =>
                      setSelectedQuarter(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Quarters</option>
                    {quarterOptions.map((quarter) => (
                      <option key={quarter.value} value={quarter.value}>
                        {quarter.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-700 text-sm font-medium">
              Total Payments
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {totalPayments}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-700 text-sm font-medium">
              Total Revenue
            </div>
            <div className="text-2xl font-bold text-green-800">
              {totalRevenue.toFixed(2)}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-700 text-sm font-medium">
              Membership (points) payments
            </div>
            <div className="text-2xl font-bold text-purple-800">
              {membershipCount} / {totalPayments || 1}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments && filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{payment.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ฿{parseFloat(payment.paid_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.points_used || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.payment_ref || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paid_timestamp)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
