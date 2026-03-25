import useSWR from "swr";
import { categoryApi } from "@/src/lib/api";

export function useCategories() {
  return useSWR("/categories", () =>
    categoryApi.list().then((res) => res.data)
  );
}

export function usePopularCategories(limit = 10) {
  return useSWR(`/categories/popular?limit=${limit}`, () =>
    categoryApi.popular(limit).then((res) => res.data)
  );
}
