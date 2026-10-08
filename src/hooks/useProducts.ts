import { useQuery } from "@tanstack/react-query";
import { productService, ProductQueryParams } from "../services";

export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productService.getProducts(params),
  });
}

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => productService.getProductById(id),
    enabled: Boolean(id),
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productService.getProductCategories(),
  });
}

export function useVisualAids(params?: { productId?: string; search?: string }) {
  return useQuery({
    queryKey: ["visual-aids", params],
    queryFn: () => productService.getVisualAids(params),
  });
}

export function useProductPresenceSummary(productId: string) {
  return useQuery({
    queryKey: ["products", "presence-summary", productId],
    queryFn: () => productService.getProductPresenceSummary(productId),
    enabled: Boolean(productId),
  });
}

export function useLowStockAlerts(limit: number = 6) {
  return useQuery({
    queryKey: ["products", "low-stock-alerts", limit],
    queryFn: () => productService.getLowStockAlerts(limit),
  });
}
