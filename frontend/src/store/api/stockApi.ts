import { baseApi } from "./baseApi";

export interface Stock {
  stock_id: number;
  branch_id: number;
  ingredient_id: number;
  amount_remaining: number;
  is_deleted: boolean;
  branch?: {
    branch_id: number;
    name: string;
  };
  ingredient?: {
    ingredient_id: number;
    name: string;
    base_unit: string;
  };
}

export interface StockCreate {
  branch_id: number;
  ingredient_id: number;
  amount_remaining: number;
  is_deleted?: boolean;
}

export interface StockFilters {
  branch_ids?: number[];
  out_of_stock_only?: boolean;
  is_deleted?: boolean;
}

export interface StockMovement {
  movement_id: number;
  stock_id: number;
  qty_change: number;
  reason: string;
  employee_id?: number;
  order_id?: number;
  note?: string;
  created_at: string;
  stock?: Stock;
  employee?: {
    employee_id: number;
    first_name: string;
    last_name: string;
  };
  order?: {
    order_id: number;
  };
}

export interface StockMovementCreate {
  stock_id: number;
  qty_change: number;
  reason: string;
  employee_id?: number;
  order_id?: number;
  note?: string;
}

export interface StockMovementFilters {
  branch_id?: number;
  stock_id?: number;
  reason?: string;
}

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query<Stock[], StockFilters | void>({
      query: (params) => {
        let url = "/stock";
        const queryParams: string[] = [];
        if (params && params.branch_ids && params.branch_ids.length > 0) {
          queryParams.push(
            params.branch_ids.map((id) => `branch_ids=${id}`).join("&")
          );
        }
        if (params && params.out_of_stock_only) {
          queryParams.push("out_of_stock_only=true");
        }
        if (params && params.is_deleted !== undefined) {
          queryParams.push(`is_deleted=${params.is_deleted}`);
        }
        if (queryParams.length > 0) {
          url += `?${queryParams.join("&")}`;
        }
        return url;
      },
      providesTags: ["Stock"],
    }),
    getStockByBranch: builder.query<Stock[], number>({
      query: (branchId) => `/stock/?branch_id=${branchId}`,
      providesTags: ["Stock"],
    }),
    createStock: builder.mutation<Stock, StockCreate>({
      query: (body) => ({
        url: "/stock",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stock"],
    }),
    deleteStock: builder.mutation<Stock, number>({
      query: (id) => ({
        url: `/stock/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Stock"],
    }),
    getOutOfStockItems: builder.query<
      Stock[],
      { branch_ids?: number[] } | void
    >({
      query: (params) => {
        let url = "/stock/out-of-stock";
        if (params && params.branch_ids && params.branch_ids.length > 0) {
          const queryString = params.branch_ids
            .map((id) => `branch_ids=${id}`)
            .join("&");
          url += `?${queryString}`;
        }
        return url;
      },
      providesTags: ["Stock"],
    }),
    getOutOfStockCount: builder.query<
      { count: number; out_of_stock_count: number },
      { branch_ids?: number[] } | void
    >({
      query: (params) => {
        let url = "/stock/out-of-stock/count";
        if (params && params.branch_ids && params.branch_ids.length > 0) {
          const queryString = params.branch_ids
            .map((id) => `branch_ids=${id}`)
            .join("&");
          url += `?${queryString}`;
        }
        return url;
      },
      providesTags: ["Stock"],
    }),
    // Stock Movements
    getStockMovements: builder.query<
      StockMovement[],
      StockMovementFilters | void
    >({
      query: (params) => {
        let url = "/stock/movements";
        const queryParams: string[] = [];
        if (params?.branch_id) {
          queryParams.push(`branch_id=${params.branch_id}`);
        }
        if (params?.stock_id) {
          queryParams.push(`stock_id=${params.stock_id}`);
        }
        if (params?.reason) {
          queryParams.push(`reason=${params.reason}`);
        }
        if (queryParams.length > 0) {
          url += `?${queryParams.join("&")}`;
        }
        return url;
      },
      providesTags: ["Stock"],
    }),
    createStockMovement: builder.mutation<StockMovement, StockMovementCreate>({
      query: (body) => ({
        url: "/stock/movements",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stock"],
    }),
  }),
});

export const {
  useGetStockQuery,
  useGetStockByBranchQuery,
  useCreateStockMutation,
  useDeleteStockMutation,
  useGetOutOfStockItemsQuery,
  useGetOutOfStockCountQuery,
  useGetStockMovementsQuery,
  useCreateStockMovementMutation,
} = stockApi;
