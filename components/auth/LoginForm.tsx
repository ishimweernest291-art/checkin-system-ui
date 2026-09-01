"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import type { CheckEmailResponse } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "../Logo";

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;
type Step = "email" | "password";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [step, setStep] = useState<Step>("email");

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  // keep focus on whichever field is active as the step changes
  useEffect(() => {
    if (step === "email") {
      emailForm.setFocus("email");
    } else {
      passwordForm.setFocus("password");
    }
  }, [step, emailForm, passwordForm]);

  async function handleEmailSubmit(values: EmailValues) {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      if (!response.ok) {
        toast.error("Something went wrong. Please try again.");
        return;
      }
      const result: CheckEmailResponse = await response.json();
      if (!result.exists) {
        emailForm.setError("email", {
          message: "No account found with this email",
        });
        return;
      }
      setStep("password");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  async function handlePasswordSubmit(values: PasswordValues) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailForm.getValues("email"),
          password: values.password,
        }),
      });
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        passwordForm.setError("password", {
          message: problem?.detail ?? "Invalid email or password",
        });
        return;
      }
      queryClient.clear();
      router.push(next);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  function handleChangeEmail() {
    setStep("email");
    passwordForm.reset();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div>
        <Link href="/" className="flex shrink-0 items-center">
          <Logo priority className="h-6 w-auto sm:h-8 lg:h-14" />
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Staff sign in</h1>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
      >
        <div>
          {step === "email" && <Label htmlFor="email">Email</Label>}
          {step === "password" && (
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email</Label>
              <button
                type="button"
                onClick={handleChangeEmail}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Change email
              </button>
            </div>
          )}
          <Input
            id="email"
            type="email"
            autoComplete="username"
            disabled={step === "password"}
            placeholder="********@****.com"
            className="mt-2"
            {...emailForm.register("email")}
          />
          <FieldError message={emailForm.formState.errors.email?.message} />
        </div>

        {step === "email" && (
          <Button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className="mt-2 h-10 rounded-full px-4 text-sm sm:h-11 sm:px-5 lg:h-12 lg:px-6"
          >
            {emailForm.formState.isSubmitting ? "Checking…" : "Continue"}
          </Button>
        )}
      </form>

      <AnimatePresence initial={false}>
        {step === "password" && (
          <motion.form
            key="password-step"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col gap-4"
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
          >
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="********"
                className="mt-2"
                {...passwordForm.register("password")}
              />
              <FieldError
                message={passwordForm.formState.errors.password?.message}
              />
            </div>
            <Button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="mt-2 h-10 rounded-full px-4 text-sm sm:h-11 sm:px-5 lg:h-12 lg:px-6"
            >
              {passwordForm.formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
