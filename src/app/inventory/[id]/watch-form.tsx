"use client";

import { Prisma } from "@prisma/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Combobox from "../../../app/components/combobox";
import { Database, ArrowLeftRight, Copy } from "lucide-react";

type Watch = {
  id: string;
  brand: string;
  model: string;
  reference: string | null;
  serial: string | null;
  year: string | null;
  caliber: string | null;
  caseMaterial: string | null;
  dialColor: string | null;
  diameter: number | null;
  condition: string | null;
  accessories: string | null;
  notes: string | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  purchaseSource: string | null;
  purchaseShippingCost: number | null;
  additionalCosts: number | null;
  salePrice: number | null;
  saleDate: Date | null;
  salePlatform: string | null;
  platformFees: number | null;
  salesTax: number | null;
  marketingCosts: number | null;
  shippingCosts: number | null;
  importId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  customData: Prisma.JsonValue;
};

type AutocompleteOptions = {
  brands: string[];
  materials: string[];
  conditions: string[];
  sources: string[];
  platforms: string[];
};

export default function WatchForm({ watch }: { watch: Watch }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [options, setOptions] = useState<AutocompleteOptions>({
    brands: [],
    materials: [],
    conditions: [],
    sources: [],
    platforms: [],
  });
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    fetch("/api/autocomplete")
      .then((res) => res.json())
      .then(setOptions)
      .catch(() => {});
  }, []);

  const purchasePrice = Number(watch.purchasePrice) || 0;
  const purchaseShipping = Number(watch.purchaseShippingCost) || 0;
  const additionalCosts = Number(watch.additionalCosts) || 0;
  const salePrice = Number(watch.salePrice) || 0;
  const platformFees = Number(watch.platformFees) || 0;
  const marketingCosts = Number(watch.marketingCosts) || 0;
  const shippingCosts = Number(watch.shippingCosts) || 0;
  const salesTax = Number(watch.salesTax) || 0;

  const totalCost = purchasePrice + purchaseShipping + additionalCosts;
  const totalSaleCosts =
    platformFees + marketingCosts + shippingCosts + salesTax;
  const netProceeds = salePrice - totalSaleCosts;
  const profit = watch.salePrice ? netProceeds - totalCost : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      brand: formData.get("brand"),
      model: formData.get("model"),
      reference: formData.get("reference") || null,
      serial: formData.get("serial") || null,
      year: formData.get("year") || null,
      caliber: formData.get("caliber") || null,
      caseMaterial: formData.get("caseMaterial") || null,
      dialColor: formData.get("dialColor") || null,
      diameter: formData.get("diameter")
        ? Number(formData.get("diameter"))
        : null,
      condition: formData.get("condition") || null,
      accessories: formData.get("accessories") || null,
      purchasePrice: formData.get("purchasePrice")
        ? Number(formData.get("purchasePrice"))
        : null,
      purchaseDate: formData.get("purchaseDate") || null,
      purchaseSource: formData.get("purchaseSource") || null,
      purchaseShippingCost: formData.get("purchaseShippingCost")
        ? Number(formData.get("purchaseShippingCost"))
        : 0,
      additionalCosts: formData.get("additionalCosts")
        ? Number(formData.get("additionalCosts"))
        : 0,
      salePrice: formData.get("salePrice")
        ? Number(formData.get("salePrice"))
        : null,
      saleDate: formData.get("saleDate") || null,
      salePlatform: formData.get("salePlatform") || null,
      platformFees: formData.get("platformFees")
        ? Number(formData.get("platformFees"))
        : 0,
      salesTax: formData.get("salesTax") ? Number(formData.get("salesTax")) : 0,
      marketingCosts: formData.get("marketingCosts")
        ? Number(formData.get("marketingCosts"))
        : 0,
      shippingCosts: formData.get("shippingCosts")
        ? Number(formData.get("shippingCosts"))
        : 0,
      status: formData.get("status"),
      notes: formData.get("notes") || null,
    };

    try {
      const res = await fetch(`/api/watches/${watch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Watch updated successfully!");
        router.push("/inventory");
        router.refresh();
      } else {
        toast.error("Failed to update watch");
        setSaving(false);
      }
    } catch {
      toast.error("Something went wrong");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this watch?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/watches/${watch.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Watch deleted");
        router.push("/inventory");
        router.refresh();
      } else {
        toast.error("Failed to delete watch");
        setDeleting(false);
      }
    } catch {
      toast.error("Something went wrong");
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const res = await fetch("/api/watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: watch.brand,
          model: watch.model,
          reference: watch.reference,
          serial: null, // Clear serial for duplicate
          year: watch.year,
          caliber: watch.caliber,
          caseMaterial: watch.caseMaterial,
          dialColor: watch.dialColor,
          diameter: watch.diameter,
          condition: watch.condition,
          accessories: watch.accessories,
          purchasePrice: null, // Clear purchase info
          purchaseDate: null,
          purchaseSource: watch.purchaseSource,
          purchaseShippingCost: null,
          additionalCosts: null,
          notes: `Duplicated from ${watch.brand} ${watch.model}`,
        }),
      });

      if (res.ok) {
        const newWatch = await res.json();
        toast.success("Watch duplicated! Redirecting to new watch...");
        router.push(`/inventory/${newWatch.id}`);
      } else {
        toast.error("Failed to duplicate watch");
        setDuplicating(false);
      }
    } catch {
      toast.error("Something went wrong");
      setDuplicating(false);
    }
  }

  const purchaseDateStr = watch.purchaseDate
    ? new Date(watch.purchaseDate).toISOString().split("T")[0]
    : "";
  const saleDateStr = watch.saleDate
    ? new Date(watch.saleDate).toISOString().split("T")[0]
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Watch Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Combobox
            label="Brand"
            name="brand"
            options={options.brands}
            defaultValue={watch.brand}
            required
          />
          <FormField
            label="Model"
            name="model"
            defaultValue={watch.model}
            required
          />
          <FormField
            label="Reference"
            name="reference"
            defaultValue={watch.reference || ""}
          />
          <FormField
            label="Serial"
            name="serial"
            defaultValue={watch.serial || ""}
          />
          <FormField label="Year" name="year" defaultValue={watch.year || ""} />
          <FormField
            label="Caliber"
            name="caliber"
            defaultValue={watch.caliber || ""}
          />
          <Combobox
            label="Case Material"
            name="caseMaterial"
            options={options.materials}
            defaultValue={watch.caseMaterial || ""}
          />
          <FormField
            label="Dial Color"
            name="dialColor"
            defaultValue={watch.dialColor || ""}
          />
          <FormField
            label="Diameter (mm)"
            name="diameter"
            type="number"
            defaultValue={watch.diameter || ""}
          />
          <Combobox
            label="Condition"
            name="condition"
            options={options.conditions}
            defaultValue={watch.condition || ""}
          />
          <div className="sm:col-span-2">
            <FormField
              label="Accessories"
              name="accessories"
              defaultValue={watch.accessories || ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              defaultValue={watch.status}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
            >
              <option value="in_stock">In Stock</option>
              <option value="sold">Sold</option>
              <option value="traded">Traded</option>
              <option value="consigned">Consigned</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Purchase</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Purchase Price"
            name="purchasePrice"
            type="number"
            defaultValue={watch.purchasePrice ?? ""}
          />
          <FormField
            label="Purchase Date"
            name="purchaseDate"
            type="date"
            defaultValue={purchaseDateStr}
          />
          <Combobox
            label="Source"
            name="purchaseSource"
            options={options.sources}
            defaultValue={watch.purchaseSource || ""}
            placeholder="eBay, dealer, private, etc."
          />
          <FormField
            label="Shipping Cost"
            name="purchaseShippingCost"
            type="number"
            defaultValue={watch.purchaseShippingCost ?? 0}
          />
          <FormField
            label="Additional Costs"
            name="additionalCosts"
            type="number"
            defaultValue={watch.additionalCosts ?? 0}
            placeholder="Service, parts, etc."
          />
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Total Cost:{" "}
          <span className="font-semibold">
            $
            {totalCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Sale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Sale Price"
            name="salePrice"
            type="number"
            defaultValue={watch.salePrice ?? ""}
            placeholder="Total amount from buyer"
          />
          <FormField
            label="Sale Date"
            name="saleDate"
            type="date"
            defaultValue={saleDateStr}
          />
          <Combobox
            label="Sale Platform"
            name="salePlatform"
            options={options.platforms}
            defaultValue={watch.salePlatform || ""}
            placeholder="eBay, website, etc."
          />
          <FormField
            label="Platform Fees"
            name="platformFees"
            type="number"
            defaultValue={watch.platformFees ?? 0}
          />
          <FormField
            label="Sales Tax"
            name="salesTax"
            type="number"
            defaultValue={watch.salesTax ?? 0}
          />
          <FormField
            label="Marketing Costs"
            name="marketingCosts"
            type="number"
            defaultValue={watch.marketingCosts ?? 0}
          />
          <FormField
            label="Shipping Costs"
            name="shippingCosts"
            type="number"
            defaultValue={watch.shippingCosts ?? 0}
          />
        </div>
      </section>

      {watch.salePrice && (
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Profit Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sale Price</span>
              <span>
                $
                {salePrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Platform Fees</span>
              <span>
                $
                {platformFees.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Sales Tax</span>
              <span>
                $
                {salesTax.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Marketing Costs</span>
              <span>
                $
                {marketingCosts.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Shipping Costs</span>
              <span>
                $
                {shippingCosts.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Net Proceeds</span>
              <span>
                $
                {netProceeds.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Purchase Price</span>
              <span>
                $
                {purchasePrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Purchase Shipping</span>
              <span>
                $
                {purchaseShipping.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Additional Costs</span>
              <span>
                $
                {additionalCosts.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Profit</span>
              <span
                className={
                  profit !== null && profit >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {profit !== null && profit >= 0 ? "+" : ""}$
                {profit?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </section>
      )}
      {watch.customData && Object.keys(watch.customData).length > 0 && (
        <section className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-4">
            <Database
              size={18}
              className="text-purple-600 dark:text-purple-400"
            />
            <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
              Custom Fields
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(watch.customData).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  {key}
                </label>
                <p className="text-purple-900 dark:text-purple-100">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={watch.notes || ""}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
        />
      </section>

      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={duplicating}
          className="px-6 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
        >
          {duplicating ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Copy size={16} />
          )}
          {duplicating ? "Duplicating..." : "Duplicate"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/inventory")}
          className="px-6 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 sm:ml-auto flex items-center gap-2 transition-colors"
        >
          {deleting && <Loader2 className="animate-spin" size={16} />}
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  name,
  type = "text",
  required = false,
  defaultValue = "",
  placeholder = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
      />
    </div>
  );
}
