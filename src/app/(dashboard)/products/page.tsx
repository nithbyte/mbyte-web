/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import {
  useProducts,
  useProductCategories,
  useVisualAids,
  useCreateProduct,
  useUpdateProduct,
  useToggleProductStatus,
  useDeleteProduct,
  useCreateProductCategory,
  useDeleteProductCategory,
  useCreateVisualAid,
  useDeleteVisualAid,
} from "@/hooks";
import type { Product, ProductInput } from "@/types";
import { Compass, Layers, Plus, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";

// Modular feature components
import {
  ProductKpiCards,
  ProductFilterBar,
  ProductCatalogTable,
  ProductDetailsDialog,
  ProductVisualAidsDialog,
  ProductPresenceDialog,
  ProductFormDialog,
  VisualAidUploadDialog,
  CategoryManagerDialog,
  type VisualAidFormData,
} from "@/features/products";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearch(q);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Queries
  const { data: categories } = useProductCategories();
  const { data: allVisualAids } = useVisualAids();
  const { data: products, isLoading } = useProducts({
    search,
    categoryId: selectedCategory,
    status: selectedStatus,
  });

  // Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const toggleProductStatusMutation = useToggleProductStatus();
  const deleteProductMutation = useDeleteProduct();
  const createCategoryMutation = useCreateProductCategory();
  const deleteCategoryMutation = useDeleteProductCategory();
  const createVisualAidMutation = useCreateVisualAid();
  const deleteVisualAidMutation = useDeleteVisualAid();

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [visualAidsModalProduct, setVisualAidsModalProduct] = useState<Product | null>(null);
  const [presenceModalProduct, setPresenceModalProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [uploadVAProduct, setUploadVAProduct] = useState<Product | null>(null);

  // Add Product Form state
  const initialProductForm: ProductInput = {
    name: "",
    sku: "",
    categoryId: "",
    genericName: "",
    description: "",
    dosageForm: "Tablet",
    strength: "",
    packSize: "10x10",
    mrp: 0,
    ptr: 0,
    pts: 0,
    gstPercent: 12,
    isActive: true,
  };
  const [productForm, setProductForm] = useState<ProductInput>(initialProductForm);
  const [productFormErrors, setProductFormErrors] = useState<Record<string, string>>({});

  // Edit Product Form state
  const [editProductForm, setEditProductForm] = useState<ProductInput>(initialProductForm);
  const [editProductFormErrors, setEditProductFormErrors] = useState<Record<string, string>>({});

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProductForm({
      name: p.name || "",
      sku: p.sku || "",
      categoryId: p.categoryId || (categories?.[0]?.id || ""),
      genericName: p.genericName || "",
      description: p.description || "",
      dosageForm: p.dosageForm || "Tablet",
      strength: p.strength || "",
      packSize: p.packSize || "10x10",
      mrp: p.mrp || 0,
      ptr: p.ptr || 0,
      pts: p.pts || 0,
      gstPercent: p.gstPercent || p.gstRate || 12,
      imageUrl: p.imageUrl || "",
      isActive: p.isActive ?? true,
    });
    setEditProductFormErrors({});
  };

  const validateEditProductForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editProductForm.name.trim() || editProductForm.name.trim().length < 2)
      errors.name = "Brand name must be at least 2 characters.";
    if (!editProductForm.genericName.trim())
      errors.genericName = "Generic (molecule) name is required.";
    if (!editProductForm.sku.trim())
      errors.sku = "SKU code is required.";
    if (!editProductForm.categoryId)
      errors.categoryId = "Please select a therapeutic category.";
    if (!editProductForm.dosageForm.trim())
      errors.dosageForm = "Dosage form is required (e.g. Tablet, Syrup).";
    if (!editProductForm.mrp || editProductForm.mrp <= 0)
      errors.mrp = "MRP must be greater than 0.";
    if (!editProductForm.ptr || editProductForm.ptr <= 0)
      errors.ptr = "PTR must be greater than 0.";
    if (!editProductForm.pts || editProductForm.pts <= 0)
      errors.pts = "PTS must be greater than 0.";
    setEditProductFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEditProduct = async () => {
    if (!editingProduct) return;
    if (!validateEditProductForm()) return;
    try {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        input: editProductForm,
      });
      setEditingProduct(null);
      setEditProductFormErrors({});
    } catch (err: any) {
      console.error("Failed to update product:", err);
      setEditProductFormErrors({ submit: err?.message || "Failed to update product formulation." });
    }
  };

  // Upload Visual Aid Form state
  const initialVAForm: VisualAidFormData = {
    title: "",
    type: "IMAGE",
    fileUrl: "",
    thumbnailUrl: "",
    description: "",
    version: "1.0",
  };
  const [vaForm, setVAForm] = useState<VisualAidFormData>(initialVAForm);
  const [vaFormErrors, setVAFormErrors] = useState<Record<string, string>>({});

  const validateProductForm = (formToCheck: ProductInput = productForm): boolean => {
    const errors: Record<string, string> = {};
    if (!formToCheck.name.trim() || formToCheck.name.trim().length < 2)
      errors.name = "Brand name must be at least 2 characters.";
    if (!formToCheck.genericName.trim())
      errors.genericName = "Generic (molecule) name is required.";
    if (!formToCheck.sku.trim())
      errors.sku = "SKU code is required.";
    if (!formToCheck.categoryId)
      errors.categoryId = "Please select or create a therapeutic category.";
    if (!formToCheck.dosageForm.trim())
      errors.dosageForm = "Dosage form is required (e.g. Tablet, Syrup).";
    if (!formToCheck.strength.trim())
      errors.strength = "Strength is required (e.g. 500mg).";
    if (!formToCheck.mrp || formToCheck.mrp <= 0)
      errors.mrp = "MRP must be greater than 0.";
    if (!formToCheck.ptr || formToCheck.ptr <= 0)
      errors.ptr = "PTR must be greater than 0.";
    if (!formToCheck.pts || formToCheck.pts <= 0)
      errors.pts = "PTS must be greater than 0.";
    setProductFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = async () => {
    const submissionForm = {
      ...productForm,
      categoryId: productForm.categoryId || (categories?.[0]?.id || ""),
    };
    if (!productForm.categoryId && categories?.[0]?.id) {
      setProductForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
    if (!validateProductForm(submissionForm)) return;
    try {
      await createProductMutation.mutateAsync(submissionForm);
      setProductForm(initialProductForm);
      setProductFormErrors({});
      setIsAddProductOpen(false);
    } catch (err: any) {
      setProductFormErrors({ submit: err?.message || "Failed to save product formulation." });
    }
  };

  const validateVAForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!vaForm.title.trim()) errors.title = "Title is required.";
    if (!vaForm.type) errors.type = "Type is required.";
    if (!vaForm.fileUrl.trim()) errors.fileUrl = "File URL or asset link is required.";
    setVAFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUploadVA = async () => {
    if (!uploadVAProduct || !validateVAForm()) return;
    try {
      await createVisualAidMutation.mutateAsync({
        productId: uploadVAProduct.id,
        ...vaForm,
      });
      setVAForm(initialVAForm);
      setVAFormErrors({});
      setUploadVAProduct(null);
    } catch (err: any) {
      setVAFormErrors({ submit: err?.message || "Failed to publish visual aid." });
    }
  };

  const handleOpenUploadVA = (p: Product) => {
    setVAForm(initialVAForm);
    setVAFormErrors({});
    setUploadVAProduct(p);
  };

  const showBanner = (type: "success" | "error", message: string) => {
    setActionBanner({ type, message });
    setTimeout(() => setActionBanner(null), 4000);
  };

  const handleToggleProductStatus = async (p: Product) => {
    setTogglingProductId(p.id);
    try {
      const nextActive = !p.isActive;
      await toggleProductStatusMutation.mutateAsync({ id: p.id, isActive: nextActive });
      showBanner(
        "success",
        `${p.name} marked as ${nextActive ? "Active in distribution" : "Inactive (hidden from MR field orders & detailing)"}.`
      );
    } catch (err: any) {
      showBanner("error", err?.message || "Failed to update product status.");
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      const name = deletingProduct.name;
      await deleteProductMutation.mutateAsync(deletingProduct.id);
      setDeletingProduct(null);
      showBanner("success", `Product "${name}" and its linked visual aids have been deleted.`);
    } catch (err: any) {
      showBanner("error", err?.message || "Failed to delete product.");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  // KPI Calculations
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p) => p.isActive).length || 0;
  const totalVisualAids = allVisualAids?.length || 0;
  const avgAvailability =
    products && products.length > 0
      ? Math.round(
          products.reduce(
            (acc, p) => acc + (p.presenceSummary?.availabilityRate || 0),
            0
          ) / products.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmaceutical Product Management & Formulations"
        description="Comprehensive SKU registry, category classification, commercial price structures, detailing visual aids, and field presence audits."
        badge={<Badge variant="default">{totalProducts} Formulations Listed</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/products/presence">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Compass className="h-3.5 w-3.5" />
                <span>Presence & GIS Map</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setIsCategoryManagerOpen(true)}
              id="btn-manage-categories"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Categories ({categories?.length ?? 0})</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setIsAddProductOpen(true)}
              id="btn-add-product"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Product</span>
            </Button>
          </div>
        }
      />

      {/* Action Feedback Banner */}
      {actionBanner && (
        <div
          className={`flex items-center gap-2 p-3 text-xs rounded-xl border font-semibold ${
            actionBanner.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {actionBanner.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{actionBanner.message}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <ProductKpiCards
        totalProducts={totalProducts}
        activeProducts={activeProducts}
        categoriesCount={categories?.length ?? 0}
        categoryNames={categories?.map((c) => c.name) || []}
        totalVisualAids={totalVisualAids}
        avgAvailability={avgAvailability}
      />

      {/* Filter Bar */}
      <ProductFilterBar
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        categories={categories}
        onResetFilters={handleResetFilters}
      />

      {/* Main Table */}
      <ProductCatalogTable
        products={products}
        isLoading={isLoading}
        totalProducts={totalProducts}
        onResetFilters={handleResetFilters}
        onSelectProduct={setSelectedProduct}
        onOpenEditProduct={handleOpenEditProduct}
        onOpenVisualAidsModal={setVisualAidsModalProduct}
        onOpenPresenceModal={setPresenceModalProduct}
        onOpenUploadVA={handleOpenUploadVA}
        onToggleStatus={handleToggleProductStatus}
        onDeleteProduct={setDeletingProduct}
        togglingProductId={togglingProductId}
      />

      {/* MODAL 1: FULL PRODUCT DETAILS & SPECIFICATIONS */}
      <ProductDetailsDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={(p) => {
          setSelectedProduct(null);
          handleOpenEditProduct(p);
        }}
        onViewPresence={(p) => {
          setSelectedProduct(null);
          setPresenceModalProduct(p);
        }}
        onViewVisualAids={(p) => {
          setSelectedProduct(null);
          setVisualAidsModalProduct(p);
        }}
      />

      {/* MODAL 2: VISUAL AIDS EXPLORER MODAL */}
      <ProductVisualAidsDialog
        product={visualAidsModalProduct}
        onClose={() => setVisualAidsModalProduct(null)}
        onOpenUploadVA={(p) => handleOpenUploadVA(p)}
        onDeleteVisualAid={(id) => deleteVisualAidMutation.mutateAsync(id)}
        isDeleting={deleteVisualAidMutation.isPending}
      />

      {/* MODAL 3: PRODUCT PRESENCE SUMMARY & AUDIT LOG */}
      <ProductPresenceDialog
        product={presenceModalProduct}
        onClose={() => setPresenceModalProduct(null)}
      />

      {/* MODAL 4: ADD NEW PRODUCT */}
      <ProductFormDialog
        isOpen={isAddProductOpen}
        mode="create"
        onClose={() => {
          setIsAddProductOpen(false);
          setProductForm(initialProductForm);
          setProductFormErrors({});
        }}
        onSubmit={handleAddProduct}
        form={productForm}
        setForm={setProductForm}
        errors={productFormErrors}
        categories={categories}
        onQuickCreateCategory={(input) => createCategoryMutation.mutateAsync(input)}
        isCreatingCategory={createCategoryMutation.isPending}
        isSubmitting={createProductMutation.isPending}
      />

      {/* MODAL 4B: EDIT EXISTING PRODUCT */}
      <ProductFormDialog
        isOpen={Boolean(editingProduct)}
        mode="edit"
        onClose={() => {
          setEditingProduct(null);
          setEditProductFormErrors({});
        }}
        onSubmit={handleSaveEditProduct}
        form={editProductForm}
        setForm={setEditProductForm}
        errors={editProductFormErrors}
        categories={categories}
        onQuickCreateCategory={(input) => createCategoryMutation.mutateAsync(input)}
        isCreatingCategory={createCategoryMutation.isPending}
        isSubmitting={updateProductMutation.isPending}
        productName={editingProduct?.name}
      />

      {/* MODAL 4C: THERAPEUTIC CATEGORY MANAGER */}
      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onCreateCategory={(input) => createCategoryMutation.mutateAsync(input)}
        onDeleteCategory={(id) => deleteCategoryMutation.mutateAsync(id)}
        isCreating={createCategoryMutation.isPending}
        isDeleting={deleteCategoryMutation.isPending}
      />

      {/* MODAL 5: UPLOAD VISUAL AID FOR A PRODUCT */}
      <VisualAidUploadDialog
        product={uploadVAProduct}
        onClose={() => {
          setUploadVAProduct(null);
          setVAForm(initialVAForm);
          setVAFormErrors({});
        }}
        onSubmit={handleUploadVA}
        form={vaForm}
        setForm={setVAForm}
        errors={vaFormErrors}
        isSubmitting={createVisualAidMutation.isPending}
      />
      {/* MODAL 6: CONFIRM DELETE PRODUCT */}
      <Modal
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        title="Delete Product Formulation"
        description="This will remove the product from the active catalog and archive its linked visual aids."
      >
        {deletingProduct && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Are you sure you want to delete{" "}
                  <span className="font-bold underline">{deletingProduct.name}</span> ({deletingProduct.sku})?
                </p>
                <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-400">
                  The product and its visual detailing decks will be archived and removed from Admin Web and MR Mobile apps. Historical orders and invoices remain intact for audit records.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingProduct(null)}
                disabled={deleteProductMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
                onClick={handleConfirmDeleteProduct}
                isLoading={deleteProductMutation.isPending}
                id="btn-confirm-delete-product"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Product
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
