import { baseApi } from "./baseApi";

export interface Recipe {
  id: number;
  menu_item_id: number;
  ingredient_id: number;
  qty_per_unit: string;
  menu_item?: {
    menu_item_id: number;
    name: string;
  };
  ingredient?: {
    ingredient_id: number;
    name: string;
    base_unit: string;
  };
}

export interface RecipeCreate {
  menu_item_id: number;
  ingredient_id: number;
  qty_per_unit: string;
}

export const recipeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecipes: builder.query<Recipe[], void>({
      query: () => "/recipe",
      providesTags: ["Recipe"],
    }),
    getRecipe: builder.query<Recipe, number>({
      query: (id) => `/recipe/${id}`,
      providesTags: (result, error, id) => [{ type: "Recipe", id }],
    }),
    getRecipesByMenu: builder.query<Recipe[], number>({
      query: (menuItemId) => `/recipe/menu-item/${menuItemId}`,
      providesTags: (result, error, menuItemId) => [
        { type: "Recipe", id: `LIST-${menuItemId}` },
      ],
    }),
    createRecipe: builder.mutation<Recipe, RecipeCreate>({
      query: (body) => ({
        url: "/recipe",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { menu_item_id }) => [
        { type: "Recipe", id: `LIST-${menu_item_id}` },
        "Recipe",
      ],
    }),
    updateRecipe: builder.mutation<Recipe, { id: number; data: RecipeCreate }>({
      query: ({ id, data }) => ({
        url: `/recipe/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { data }) => [
        { type: "Recipe", id: `LIST-${data.menu_item_id}` },
        "Recipe",
      ],
    }),
    deleteRecipe: builder.mutation<void, number>({
      query: (id) => ({
        url: `/recipe/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Recipe"],
    }),
  }),
});

export const {
  useGetRecipesQuery,
  useGetRecipeQuery,
  useGetRecipesByMenuQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} = recipeApi;
