"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWatchPage() {
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
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Add Watch</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Brand" name="brand" required />
          <FormField label="Model" name="model" required />
          <FormField label="Reference" name="reference" />
          <FormField label="Serial" name="serial" />
          <FormField label="Caliber" name="caliber" />
          <FormField label="Case Material" name="caseMaterial" />
          <FormField label="Dial Color" name="dialColor" />
          <FormField label="Diameter (mm)" name="diameter" type="number" />
          <FormField label="Condition" name="condition" />
          <FormField
            label="Purchase Price"
            name="purchasePrice"
            type="number"
          />
          <FormField label="Purchase Date" name="purchaseDate" type="date" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

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
    </main>
  );
}

function FormField({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  );
}
