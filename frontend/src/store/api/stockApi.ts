import { baseApi } from "./baseApi";

export interface Stock {
  stock_id: number;
  branch_id: number;
  stk_name: string;
  amount_remaining: number;
  unit: string;
  branch?: {
    branch_id: number;
    name: string;
  };
}

export interface StockCreate {
  branch_id: number;
  stk_name: string;
  amount_remaining: number;
  unit: string;
}

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query<Stock[], { branch_ids?: number[] } | void>({
      query: (params) => {
        let url = "/stock";
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
  }),
});

export const {
  useGetStockQuery,
  useGetStockByBranchQuery,
  useCreateStockMutation,
  useUpdateStockMutation,
  useDeleteStockMutation,
} = stockApi;
