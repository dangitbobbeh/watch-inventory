"use client";

import { useState, useRef, useEffect, useMemo } from "react";

type ComboboxProps = {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
};

export default function Combobox({
  label,
  name,
  options,
  defaultValue = "",
  placeholder = "",
  required = false,
}: ComboboxProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(value.toLowerCase())
    );
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
          {filtered.map((option) => (
            <li
              key={option}
              onClick={() => {
                setValue(option);
                setIsOpen(false);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
