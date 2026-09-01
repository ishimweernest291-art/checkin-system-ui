"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { publicFetch, ApiError } from "../../lib/http";
import { getPublicBackendUrl } from "../../lib/config-client";
import type { CheckOutResponse } from "../../lib/types";

const checkOutSchema = z
  .object({
    reference: z.string(),
    phone: z.string(),
  })
  .refine((values) => values.reference || values.phone, {
    message: "Enter your reference code or phone number.",
    path: ["reference"],
  });

type CheckOutValues = z.infer<typeof checkOutSchema>;

export default function CheckOutPage() {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckOutResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CheckOutValues>({
    resolver: zodResolver(checkOutSchema),
    defaultValues: { reference: "", phone: "" },
  });

  async function onSubmit(values: CheckOutValues) {
    setError(null);
    try {
      const response = await publicFetch<CheckOutResponse>(
        getPublicBackendUrl(),
        "/api/public/visits/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            reference: values.reference || undefined,
            phone: values.phone || undefined,
          }),
        },
      );
      toast.success("You're checked out.");
      setResult(response);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.problem?.detail ?? err.message)
          : "Something went wrong.",
      );
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16 sm:py-20">
      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <Link
            href="/check-in"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Need to check in instead?
          </Link>
        </div>
        <h1 className="mt-6 font-serif text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
          <span className="block italic text-[#1c97d9]">Ready to leave?</span>
          <span className="block">Check out in seconds.</span>
        </h1>
      </div>

      <Card className="shadow-none ring-0">
        <CardContent>
          {result ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#1c97d9]/10">
                <CheckCircle2 className="size-5 text-[#1c97d9]" />
              </div>
              <div>
                <p className="text-base font-medium text-foreground">
                  You&apos;re checked out. Thank you, {result.fullName}.
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-wide text-foreground">
                  {result.reference}
                </p>
              </div>
            </div>
          ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={handleSubmit(onSubmit)}
            >
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div>
                <Label htmlFor="reference">Reference code</Label>
                <Input
                  id="reference"
                  className={`mt-1.5`}
                  placeholder="e.g. AB3D9K2"
                  {...register("reference")}
                />
              </div>
              <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
                <Separator className="flex-1" />
                or
                <Separator className="flex-1" />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  placeholder="+250 788 000 000"
                  className={`mt-1.5`}
                  {...register("phone")}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-12 rounded-full text-base"
              >
                {isSubmitting ? "Checking out…" : "Check Out"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
