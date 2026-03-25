import useSWR from "swr";
import { userApi } from "@/src/lib/api";

export function useUser(id: number | string | undefined) {
  return useSWR(
    id ? `/users/${id}` : null,
    () => userApi.getById(id!).then((res) => res.data)
  );
}
