"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export function SetPasswordForm({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        toast.error(problem?.detail ?? "This link is invalid or has expired.");
        return;
      }
      toast.success("Password set. You can now sign in.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold">Invalid link</h1>
        <p className="text-sm text-muted-foreground">
          This link is missing or malformed. Please request a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          UNDP Visitor Management System
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div>
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="********"
            className="mt-2"
            {...form.register("password")}
          />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="********"
            className="mt-2"
            {...form.register("confirmPassword")}
          />
          <FieldError
            message={form.formState.errors.confirmPassword?.message}
          />
        </div>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="mt-2 h-10 rounded-full px-4 text-sm sm:h-11 sm:px-5 lg:h-12 lg:px-6"
        >
          {form.formState.isSubmitting ? "Saving…" : "Set password"}
        </Button>
      </form>
    </div>
  );
}
