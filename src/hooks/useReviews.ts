import useSWR from "swr";
import { reviewApi } from "@/src/lib/api";

export function useSellerReviews(sellerId: number | string | undefined) {
  return useSWR(
    sellerId ? `/reviews/seller/${sellerId}` : null,
    () => reviewApi.getReviewsForSeller(Number(sellerId)).then((res) => res.data)
  );
}

export function useSellerRating(sellerId: number | string | undefined) {
  return useSWR(
    sellerId ? `/reviews/seller/${sellerId}/rating` : null,
    () => reviewApi.getSellerRating(Number(sellerId)).then((res) => res.data)
  );
}
