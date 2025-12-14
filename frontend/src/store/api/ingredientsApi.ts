import { baseApi } from "./baseApi";

export interface Ingredient {
  ingredient_id: number;
  name: string;
  base_unit: string;
  is_deleted: boolean;
}

export interface IngredientCreate {
  name: string;
  base_unit: string;
  is_deleted?: boolean;
}

export const ingredientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIngredients: builder.query<
      Ingredient[],
      { is_deleted?: boolean } | void
    >({
      query: (params) => {
        let url = "/ingredients";
        if (params && params.is_deleted !== undefined) {
          url += `?is_deleted=${params.is_deleted}`;
        }
        return url;
      },
      providesTags: ["Ingredients"],
    }),
    getIngredient: builder.query<Ingredient, number>({
      query: (id) => `/ingredients/${id}`,
      providesTags: (result, error, id) => [{ type: "Ingredients", id }],
    }),
    createIngredient: builder.mutation<Ingredient, IngredientCreate>({
      query: (body) => ({
        url: "/ingredients",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ingredients"],
    }),
    updateIngredient: builder.mutation<
      Ingredient,
      { id: number; data: IngredientCreate }
    >({
      query: ({ id, data }) => ({
        url: `/ingredients/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Ingredients", id },
        "Ingredients",
      ],
    }),
    deleteIngredient: builder.mutation<void, number>({
      query: (id) => ({
        url: `/ingredients/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ingredients"],
    }),
  }),
});

export const {
  useGetIngredientsQuery,
  useGetIngredientQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
} = ingredientsApi;
