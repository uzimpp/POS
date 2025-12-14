import { baseApi } from "./baseApi";

export interface Menu {
  menu_item_id: number;
  name: string;
  type: string;
  description: string | null;
  price: string;
  category: string;
  is_available: boolean;
}

export interface MenuCreate {
  name: string;
  type: string;
  description?: string | null;
  price: string;
  category: string;
  is_available: boolean;
}

export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenus: builder.query<
      Menu[],
      { available_only?: boolean; category?: string } | void
    >({
      query: (params) => {
        let url = "/menu";
        const queryParams: string[] = [];
        if (params?.available_only) {
          queryParams.push("available_only=true");
        }
        if (params?.category) {
          queryParams.push(`category=${params.category}`);
        }
        if (queryParams.length > 0) {
          url += `?${queryParams.join("&")}`;
        }
        return url;
      },
      providesTags: ["Menus"],
    }),
    getMenu: builder.query<Menu, number>({
      query: (id) => `/menu/${id}`,
      providesTags: (result, error, id) => [{ type: "Menus", id }],
    }),
    createMenu: builder.mutation<Menu, MenuCreate>({
      query: (body) => ({
        url: "/menu",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Menus"],
    }),
    updateMenu: builder.mutation<Menu, { id: number; data: MenuCreate }>({
      query: ({ id, data }) => ({
        url: `/menu/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Menus", id },
        "Menus",
      ],
    }),
    deleteMenu: builder.mutation<void, number>({
      query: (id) => ({
        url: `/menu/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Menus"],
    }),
  }),
});

export const {
  useGetMenusQuery,
  useGetMenuQuery,
  useCreateMenuMutation,
  useUpdateMenuMutation,
  useDeleteMenuMutation,
} = menuApi;
