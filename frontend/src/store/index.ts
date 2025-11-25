import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";
import { baseApi } from "./api/baseApi";
import { rolesApi } from "./api/rolesApi";
import { employeesApi } from "./api/employeesApi";
import { membershipsApi } from "./api/membershipsApi";
import { stockApi } from "./api/stockApi";
import { menuItemsApi } from "./api/menuItemsApi";
import { ordersApi } from "./api/ordersApi";
import { paymentsApi } from "./api/paymentsApi";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
