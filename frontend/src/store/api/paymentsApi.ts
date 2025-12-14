import { baseApi } from "./baseApi";

export interface Payment {
  order_id: number;
  paid_price: string;
  points_used: number;
  payment_method: string;
  payment_ref: string | null;
  paid_timestamp: string | null;
  order?: {
    order_id: number;
    total_price: string;
    status: string;
  };
}

export interface PaymentCreate {
  order_id: number;
  paid_price?: string | null; // Optional - backend will calculate from order.total_price and points_used
  points_used?: number;
  payment_method: string;
  payment_ref?: string | null;
  paid_timestamp?: string | null;
}

export interface PaymentFilters {
  payment_method?: string;
  year?: number;
  month?: number;
  quarter?: number;
  search?: string;
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<Payment[], PaymentFilters | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
          if (params.payment_method) {
            searchParams.append("payment_method", params.payment_method);
          }
          if (params.year) {
            searchParams.append("year", params.year.toString());
          }
          if (params.month) {
            searchParams.append("month", params.month.toString());
          }
          if (params.quarter) {
            searchParams.append("quarter", params.quarter.toString());
          }
          if (params.search) {
            searchParams.append("search", params.search);
          }
        }
        const queryString = searchParams.toString();
        return `/payments${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Payments"],
    }),
    getPayment: builder.query<Payment, number>({
      query: (orderId) => `/payments/${orderId}`,
      providesTags: (result, error, orderId) => [
        { type: "Payments", id: orderId },
      ],
    }),
    getPaymentStats: builder.query<
      { count: number; total_revenue: number },
      PaymentFilters | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
          if (params.payment_method) {
            searchParams.append("payment_method", params.payment_method);
          }
          if (params.year) {
            searchParams.append("year", params.year.toString());
          }
          if (params.month) {
            searchParams.append("month", params.month.toString());
          }
          if (params.quarter) {
            searchParams.append("quarter", params.quarter.toString());
          }
          if (params.search) {
            searchParams.append("search", params.search);
          }
        }
        const queryString = searchParams.toString();
        return `/payments/stats${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Payments"],
    }),
    createPayment: builder.mutation<Payment, PaymentCreate>({
      query: (body) => ({
        url: "/payments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payments", "Orders"],
    }),
    updatePayment: builder.mutation<
      Payment,
      { orderId: number; data: Omit<PaymentCreate, "order_id"> }
    >({
      query: ({ orderId, data }) => ({
        url: `/payments/${orderId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Payments", id: orderId },
        "Payments",
        "Orders",
      ],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useGetPaymentStatsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} = paymentsApi;
