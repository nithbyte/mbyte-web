/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useProducts,
  useProductCategories,
  useVisualAids,
  useCreateProduct,
  useUpdateProduct,
  useCreateVisualAid,
} from "@/hooks";
import type { Product, ProductInput } from "@/types";
import { Compass, Plus } from "lucide-react";

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
} from "@/features/products";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
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
  const createVisualAidMutation = useCreateVisualAid();

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [visualAidsModalProduct, setVisualAidsModalProduct] = useState<Product | null>(null);
  const [presenceModalProduct, setPresenceModalProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
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
  const initialVAForm = {
    title: "",
    type: "PDF",
    fileUrl: "",
    description: "",
    version: "1.0",
  };
  const [vaForm, setVAForm] = useState(initialVAForm);
  const [vaFormErrors, setVAFormErrors] = useState<Record<string, string>>({});

  const validateProductForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!productForm.name.trim() || productForm.name.trim().length < 2)
      errors.name = "Brand name must be at least 2 characters.";
    if (!productForm.genericName.trim())
      errors.genericName = "Generic (molecule) name is required.";
    if (!productForm.sku.trim())
      errors.sku = "SKU code is required.";
    if (!productForm.categoryId)
      errors.categoryId = "Please select a therapeutic category.";
    if (!productForm.dosageForm.trim())
      errors.dosageForm = "Dosage form is required (e.g. Tablet, Syrup).";
    if (!productForm.strength.trim())
      errors.strength = "Strength is required (e.g. 500mg).";
    if (!productForm.mrp || productForm.mrp <= 0)
      errors.mrp = "MRP must be greater than 0.";
    if (!productForm.ptr || productForm.ptr <= 0)
      errors.ptr = "PTR must be greater than 0.";
    if (!productForm.pts || productForm.pts <= 0)
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
    if (!validateProductForm()) return;
    await createProductMutation.mutateAsync(submissionForm);
    setProductForm(initialProductForm);
    setProductFormErrors({});
    setIsAddProductOpen(false);
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
    await createVisualAidMutation.mutateAsync({
      productId: uploadVAProduct.id,
      ...vaForm,
    });
    setVAForm(initialVAForm);
    setVAFormErrors({});
    setUploadVAProduct(null);
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
      : 80;

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

      {/* KPI Summary Cards */}
      <ProductKpiCards
        totalProducts={totalProducts}
        activeProducts={activeProducts}
        categoriesCount={categories?.length || 4}
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
        onOpenUploadVA={setUploadVAProduct}
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
        isSubmitting={updateProductMutation.isPending}
        productName={editingProduct?.name}
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
    </div>
  );
}
