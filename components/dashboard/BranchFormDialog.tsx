"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminFetch } from "@/lib/api-admin";
import { ApiError } from "@/lib/http";
import type { Branch } from "@/lib/types";

const EMPTY_FORM = { name: "", address: "", city: "", country: "" };

export function BranchFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Branch | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Keyed by entity id so the form's local state resets whenever a different row (or "new") is opened. */}
        {open && (
          <BranchForm
            key={editing?.id ?? "new"}
            editing={editing}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BranchForm({
  editing,
  onOpenChange,
}: {
  editing: Branch | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    editing
      ? {
          name: editing.name,
          address: editing.address ?? "",
          city: editing.city ?? "",
          country: editing.country ?? "",
        }
      : EMPTY_FORM,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminFetch<Branch>(`/admin/branches/${editing.id}`, {
            method: "PUT",
            body: JSON.stringify(form),
          })
        : adminFetch<Branch>("/admin/branches", {
            method: "POST",
            body: JSON.stringify(form),
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(editing ? "Branch updated." : "Branch created.");
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFieldErrors(err.problem?.fieldErrors ?? {});
        setFormError(err.problem?.detail ?? "Something went wrong.");
      } else {
        setFormError("Something went wrong.");
      }
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit branch" : "New branch"}</DialogTitle>
        <DialogDescription>
          Branches group entrances and hosts by physical location.
        </DialogDescription>
      </DialogHeader>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-1.5"
              autoFocus
              value={form.name}
              placeholder="e.g. Downtown Office"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <FieldError message={fieldErrors.name} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              className="mt-1.5"
              placeholder="e.g. Kigali"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <FieldError message={fieldErrors.city} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              className="mt-1.5"
              placeholder="e.g. Rwanda"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
            <FieldError message={fieldErrors.country} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              className="mt-1.5"
              placeholder="Street address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <FieldError message={fieldErrors.address} />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {save.isPending
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Create branch"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
