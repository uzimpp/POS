import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
  }),
  tagTypes: [
    "Roles",
    "Employees",
    "Memberships",
    "Stock",
    "MenuItems",
    "MenuIngredients",
    "Orders",
    "OrderItems",
    "Payments",
  ],
  endpoints: () => ({}),
});
