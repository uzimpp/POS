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
        getWalletShareByTier: builder.query({
            query: (params) => ({
                url: "/analytics/wallet-share-by-tier",
                params,
            }),
            providesTags: ["Analytics"],
        }),
        getCashInflowHeatmap: builder.query({
            query: (params) => ({
                url: "/analytics/cash-inflow-heatmap",
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
    useGetWalletShareByTierQuery,
    useGetCashInflowHeatmapQuery,
} = analyticsApi;
