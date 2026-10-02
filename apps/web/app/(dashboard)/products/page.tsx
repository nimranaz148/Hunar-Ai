"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Coins,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ArrowRight,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input } from "@/components/ui/FormField";
import {
  BusinessService,
  ProductsService,
  type BusinessResponse,
  type ProductResponse,
  type CostInput,
} from "@/lib/api";
import { formatPKR } from "@/lib/format";
import { productSchema, type CostInputForm } from "@/lib/schemas/product";

interface ProductFormState {
  name: string;
  description: string;
  cost_inputs: CostInputForm[];
  price_pkr: string | number;
}

const INITIAL_FORM: ProductFormState = {
  name: "",
  description: "",
  cost_inputs: [{ item: "", amount_pkr: 0 }],
  price_pkr: "",
};

export default function ProductsPage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Delete modal state
  const [deletingProduct, setDeletingProduct] = useState<ProductResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async (businessId: string) => {
    try {
      const data = await ProductsService.listProductsApiV1BusinessesBusinessIdProductsGet({
        businessId,
      });
      setProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading products";
      setErrorMessage(msg);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);
      await fetchProducts(biz.id);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      setErrorMessage(
        errorObj?.message || "Failed to load business details. Please complete onboarding first."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const totalCostCurrent = formData.cost_inputs.reduce(
    (sum, c) => sum + (Number(c.amount_pkr) || 0),
    0
  );
  const currentPrice = Number(formData.price_pkr) || 0;
  const currentMarginPKR = currentPrice - totalCostCurrent;
  const currentMarginPercent =
    currentPrice > 0 ? Math.round((currentMarginPKR / currentPrice) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProductResponse) => {
    setEditingProductId(p.id);
    setFormData({
      name: p.name,
      description: p.description || "",
      cost_inputs:
        p.cost_inputs && p.cost_inputs.length > 0
          ? p.cost_inputs.map((c: CostInput) => ({ item: c.item, amount_pkr: c.amount_pkr }))
          : [{ item: "", amount_pkr: 0 }],
      price_pkr: p.price_pkr,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleAddCostRow = () => {
    setFormData({
      ...formData,
      cost_inputs: [...formData.cost_inputs, { item: "", amount_pkr: 0 }],
    });
  };

  const handleRemoveCostRow = (index: number) => {
    const updated = formData.cost_inputs.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      cost_inputs: updated.length > 0 ? updated : [{ item: "", amount_pkr: 0 }],
    });
  };

  const handleCostChange = (
    index: number,
    field: keyof CostInputForm,
    val: string | number
  ) => {
    const updated = [...formData.cost_inputs];
    updated[index] = {
      ...updated[index],
      [field]: field === "amount_pkr" ? Number(val) || 0 : val,
    };
    setFormData({ ...formData, cost_inputs: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    // Filter out completely empty cost inputs if multiple
    const cleanedCosts = formData.cost_inputs.filter(
      (c) => c.item.trim() !== "" || Number(c.amount_pkr) > 0
    );

    const parseResult = productSchema.safeParse({
      name: formData.name,
      description: formData.description,
      cost_inputs: cleanedCosts,
      price_pkr: formData.price_pkr,
    });

    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const pathKey = issue.path[0]?.toString() || "name";
        errMap[pathKey] = issue.message;
      });
      setFormErrors(errMap);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      if (editingProductId) {
        await ProductsService.updateSingleProductApiV1BusinessesBusinessIdProductsProductIdPatch({
          businessId: business.id,
          productId: editingProductId,
          requestBody: parseResult.data,
        });
      } else {
        await ProductsService.createNewProductApiV1BusinessesBusinessIdProductsPost({
          businessId: business.id,
          requestBody: parseResult.data,
        });
      }

      await fetchProducts(business.id);
      setIsModalOpen(false);
      setActionSuccess(
        editingProductId
          ? "Product updated successfully!"
          : "New product created successfully!"
      );
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving product";
      setFormErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!business || !deletingProduct) return;
    setIsDeleting(true);
    try {
      await ProductsService.deleteSingleProductApiV1BusinessesBusinessIdProductsProductIdDelete({
        businessId: business.id,
        productId: deletingProduct.id,
      });
      await fetchProducts(business.id);
      setDeletingProduct(null);
      setActionSuccess("Product deleted successfully");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting product";
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };


  // KPIs
  const totalProducts = products.length;
  const avgMargin =
    totalProducts > 0
      ? Math.round(
          products.reduce((acc, p) => {
            const costs = p.cost_inputs.reduce((csum: number, c: CostInput) => csum + c.amount_pkr, 0);
            const m = p.price_pkr > 0 ? ((p.price_pkr - costs) / p.price_pkr) * 100 : 0;
            return acc + m;
          }, 0) / totalProducts
        )
      : 0;


  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
      pageTitle="Products & Services"
      actions={
        <button
          onClick={handleOpenAdd}
          disabled={!business}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-accent-hover)] transition-colors shadow-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Navigation Breadcrumb back to business profile */}
        <div className="flex items-center justify-between text-[var(--text-xs)] text-[var(--color-fg-muted)]">
          <div className="flex items-center gap-2">
            <Link
              href="/business"
              className="hover:text-[var(--color-fg)] flex items-center gap-1.5 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Business Profile</span>
            </Link>
            <span>/</span>
            <span className="font-medium text-[var(--color-fg)]">Products & Pricing (F-005)</span>
          </div>
          <Link
            href="/business"
            className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline"
          >
            <span>Edit Profile Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div
            role="status"
            className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success-fg)] border border-[var(--color-status-success-border)] text-[var(--text-sm)] shadow-sm animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
        )}

        {/* Global Loading / Error State */}
        {isLoading && <LoadingState message="Loading your products..." />}
        {errorMessage && !isLoading && (
          <ErrorState message={errorMessage} onRetry={loadData} />
        )}

        {!isLoading && !errorMessage && (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Total Offerings
                  </span>
                  <Package className="w-4 h-4 text-[var(--color-fg-muted)]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[var(--color-fg)]">
                  {totalProducts}
                </div>
                <div className="mt-1 text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                  Active items in catalog
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Average Profit Margin
                  </span>
                  <TrendingUp className="w-4 h-4 text-[var(--color-status-success-fg)]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[var(--color-fg)]">
                  {avgMargin}%
                </div>
                <div className="mt-1 text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                  Average gross margin across items
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Business Budget
                  </span>
                  <Coins className="w-4 h-4 text-[var(--color-accent)]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[var(--color-fg)]">
                  {formatPKR(business?.budget_pkr || 0)}
                </div>
                <div className="mt-1 text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                  Monthly working capital
                </div>
              </div>
            </div>

            {/* Products Catalog */}
            {products.length === 0 ? (
              <EmptyState
                icon={<Package className="w-10 h-10 text-[var(--color-fg-muted)]" />}
                title="No Products or Services Added Yet"
                description="List your core items with ingredient/material cost breakdown to calculate accurate margins."
                action={
                  <button
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Product</span>
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((prod) => {
                  const totalCost = prod.cost_inputs.reduce(
                    (s: number, c: CostInput) => s + (Number(c.amount_pkr) || 0),
                    0
                  );
                  const marginPKR = prod.price_pkr - totalCost;
                  const marginPct =
                    prod.price_pkr > 0
                      ? Math.round((marginPKR / prod.price_pkr) * 100)
                      : 0;

                  return (
                    <div
                      key={prod.id}
                      className="p-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between hover:border-[var(--color-border-focus)] transition-colors shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[var(--text-base)] font-semibold text-[var(--color-fg)]">
                              {prod.name}
                            </h3>
                            {prod.description && (
                              <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1 line-clamp-2">
                                {prod.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
                              {formatPKR(prod.price_pkr)}
                            </span>
                            <div className="text-[var(--text-xs)] text-[var(--color-status-success-fg)] font-medium">
                              {marginPct}% margin
                            </div>
                          </div>
                        </div>

                        {/* Itemized Cost Breakdown Pills */}
                        <div className="pt-2 border-t border-[var(--color-border)]/60">
                          <div className="flex items-center justify-between text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] mb-2">
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5" />
                              <span>Cost Breakdown</span>
                            </span>
                            <span>Total: {formatPKR(totalCost)}</span>
                          </div>

                          <div className="space-y-1.5">
                            {prod.cost_inputs.map((cost: CostInput, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[var(--text-xs)] px-2.5 py-1 rounded-[var(--radius-xs)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/40"
                              >
                                <span className="text-[var(--color-fg)] truncate mr-2">
                                  {cost.item}
                                </span>
                                <span className="font-medium text-[var(--color-fg-muted)]">
                                  {formatPKR(cost.amount_pkr)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>


                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--color-border)]">
                        <div className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                          Profit: <strong className="text-[var(--color-fg)]">{formatPKR(marginPKR)}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingProduct(prod)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Modal / Dialog for Create & Edit Product */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <div>
                  <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
                    {editingProductId ? "Edit Product / Service" : "Add Product or Service"}
                  </h2>
                  <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-0.5">
                    PRD §5.2 F-005 Product Editor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-[var(--radius-sm)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.general && (
                <div
                  role="alert"
                  className="mt-4 p-3 rounded-[var(--radius-sm)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)] text-[var(--text-xs)] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <FormField
                  label="Product / Service Name"
                  name="name"
                  error={formErrors.name}
                  required
                >
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Belgium Chocolate Cake (2 Lbs)"
                  />
                </FormField>

                <FormField
                  label="Description"
                  name="description"
                  error={formErrors.description}
                  hint="Highlight ingredients, specs, or delivery instructions"
                >
                  <textarea
                    id="description"
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="e.g. Made with Belgian cocoa, customized greeting topper included."
                    className="w-full p-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-sm)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  />
                </FormField>

                {/* Itemized Cost Breakdown Section */}
                <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                        Itemized Costs (PRD §5.2)
                      </label>
                      <p className="text-[var(--text-xs)] text-[var(--color-fg-subtle)]">
                        Add raw materials, ingredients, packaging, or direct labour
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCostRow}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-xs)] border border-[var(--color-border)] text-[var(--text-xs)] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Cost Item</span>
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    {formData.cost_inputs.map((cost, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cost.item}
                          onChange={(e) => handleCostChange(idx, "item", e.target.value)}
                          placeholder="e.g. Flour, sugar & eggs"
                          className="flex-1 p-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] outline-none focus:border-[var(--color-border-focus)]"
                        />
                        <div className="w-32 relative">
                          <span className="absolute left-2.5 top-2 text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                            PKR
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={cost.amount_pkr || ""}
                            onChange={(e) =>
                              handleCostChange(idx, "amount_pkr", e.target.value)
                            }
                            placeholder="0"
                            className="w-full pl-11 pr-2 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] text-[var(--color-fg)] outline-none focus:border-[var(--color-border-focus)]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCostRow(idx)}
                          className="p-2 text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Total Cost Display */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--text-xs)] font-medium">
                    <span className="text-[var(--color-fg-muted)]">Total Itemized Cost:</span>
                    <span className="text-[var(--color-fg)] font-bold">
                      {formatPKR(totalCostCurrent)}
                    </span>
                  </div>
                </div>

                {/* Selling Price */}
                <div className="pt-2 border-t border-[var(--color-border)]">
                  <FormField
                    label="Selling Price (PKR)"
                    name="price_pkr"
                    error={formErrors.price_pkr}
                    required
                    hint="Must be greater than or equal to total itemized costs"
                  >
                    <Input
                      id="price_pkr"
                      type="number"
                      min="1"
                      value={formData.price_pkr}
                      onChange={(e) =>
                        setFormData({ ...formData, price_pkr: e.target.value })
                      }
                      placeholder="e.g. 2500"
                    />
                  </FormField>

                  {/* Live Profit Margin Preview */}
                  {currentPrice > 0 && (
                    <div className="mt-2 p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-between text-[var(--text-xs)]">
                      <span className="text-[var(--color-fg-muted)]">Projected Profit per unit:</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            currentMarginPKR >= 0
                              ? "text-[var(--color-status-success-fg)]"
                              : "text-[var(--color-danger)]"
                          }`}
                        >
                          {formatPKR(currentMarginPKR)} ({currentMarginPercent}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-surface-sunken)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? "Saving..." : "Save Product"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
              <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                Delete Product Offering?
              </h3>
              <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-2">
                Are you sure you want to remove{" "}
                <strong className="text-[var(--color-fg)]">{deletingProduct.name}</strong> from
                your catalog? This action will be audited and cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-[var(--text-xs)] font-medium hover:bg-[var(--color-surface-sunken)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-danger)] text-white text-[var(--text-xs)] font-medium hover:bg-[var(--color-danger)]/90 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
