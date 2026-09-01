"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type EmailValues = z.infer<typeof emailSchema>;
type OtpValues = z.infer<typeof otpSchema>;
type Step = "email" | "otp";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (step === "email") {
      emailForm.setFocus("email");
    } else {
      otpForm.setFocus("otp");
    }
  }, [step, emailForm, otpForm]);

  async function handleEmailSubmit(values: EmailValues) {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      if (!response.ok) {
        toast.error("Something went wrong. Please try again.");
        return;
      }
      toast.success("If that email exists, a code has been sent.");
      setStep("otp");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  async function handleOtpSubmit(values: OtpValues) {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailForm.getValues("email"),
          otp: values.otp,
        }),
      });
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        otpForm.setError("otp", {
          message: problem?.detail ?? "Invalid or expired code",
        });
        return;
      }
      const result: { token: string } = await response.json();
      router.push(`/reset-password?token=${encodeURIComponent(result.token)}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  function handleChangeEmail() {
    setStep("email");
    otpForm.reset();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          UNDP Visitor Management System
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {step === "email" ? "Forgot" : "Verify"} your{" "}
          {step === "email" ? "password" : "code"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "email"
            ? "Enter your account email and we'll send you a verification code."
            : "Enter the 6-digit code we sent to your email."}
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
      >
        <div>
          {step === "email" && <Label htmlFor="email">Email</Label>}
          {step === "otp" && (
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
            disabled={step === "otp"}
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
            {emailForm.formState.isSubmitting ? "Sending…" : "Send code"}
          </Button>
        )}
      </form>

      <AnimatePresence initial={false}>
        {step === "otp" && (
          <motion.form
            key="otp-step"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col gap-4"
            onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
          >
            <div>
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="mt-2"
                {...otpForm.register("otp")}
              />
              <FieldError message={otpForm.formState.errors.otp?.message} />
            </div>
            <Button
              type="submit"
              disabled={otpForm.formState.isSubmitting}
              className="mt-2 h-10 rounded-full px-4 text-sm sm:h-11 sm:px-5 lg:h-12 lg:px-6"
            >
              {otpForm.formState.isSubmitting ? "Verifying…" : "Verify code"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
