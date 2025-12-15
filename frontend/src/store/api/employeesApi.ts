import { baseApi } from "./baseApi";

export interface Employee {
  employee_id: number;
  role_id: number;
  first_name: string;
  last_name: string;
  joined_date: string;
  is_deleted: boolean;
  salary: number;
  branch_id?: number;
  role?: {
    role_id: number;
    role_name: string;
    seniority: number;
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
  is_deleted: boolean;
  salary: number;
}

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<
      Employee[],
      {
        branch_ids?: number[];
        is_deleted?: boolean;
        role_ids?: number[];
        salary_min?: number;
        salary_max?: number;
        joined_from?: string;
        joined_to?: string;
      } | void
    >({
      query: (params) => {
        let url = "/employees";
        const queryParams: string[] = [];
        if (params && params.branch_ids && params.branch_ids.length > 0) {
          queryParams.push(
            params.branch_ids.map((id) => `branch_ids=${id}`).join("&")
          );
        }
        if (params && params.is_deleted !== undefined) {
          queryParams.push(`is_deleted=${params.is_deleted}`);
        }
        if (params && params.role_ids && params.role_ids.length > 0) {
          queryParams.push(
            params.role_ids.map((id) => `role_ids=${id}`).join("&")
          );
        }
        if (params && params.salary_min !== undefined) {
          queryParams.push(`salary_min=${params.salary_min}`);
        }
        if (params && params.salary_max !== undefined) {
          queryParams.push(`salary_max=${params.salary_max}`);
        }
        if (params && params.joined_from) {
          queryParams.push(`joined_from=${params.joined_from}`);
        }
        if (params && params.joined_to) {
          queryParams.push(`joined_to=${params.joined_to}`);
        }
        if (queryParams.length > 0) {
          url += `?${queryParams.join("&")}`;
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
