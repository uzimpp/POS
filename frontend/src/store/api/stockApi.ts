import { baseApi } from "./baseApi";

export interface Stock {
  stock_id: number;
  stk_name: string;
  amount_remaining: string;
  unit: string;
}

export interface StockCreate {
  stk_name: string;
  amount_remaining: string;
  unit: string;
}

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query<Stock[], void>({
      query: () => "/stock",
      providesTags: ["Stock"],
    }),
    getStockItem: builder.query<Stock, number>({
      query: (id) => `/stock/${id}`,
      providesTags: (result, error, id) => [{ type: "Stock", id }],
    }),
    createStockItem: builder.mutation<Stock, StockCreate>({
      query: (body) => ({
        url: "/stock",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stock"],
    }),
    updateStockItem: builder.mutation<Stock, { id: number; data: StockCreate }>(
      {
        query: ({ id, data }) => ({
          url: `/stock/${id}`,
          method: "PUT",
          body: data,
        }),
        invalidatesTags: (result, error, { id }) => [
          { type: "Stock", id },
          "Stock",
        ],
      }
    ),
    deleteStockItem: builder.mutation<void, number>({
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
  useGetStockItemQuery,
  useCreateStockItemMutation,
  useUpdateStockItemMutation,
  useDeleteStockItemMutation,
} = stockApi;
