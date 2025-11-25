import { baseApi } from "./baseApi";

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  menu_item_id: number;
  status: string; // PREPARING, DONE, CANCELLED
  quantity: number;
  unit_price: string;
  line_total: string;
  menu_item?: {
    menu_item_id: number;
    name: string;
    type: string;
    price: string;
  };
}

export interface OrderItemCreate {
  menu_item_id: number;
  quantity: number;
  unit_price: string;
}

export interface Order {
  order_id: number;
  membership_id: number | null;
  employee_id: number;
  created_at: string;
  total_price: string;
  status: string;
  order_type: string;
  membership?: {
    membership_id: number;
    name: string;
    phone: string;
    points_balance: number;
    membership_tier: string;
  } | null;
  employee?: {
    employee_id: number;
    first_name: string;
    last_name: string;
  } | null;
  order_items?: OrderItem[];
  payment?: {
    order_id: number;
    paid_price: string;
    points_used: number;
    payment_method: string;
    payment_ref: string | null;
    paid_timestamp: string | null;
  } | null;
}

export interface OrderCreate {
  membership_id?: number | null;
  employee_id: number;
  order_type: string;
  status?: string;
  order_items: OrderItemCreate[];
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => "/orders",
      providesTags: ["Orders"],
    }),
    getOrder: builder.query<Order, number>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Orders", id }],
    }),
    createOrder: builder.mutation<Order, OrderCreate>({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "OrderItems"],
    }),
    updateOrder: builder.mutation<Order, { id: number; data: OrderCreate }>({
      query: ({ id, data }) => ({
        url: `/orders/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Orders", id },
        "Orders",
        "OrderItems",
      ],
    }),
    deleteOrder: builder.mutation<void, number>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Orders", "OrderItems"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;
