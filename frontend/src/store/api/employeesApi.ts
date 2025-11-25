import { baseApi } from "./baseApi";

export interface Employee {
  employee_id: number;
  role_id: number;
  first_name: string;
  last_name: string;
  joined_date: string;
  is_active: boolean;
  salary: number;
  role?: {
    role_id: number;
    role_name: string;
    ranking: number;
  };
}

export interface EmployeeCreate {
  role_id: number;
  first_name: string;
  last_name: string;
  is_active: boolean;
  salary: number;
}

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<Employee[], void>({
      query: () => "/employees",
      providesTags: ["Employees"],
    }),
    getEmployee: builder.query<Employee, number>({
      query: (id) => `/employees/${id}`,
      providesTags: (result, error, id) => [{ type: "Employees", id }],
    }),
    createEmployee: builder.mutation<Employee, EmployeeCreate>({
      query: (body) => ({
        url: "/employees",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employees"],
    }),
    updateEmployee: builder.mutation<
      Employee,
      { id: number; data: EmployeeCreate }
    >({
      query: ({ id, data }) => ({
        url: `/employees/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Employees", id },
        "Employees",
      ],
    }),
    deleteEmployee: builder.mutation<void, number>({
      query: (id) => ({
        url: `/employees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employees"],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeesApi;
