import { baseApi } from "./baseApi";

export interface Branch {
    branch_id: number;
    name: string;
    address: string;
    phone: string;
    is_active: boolean;
}

export interface BranchCreate {
    name: string;
    address: string;
    phone: string;
    is_active?: boolean;
}

export const branchesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getBranches: builder.query<Branch[], void>({
            query: () => "/branches",
            providesTags: ["Branches"],
        }),
        getBranch: builder.query<Branch, number>({
            query: (id) => `/branches/${id}`,
            providesTags: (result, error, id) => [{ type: "Branches", id }],
        }),
        createBranch: builder.mutation<Branch, BranchCreate>({
            query: (body) => ({
                url: "/branches",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Branches"],
        }),
        updateBranch: builder.mutation<Branch, { id: number; data: BranchCreate }>({
            query: ({ id, data }) => ({
                url: `/branches/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Branches", id },
                "Branches",
            ],
        }),
        deleteBranch: builder.mutation<Branch, number>({
            query: (id) => ({
                url: `/branches/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Branches"],
        }),
    }),
});

export const {
    useGetBranchesQuery,
    useGetBranchQuery,
    useCreateBranchMutation,
    useUpdateBranchMutation,
    useDeleteBranchMutation,
} = branchesApi;
