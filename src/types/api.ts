export type ApiResponse<TData> = {
  data: TData;
  message?: string;
  status?: string;
};

export type PaginatedData<TData> = {
  data: TData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedListResponse<TData> = {
  data: TData[];
  pagination: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
};
