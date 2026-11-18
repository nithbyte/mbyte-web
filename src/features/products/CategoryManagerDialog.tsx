"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ProductCategory } from "@/types";
import { Layers, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: ProductCategory[];
  onCreateCategory: (input: { name: string; slug?: string; description?: string }) => Promise<ProductCategory>;
  onDeleteCategory?: (id: string) => Promise<any>;
  isCreating: boolean;
  isDeleting?: boolean;
}

export const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  isOpen,
  onClose,
  categories = [],
  onCreateCategory,
  onDeleteCategory,
  isCreating,
  isDeleting,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toSlug = (val: string) =>
    val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugTouched) {
      setSlug(toSlug(val));
    }
    if (error) setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError("Category name must be at least 2 characters.");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      const created = await onCreateCategory({
        name: name.trim(),
        slug: (slug.trim() || toSlug(name)).trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setSuccessMsg(`Category "${created.name}" created successfully.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to create category.");
    }
  };

  const handleDelete = async (cat: ProductCategory) => {
    if (!onDeleteCategory) return;
    if ((cat.productCount || 0) > 0) {
      setError(`Cannot archive "${cat.name}" while ${cat.productCount} product(s) are assigned to it.`);
      return;
    }
    setError(null);
    try {
      await onDeleteCategory(cat.id);
      setSuccessMsg(`Category "${cat.name}" archived.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to archive category.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Therapeutic Categories Management"
      description="Create and manage therapeutic lines for organizing your company's pharmaceutical formulations."
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Create Category Form */}
        <form
          onSubmit={handleCreate}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Plus className="h-3.5 w-3.5 text-sky-600" />
            Add New Therapeutic Category
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Category Name *
              </label>
              <Input
                id="category-name-input"
                placeholder="e.g. Cardiology, Diabetology, Pediatrics"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Category Slug
              </label>
              <Input
                id="category-slug-input"
                placeholder="e.g. cardiology"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(toSlug(e.target.value));
                }}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Description (Optional)
            </label>
            <Input
              id="category-description-input"
              placeholder="e.g. Cardiovascular medications, anti-hypertensives, statins..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={isCreating}
              id="btn-create-category"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isCreating ? "Creating..." : "Add Category"}</span>
            </Button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              Existing Categories ({categories.length})
            </h4>
          </div>

          {categories.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No therapeutic categories created yet. Add your first category above so you can classify products.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {cat.slug}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {cat.productCount || 0} SKUs
                    </Badge>
                    {onDeleteCategory && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                        onClick={() => handleDelete(cat)}
                        disabled={isDeleting}
                        title="Archive Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
