import { baseApi } from "./baseApi";

export interface DashboardStats {
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  total_revenue: number;
  total_menus: number;
  available_menus: number;
  total_employees: number;
  total_memberships: number;
  out_of_stock_count: number;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<
      DashboardStats,
      { branch_ids?: number[] } | void
    >({
      query: (params) => {
        let url = "/dashboard/stats";
        if (params && params.branch_ids && params.branch_ids.length > 0) {
          const queryString = params.branch_ids
            .map((id) => `branch_ids=${id}`)
            .join("&");
          url += `?${queryString}`;
        }
        return url;
      },
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
