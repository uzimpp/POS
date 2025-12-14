import { baseApi } from "./baseApi";

export interface Stock {
  stock_id: number;
  branch_id: number;
  ingredient_id: number;
  amount_remaining: number;
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
}

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query<
      Stock[],
      { branch_ids?: number[]; out_of_stock_only?: boolean } | void
    >({
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
    updateStock: builder.mutation<Stock, { id: number; data: StockCreate }>({
      query: ({ id, data }) => ({
        url: `/stock/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Stock"],
    }),
    deleteStock: builder.mutation<{ message: string; id: number }, number>({
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
  }),
});

export const {
  useGetStockQuery,
  useGetStockByBranchQuery,
  useCreateStockMutation,
  useUpdateStockMutation,
  useDeleteStockMutation,
  useGetOutOfStockItemsQuery,
  useGetOutOfStockCountQuery,
} = stockApi;
