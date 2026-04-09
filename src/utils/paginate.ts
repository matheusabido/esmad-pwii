export function paginate<T>(data: {
  rows: T[];
  total: number;
  page: number;
  pageSize?: number;
}) {
  return {
    data: data.rows,
    meta: {
      total: data.total,
      page: data.page,
      lastPage: Math.max(Math.ceil(data.total / (data.pageSize ?? 20)), 1),
    },
  };
}
