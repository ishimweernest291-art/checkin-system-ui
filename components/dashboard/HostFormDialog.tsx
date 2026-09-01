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
import { useSession } from "@/lib/use-session";
import type { Branch, Host } from "@/lib/types";

const EMPTY_FORM = { branchId: "", fullName: "", department: "", active: true };

export function HostFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Host | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Keyed by entity id so the form's local state resets whenever a different row (or "new") is opened. */}
        {open && (
          <HostForm
            key={editing?.id ?? "new"}
            editing={editing}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function HostForm({
  editing,
  onOpenChange,
}: {
  editing: Host | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    editing
      ? {
          branchId: editing.branchId,
          fullName: editing.fullName,
          department: editing.department ?? "",
          active: editing.active,
        }
      : EMPTY_FORM,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => adminFetch<Branch[]>("/admin/branches"),
    enabled: session?.role === "MANAGER",
  });

  // Branch managers always operate within their own branch; managers pick one explicitly.
  const effectiveBranchId =
    session?.role === "BRANCH_MANAGER"
      ? (session.branchId ?? "")
      : form.branchId;

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, branchId: effectiveBranchId };
      return editing
        ? adminFetch<Host>(`/admin/hosts/${editing.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : adminFetch<Host>("/admin/hosts", {
            method: "POST",
            body: JSON.stringify(payload),
          });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
      toast.success(editing ? "Host updated." : "Host created.");
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
        <DialogTitle>{editing ? "Edit host" : "New host"}</DialogTitle>
        <DialogDescription>
          Hosts are the staff visitors check in to meet.
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
        {session?.role === "MANAGER" && (
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
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              className="mt-1.5"
              placeholder="e.g. Human Resources"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <FieldError message={fieldErrors.department} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive hosts are hidden from the check-in host picker.
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
                : "Create host"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
