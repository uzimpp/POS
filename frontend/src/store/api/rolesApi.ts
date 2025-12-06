import { baseApi } from "./baseApi";

export interface Role {
  role_id: number;
  role_name: string;
  tier: number;
}

export interface RoleCreate {
  role_name: string;
  tier: number;
}

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<Role[], void>({
      query: () => "/roles",
      providesTags: ["Roles"],
    }),
    getRole: builder.query<Role, number>({
      query: (id) => `/roles/${id}`,
      providesTags: (result, error, id) => [{ type: "Roles", id }],
    }),
    createRole: builder.mutation<Role, RoleCreate>({
      query: (body) => ({
        url: "/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),
    updateRole: builder.mutation<Role, { id: number; data: RoleCreate }>({
      query: ({ id, data }) => ({
        url: `/roles/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Roles", id },
        "Roles",
      ],
    }),
    deleteRole: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesApi;
