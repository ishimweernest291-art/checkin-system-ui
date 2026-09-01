"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { adminFetch } from "@/lib/api-admin";
import { ApiError } from "@/lib/http";
import type { MeResponse } from "@/lib/types";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => adminFetch<MeResponse>("/admin/me"),
  });

  const [fullNameOverride, setFullNameOverride] = useState<string | null>(null);
  const fullName = fullNameOverride ?? me.data?.fullName ?? "";
  const [fullNameError, setFullNameError] = useState<string | null>(null);

  const saveFullName = useMutation({
    mutationFn: () =>
      adminFetch<MeResponse>("/admin/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName }),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setFullNameOverride(updated.fullName);
      setFullNameError(null);
      toast.success(
        "Profile updated. Sign in again to refresh your session name.",
      );
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFullNameError(
          err.problem?.fieldErrors?.fullName ??
            err.problem?.detail ??
            "Something went wrong.",
        );
      } else {
        setFullNameError("Something went wrong.");
      }
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const changePassword = useMutation({
    mutationFn: () =>
      adminFetch("/admin/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    onSuccess: () => {
      toast.success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setPasswordError(err.problem?.detail ?? "Something went wrong.");
      } else {
        setPasswordError("Something went wrong.");
      }
    },
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    changePassword.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Update your display name.
          </p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveFullName.mutate();
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              className="mt-1.5"
              value={me.data?.email ?? ""}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Full name"
              className="mt-1.5"
              value={fullName}
              onChange={(e) => setFullNameOverride(e.target.value)}
            />
            <FieldError message={fullNameError ?? undefined} />
          </div>
          <Button
            type="submit"
            disabled={saveFullName.isPending}
            className="mt-2 w-fit rounded-full"
          >
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-sm font-semibold">Change password</h2>
          <p className="text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput
              id="currentPassword"
              placeholder="Current password"
              autoComplete="current-password"
              className="mt-1.5"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput
              id="newPassword"
              placeholder="New password"
              autoComplete="new-password"
              className="mt-1.5"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="mt-1.5"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={changePassword.isPending}
            className="mt-2 w-fit rounded-full"
          >
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
