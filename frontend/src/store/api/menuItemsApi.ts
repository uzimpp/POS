import { baseApi } from "./baseApi";

export interface MenuItem {
  menu_item_id: number;
  name: string;
  type: string;
  description: string | null;
  price: string;
  category: string;
  is_available: boolean;
}

export interface MenuItemCreate {
  name: string;
  type: string;
  description?: string | null;
  price: string;
  category: string;
  is_available: boolean;
}

export const menuItemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenuItems: builder.query<MenuItem[], void>({
      query: () => "/menu-items/",
      providesTags: ["MenuItems"],
    }),
    getMenuItem: builder.query<MenuItem, number>({
      query: (id) => `/menu-items/${id}`,
      providesTags: (result, error, id) => [{ type: "MenuItems", id }],
    }),
    createMenuItem: builder.mutation<MenuItem, MenuItemCreate>({
      query: (body) => ({
        url: "/menu-items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MenuItems"],
    }),
    updateMenuItem: builder.mutation<
      MenuItem,
      { id: number; data: MenuItemCreate }
    >({
      query: ({ id, data }) => ({
        url: `/menu-items/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "MenuItems", id },
        "MenuItems",
      ],
    }),
    deleteMenuItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/menu-items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MenuItems"],
    }),
  }),
});

export const {
  useGetMenuItemsQuery,
  useGetMenuItemQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
} = menuItemsApi;
