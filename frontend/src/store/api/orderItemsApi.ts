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
  order_id: number;
  menu_item_id: number;
  quantity: number;
  status?: string;
}

export interface OrderItemStatusUpdate {
  status: string; // PREPARING, DONE, CANCELLED
}

export const orderItemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrderItems: builder.query<OrderItem[], void>({
      query: () => "/order-items",
      providesTags: ["OrderItems"],
    }),
    getOrderItem: builder.query<OrderItem, number>({
      query: (id) => `/order-items/${id}`,
      providesTags: (result, error, id) => [{ type: "OrderItems", id }],
    }),
    getOrderItemsByOrder: builder.query<OrderItem[], number>({
      query: (orderId) => `/order-items/order/${orderId}`,
      providesTags: (result, error, orderId) => [
        { type: "OrderItems", id: `LIST-${orderId}` },
      ],
    }),
    createOrderItem: builder.mutation<OrderItem, OrderItemCreate>({
      query: (body) => ({
        url: "/order-items",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { order_id }) => [
        { type: "OrderItems", id: `LIST-${order_id}` },
        "OrderItems",
        "Orders",
      ],
    }),
    updateOrderItem: builder.mutation<
      OrderItem,
      { id: number; data: OrderItemCreate }
    >({
      query: ({ id, data }) => ({
        url: `/order-items/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { data }) => [
        { type: "OrderItems", id: `LIST-${data.order_id}` },
        "OrderItems",
        "Orders",
      ],
    }),
    updateOrderItemStatus: builder.mutation<
      OrderItem,
      { id: number; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/order-items/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => {
        const tags: Array<
          | { type: "OrderItems"; id: number }
          | { type: "Orders"; id: number }
          | "OrderItems"
          | "Orders"
          | "Stock"
        > = [{ type: "OrderItems", id }, "OrderItems", "Orders", "Stock"];
        // Invalidate specific order if we have the order_id from result
        if (result?.order_id) {
          tags.push({ type: "Orders", id: result.order_id });
        }
        return tags;
      },
    }),
  }),
});

export const {
  useGetOrderItemsQuery,
  useGetOrderItemQuery,
  useGetOrderItemsByOrderQuery,
  useCreateOrderItemMutation,
  useUpdateOrderItemMutation,
  useUpdateOrderItemStatusMutation,
} = orderItemsApi;
