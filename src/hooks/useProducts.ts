import useSWR from "swr";
import { productApi } from "@/src/lib/api";
import { toProductDisplay } from "@/src/types/ProductDisplay";

export function useProducts(params?: Record<string, string>) {
  const key = `/products?${new URLSearchParams(params ?? {})}`;
  return useSWR(key, () =>
    productApi.list(params).then((res) => res.data.map(toProductDisplay))
  );
}

export function useProduct(id: string | number | undefined) {
  return useSWR(
    id ? `/products/${id}` : null,
    () => productApi.getById(id!).then((res) => toProductDisplay(res.data))
  );
}

export function useProductsBySeller(sellerId: number | string | undefined) {
  return useSWR(
    sellerId ? `/products/seller/${sellerId}` : null,
    () => productApi.getBySeller(Number(sellerId)).then((res) => res.data.map(toProductDisplay))
  );
}
