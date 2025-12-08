"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWatchForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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
      notes: formData.get("notes") || null,
    };

    const res = await fetch("/api/watches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/inventory");
    } else {
      alert("Failed to save watch");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Watch Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Brand" name="brand" required />
          <FormField label="Model" name="model" required />
          <FormField label="Reference" name="reference" />
          <FormField label="Serial" name="serial" />
          <FormField
            label="Year"
            name="year"
            placeholder="e.g. 2020 or c. 1985"
          />
          <FormField label="Caliber" name="caliber" />
          <FormField label="Case Material" name="caseMaterial" />
          <FormField label="Dial Color" name="dialColor" />
          <FormField label="Diameter (mm)" name="diameter" type="number" />
          <FormField label="Condition" name="condition" />
          <div className="col-span-2">
            <FormField
              label="Accessories"
              name="accessories"
              placeholder="Box, papers, etc."
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Purchase</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Purchase Price"
            name="purchasePrice"
            type="number"
          />
          <FormField label="Purchase Date" name="purchaseDate" type="date" />
          <FormField
            label="Source"
            name="purchaseSource"
            placeholder="eBay, dealer, private, etc."
          />
          <FormField
            label="Shipping Cost"
            name="purchaseShippingCost"
            type="number"
          />
          <FormField
            label="Additional Costs"
            name="additionalCosts"
            type="number"
            placeholder="Service, parts, etc."
          />
        </div>
      </section>

      <section>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
        />
      </section>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Watch"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/inventory")}
          className="px-6 py-2 rounded-lg border hover:bg-gray-50"
        >
          Cancel
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
  placeholder = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  );
}
