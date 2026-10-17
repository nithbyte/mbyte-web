import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService, ProductQueryParams } from "../services";
import type { ProductInput } from "../types";

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

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => productService.createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      productService.updateProduct(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useCreateVisualAid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      productId: string;
      title: string;
      type: string;
      fileUrl: string;
      thumbnailUrl?: string;
      description?: string;
      version?: string;
    }) => productService.createVisualAid(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visual-aids"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
