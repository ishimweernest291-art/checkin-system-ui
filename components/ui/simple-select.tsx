"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_VALUE = "__all__";

export interface SimpleSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function SimpleSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SimpleSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value === "" ? EMPTY_VALUE : value}
      onValueChange={(v) => onChange(v === EMPTY_VALUE ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={cn(
          "w-full rounded-xl data-[size=default]:h-10 data-[size=sm]:h-10",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value === "" ? EMPTY_VALUE : option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
