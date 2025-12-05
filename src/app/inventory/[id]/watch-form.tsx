"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Watch = {
  id: string;
  brand: string;
  model: string;
  reference: string | null;
  serial: string | null;
  caliber: string | null;
  caseMaterial: string | null;
  dialColor: string | null;
  diameter: number | null;
  condition: string | null;
  notes: string | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  purchaseSource: string | null;
  additionalCosts: number | null;
  salePrice: number | null;
  saleDate: Date | null;
  platformFees: number | null;
  salesTax: number | null;
  marketingCosts: number | null;
  shippingCosts: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function WatchForm({ watch }: { watch: Watch }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Calculate profit dynamically
  const purchasePrice = Number(watch.purchasePrice) || 0;
  const additionalCosts = Number(watch.additionalCosts) || 0;
  const salePrice = Number(watch.salePrice) || 0;
  const platformFees = Number(watch.platformFees) || 0;
  const salesTax = Number(watch.salesTax) || 0;
  const marketingCosts = Number(watch.marketingCosts) || 0;
  const shippingCosts = Number(watch.shippingCosts) || 0;

  const totalCost = purchasePrice + additionalCosts;
  const totalSaleCosts = platformFees + marketingCosts + shippingCosts;
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
      caliber: formData.get("caliber") || null,
      caseMaterial: formData.get("caseMaterial") || null,
      dialColor: formData.get("dialColor") || null,
      diameter: formData.get("diameter")
        ? Number(formData.get("diameter"))
        : null,
      condition: formData.get("condition") || null,
      purchasePrice: formData.get("purchasePrice")
        ? Number(formData.get("purchasePrice"))
        : null,
      purchaseDate: formData.get("purchaseDate") || null,
      purchaseSource: formData.get("purchaseSource") || null,
      additionalCosts: formData.get("additionalCosts")
        ? Number(formData.get("additionalCosts"))
        : 0,
      salePrice: formData.get("salePrice")
        ? Number(formData.get("salePrice"))
        : null,
      saleDate: formData.get("saleDate") || null,
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

    const res = await fetch(`/api/watches/${watch.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/inventory");
      router.refresh();
    } else {
      alert("Failed to update watch");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this watch?")) return;

    setDeleting(true);
    const res = await fetch(`/api/watches/${watch.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/inventory");
      router.refresh();
    } else {
      alert("Failed to delete watch");
      setDeleting(false);
    }
  }

  const purchaseDate = watch.purchaseDate
    ? new Date(watch.purchaseDate).toISOString().split("T")[0]
    : "";
  const saleDate = watch.saleDate
    ? new Date(watch.saleDate).toISOString().split("T")[0]
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Watch Details */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Watch Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Brand"
            name="brand"
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
          <FormField
            label="Caliber"
            name="caliber"
            defaultValue={watch.caliber || ""}
          />
          <FormField
            label="Case Material"
            name="caseMaterial"
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
          <FormField
            label="Condition"
            name="condition"
            defaultValue={watch.condition || ""}
          />
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              defaultValue={watch.status}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="in_stock">In Stock</option>
              <option value="sold">Sold</option>
              <option value="traded">Traded</option>
              <option value="consigned">Consigned</option>
            </select>
          </div>
        </div>
      </section>

      {/* Purchase */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Purchase</h2>
        <div className="grid grid-cols-2 gap-4">
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
            defaultValue={purchaseDate}
          />
          <FormField
            label="Source"
            name="purchaseSource"
            defaultValue={watch.purchaseSource || ""}
            placeholder="eBay, Grailzee, private seller, etc."
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
          <span className="font-semibold">${totalCost.toLocaleString()}</span>
        </div>
      </section>

      {/* Sale */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Sale</h2>
        <div className="grid grid-cols-2 gap-4">
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
            defaultValue={saleDate}
          />
          <FormField
            label="Platform Fees"
            name="platformFees"
            type="number"
            defaultValue={watch.platformFees ?? 0}
            placeholder="eBay, PayPal fees, etc."
          />
          <FormField
            label="Sales Tax"
            name="salesTax"
            type="number"
            defaultValue={watch.salesTax ?? 0}
            placeholder="Sales Tax"
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

      {/* Profit Summary */}
      {watch.salePrice && (
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Profit Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sale Price</span>
              <span>${salePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Platform Fees</span>
              <span>${platformFees.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Platform Fees</span>
              <span>${salesTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Marketing Costs</span>
              <span>${marketingCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Shipping Costs</span>
              <span>${shippingCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Net Proceeds</span>
              <span>${netProceeds.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Purchase Price</span>
              <span>${purchasePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="pl-4">− Additional Costs</span>
              <span>${additionalCosts.toLocaleString()}</span>
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
                {profit?.toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Notes */}
      <section>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={watch.notes || ""}
          className="w-full border rounded-lg px-3 py-2"
        />
      </section>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/inventory")}
          className="px-6 py-2 rounded-lg border hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 ml-auto"
        >
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
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  );
}
