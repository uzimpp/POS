import { baseApi } from "./baseApi";
import { Tier } from "./tiersApi";

export interface Membership {
  membership_id: number;
  name: string;
  phone: string;
  email: string | null;
  joined_at: string;
  points_balance: number;
  tier_id: number;      // FK to tiers.tier_id
  tier?: Tier | null;   // optional nested object if backend returns it
}

export interface MembershipCreate {
  name: string;
  phone: string;
  email?: string | null;
  points_balance?: number;
  tier_id: number;
}

export const membershipsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMemberships: builder.query<Membership[], void>({
      query: () => "/memberships",
      providesTags: ["Memberships"],
    }),
    getMembership: builder.query<Membership, number>({
      query: (id) => `/memberships/${id}`,
      providesTags: (result, error, id) => [{ type: "Memberships", id }],
    }),
    getMembershipByPhone: builder.query<Membership | null, string>({
      query: (phone) => `/memberships/phone/${phone}`,
      providesTags: (result, error, phone) => [
        { type: "Memberships", id: phone },
      ],
    }),
    createMembership: builder.mutation<Membership, MembershipCreate>({
      query: (body) => ({
        url: "/memberships",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Memberships"],
    }),
    updateMembership: builder.mutation<
      Membership,
      { id: number; data: MembershipCreate }
    >({
      query: ({ id, data }) => ({
        url: `/memberships/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Memberships", id },
        "Memberships",
      ],
    }),
    deleteMembership: builder.mutation<void, number>({
      query: (id) => ({
        url: `/memberships/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Memberships"],
    }),
  }),
});

export const {
  useGetMembershipsQuery,
  useGetMembershipQuery,
  useGetMembershipByPhoneQuery,
  useCreateMembershipMutation,
  useUpdateMembershipMutation,
  useDeleteMembershipMutation,
} = membershipsApi;
