import { baseApi } from "./baseApi";

export interface Employee {
  employee_id: number;
  role_id: number;
  first_name: string;
  last_name: string;
  joined_date: string;
  is_active: boolean;
  salary: number;
  branch_id?: number;
  role?: {
    role_id: number;
    role_name: string;
    tier: number;
  };
  branch?: {
    branch_id: number;
    name: string;
  };
}

export interface EmployeeCreate {
  role_id: number;
  branch_id: number;
  first_name: string;
  last_name: string;
  is_active: boolean;
  salary: number;
}

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<Employee[], { branch_ids?: number[] } | void>({
      query: (params) => {
        let url = "/employees";
        if (params && params.branch_ids && params.branch_ids.length > 0) {
          const queryString = params.branch_ids
            .map((id) => `branch_ids=${id}`)
            .join("&");
          url += `?${queryString}`;
        }
        return url;
      },
      providesTags: ["Employees"],
    }),
    getEmployeesByBranch: builder.query<Employee[], number>({
      query: (branchId) => `/employees/?branch_id=${branchId}`,
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
    deleteEmployee: builder.mutation<Employee, number>({
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
  useGetEmployeesByBranchQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeesApi;
