import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
  }),
  // Refetch data when component remounts or navigates back to page
  refetchOnMountOrArgChange: true,
  // Optional: also refetch when window regains focus
  refetchOnFocus: true,
  tagTypes: [
    "Roles",
    "Employees",
    "Memberships",
    "Tiers",
    "Stock",
    "Menus",
    "Ingredients",
    "Recipe",
    "Orders",
    "OrderItems",
    "Payments",
    "Branches",
    "Dashboard",
    "Analytics",
  ],
  endpoints: () => ({}),
});
