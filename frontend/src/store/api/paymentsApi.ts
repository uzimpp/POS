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
  paid_price: string;
  points_used?: number;
  payment_method: string;
  payment_ref?: string | null;
  paid_timestamp?: string | null;
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<Payment[], void>({
      query: () => "/payments",
      providesTags: ["Payments"],
    }),
    getPayment: builder.query<Payment, number>({
      query: (orderId) => `/payments/${orderId}`,
      providesTags: (result, error, orderId) => [
        { type: "Payments", id: orderId },
      ],
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
    deletePayment: builder.mutation<void, number>({
      query: (orderId) => ({
        url: `/payments/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Payments", "Orders"],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} = paymentsApi;
