import { baseApi } from "./baseApi";

export const analyticsApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getPaymentAnalyticsStats: builder.query({
            query: (params) => ({
                url: "/analytics/payment-stats",
                params,
            }),
            providesTags: ["Analytics"],
        }),
        getPaymentMethodShare: builder.query({
            query: (params) => ({
                url: "/analytics/payment-method-share",
                params,
            }),
            providesTags: ["Analytics"],
        }),
        getATVByMethod: builder.query({
            query: (params) => ({
                url: "/analytics/atv-by-method",
                params,
            }),
            providesTags: ["Analytics"],
        }),
        getBranchPaymentProfile: builder.query({
            query: (params) => ({
                url: "/analytics/branch-payment-profile",
                params,
            }),
            providesTags: ["Analytics"],
        }),
        getRevenueStream: builder.query({
            query: (params) => ({
                url: "/analytics/revenue-stream",
                params,
            }),
            providesTags: ["Analytics"],
        }),
    }),
});

export const {
    useGetPaymentAnalyticsStatsQuery,
    useGetPaymentMethodShareQuery,
    useGetATVByMethodQuery,
    useGetBranchPaymentProfileQuery,
    useGetRevenueStreamQuery,
} = analyticsApi;
