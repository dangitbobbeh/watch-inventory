"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Watch } from "@prisma/client";

export default function WatchForm({ watch }: { watch: Watch }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Format date for input field
  const purchaseDate = watch.purchaseDate
    ? new Date(watch.purchaseDate).toISOString().split("T")[0]
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <FormField
          label="Purchase Price"
          name="purchasePrice"
          type="number"
          defaultValue={watch.purchasePrice?.toString() || ""}
        />
        <FormField
          label="Purchase Date"
          name="purchaseDate"
          type="date"
          defaultValue={purchaseDate}
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

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={watch.notes || ""}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
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
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  );
}
