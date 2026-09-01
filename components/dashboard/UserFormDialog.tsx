"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field-error";
import { SimpleSelect } from "@/components/ui/simple-select";
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
import type { AdminUser, Branch, Role } from "@/lib/types";

const EMPTY_FORM = {
  email: "",
  fullName: "",
  role: "BRANCH_MANAGER" as Role,
  branchId: "",
  active: true,
};

export function UserFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AdminUser | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Keyed by entity id so the form's local state resets whenever a different row (or "new") is opened. */}
        {open && (
          <UserForm
            key={editing?.id ?? "new"}
            editing={editing}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  editing,
  onOpenChange,
}: {
  editing: AdminUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    editing
      ? {
          email: editing.email,
          fullName: editing.fullName,
          role: editing.role,
          branchId: editing.branchId ?? "",
          active: editing.active,
        }
      : EMPTY_FORM,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => adminFetch<Branch[]>("/admin/branches"),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        email: form.email,
        fullName: form.fullName,
        role: form.role,
        branchId: form.role === "BRANCH_MANAGER" ? form.branchId : null,
        active: form.active,
      };
      return editing
        ? adminFetch<AdminUser>(`/admin/users/${editing.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : adminFetch<AdminUser>("/admin/users", {
            method: "POST",
            body: JSON.stringify(payload),
          });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        editing
          ? "User updated."
          : "User created. An invite email was sent to set their password.",
      );
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
        <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Update this admin user's details and access."
            : "The new user will receive an email with a link to set their own password."}
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
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              className="mt-1.5"
              autoFocus
              placeholder="e.g. Jane Smith"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <FieldError message={fieldErrors.fullName} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="mt-1.5"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <FieldError message={fieldErrors.email} />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <SimpleSelect
              id="role"
              className="mt-1.5 w-full"
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v as Role })}
              options={[
                { value: "MANAGER", label: "Manager" },
                { value: "BRANCH_MANAGER", label: "Branch manager" },
              ]}
            />
          </div>
          {form.role === "BRANCH_MANAGER" && (
            <div>
              <Label htmlFor="branchId">Branch</Label>
              <SimpleSelect
                id="branchId"
                className="mt-1.5 w-full"
                value={form.branchId}
                onChange={(v) => setForm({ ...form, branchId: v })}
                placeholder="Select a branch"
                options={(branches.data ?? []).map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
              <FieldError message={fieldErrors.branchId} />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive users can no longer sign in to the dashboard.
            </p>
          </div>
          <Checkbox
            id="active"
            checked={form.active}
            onCheckedChange={(checked) =>
              setForm({ ...form, active: checked === true })
            }
          />
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
                : "Create user"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
