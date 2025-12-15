import { baseApi } from "./baseApi";

// Import Menu type from menuApi instead of duplicating
import { Menu } from "./menuApi";
import type { Membership } from "./membershipsApi";
export type MenuItem = Menu;

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
  branch_id: number;
  membership_id: number | null;
  employee_id: number;
  created_at: string;
  total_price: string;
  status: string;
  order_type: string;
  // Full membership object with optional nested tier (includes discount_percentage)
  membership?: Membership | null;
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
  branch_id: number;
  membership_id?: number | null;
  employee_id: number;
  order_type: string;
  status?: string;
  order_items: OrderItemCreate[];
}

export interface OrderCreateEmpty {
  branch_id: number;
  employee_id: number;
  order_type?: string; // DINE_IN, TAKEAWAY, DELIVERY
}

export interface OrderFilters {
  status?: string;
  order_type?: string;
  min_total?: string | number;
  created_from?: string;
  created_to?: string;
  branch_id?: number;
  employee_id?: number;
  membership_id?: number;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], OrderFilters | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
          if (params.status) searchParams.append("status", params.status);
          if (params.order_type)
            searchParams.append("order_type", params.order_type);
          if (params.min_total !== undefined)
            searchParams.append("min_total", String(params.min_total));
          if (params.created_from)
            searchParams.append("created_from", params.created_from);
          if (params.created_to)
            searchParams.append("created_to", params.created_to);
          if (params.branch_id !== undefined)
            searchParams.append("branch_id", String(params.branch_id));
          if (params.employee_id !== undefined)
            searchParams.append("employee_id", String(params.employee_id));
          if (params.membership_id !== undefined)
            searchParams.append("membership_id", String(params.membership_id));
        }
        const queryString = searchParams.toString();
        return `/orders${queryString ? `?${queryString}` : ""}`;
      },
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
    createEmptyOrder: builder.mutation<Order, OrderCreateEmpty>({
      query: (body) => ({
        url: "/orders/empty",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders"],
    }),
    cancelOrder: builder.mutation<Order, number>({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Orders", id },
        "Orders",
        "OrderItems",
      ],
    }),
      updateOrderMembership: builder.mutation<Order, { id: number; membership_id: number | null }>(
        {
          query: ({ id, membership_id }) => ({
            url: `/orders/${id}/membership`,
            method: "PUT",
            body: { membership_id },
          }),
          invalidatesTags: (result, error, { id }) => [
            { type: "Orders", id },
            "Orders",
          ],
        }
      ),
    getAvailableMenus: builder.query<MenuItem[], void>({
      query: () => "/menu?available_only=true",
      providesTags: ["Menus"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useCreateEmptyOrderMutation,
  useCancelOrderMutation,
  useGetAvailableMenusQuery,
  useUpdateOrderMembershipMutation,
} = ordersApi;
