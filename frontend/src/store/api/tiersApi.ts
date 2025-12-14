import { baseApi } from "./baseApi";

export interface Tier {
  tier_id: number;
  tier_name: string;
  tier: number; // 0..3
  discount_percentage?: number; // 0..100, up to 2 decimals
  minimum_point_required?: number; // >= 0, up to 2 decimals
}

export interface TierCreate {
  tier_name: string;
  tier: number;
  discount_percentage?: number;
  minimum_point_required?: number;
}

export const tiersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTiers: builder.query<Tier[], void>({
      query: () => "/tiers",
      providesTags: ["Tiers"],
    }),
    getTier: builder.query<Tier, number>({
      query: (id) => `/tiers/${id}`,
      providesTags: (result, error, id) => [{ type: "Tiers", id }],
    }),
    createTier: builder.mutation<Tier, TierCreate>({
      query: (body) => ({
        url: "/tiers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tiers"],
    }),
    updateTier: builder.mutation<Tier, { id: number; data: TierCreate }>({
      query: ({ id, data }) => ({
        url: `/tiers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tiers", id },
        "Tiers",
      ],
    }),
    deleteTier: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/tiers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tiers"],
    }),
  }),
});

export const {
  useGetTiersQuery,
  useGetTierQuery,
  useCreateTierMutation,
  useUpdateTierMutation,
  useDeleteTierMutation,
} = tiersApi;
