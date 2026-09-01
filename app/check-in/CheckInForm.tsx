"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { getPublicBackendUrl } from "../../lib/config-client";
import { ApiError, publicFetch } from "../../lib/http";
import type {
  CheckInResponse,
  EntranceResolveResponse,
  PublicHostResponse,
  VisitPurpose,
} from "../../lib/types";

const PURPOSES: { value: VisitPurpose; label: string }[] = [
  { value: "MEETING", label: "Meeting" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OTHER", label: "Other" },
];

const checkInSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
  purpose: z.enum(["MEETING", "DELIVERY", "INTERVIEW", "OTHER"]),
  hostId: z.string().min(1, "Please select who you are visiting"),
  consent: z.literal(true, {
    message: "Please confirm before checking in",
  }),
});

type CheckInValues = z.infer<typeof checkInSchema>;

export function CheckInForm({
  entrance,
  hosts,
}: {
  entrance: EntranceResolveResponse;
  hosts: PublicHostResponse[];
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckInValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      purpose: "MEETING",
      hostId: hosts[0]?.id ?? "",
      consent: false as unknown as true,
    },
  });

  async function onSubmit(values: CheckInValues) {
    setFormError(null);
    try {
      const response = await publicFetch<CheckInResponse>(
        getPublicBackendUrl(),
        "/api/public/visits",
        {
          method: "POST",
          body: JSON.stringify({
            entranceId: entrance.entranceId,
            fullName: values.fullName,
            phone: values.phone,
            email: values.email || undefined,
            purpose: values.purpose,
            hostId: values.hostId,
          }),
        },
      );
      toast.success("You're checked in.");
      const params = new URLSearchParams({
        ref: response.reference,
        time: response.checkInTime,
      });
      router.push(`/check-in/success?${params.toString()}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = err.problem?.fieldErrors ?? {};
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof CheckInValues, { message });
        }
        setFormError(
          err.problem?.detail ?? "Something went wrong. Please try again.",
        );
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div>
        <Label htmlFor="fullName">
          Full name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          className={`mt-1.5`}
          {...register("fullName")}
        />
        <FieldError message={errors.fullName?.message} />
      </div>

      <div>
        <Label htmlFor="phone">
          Phone number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          placeholder="+250 788 000 000"
          className={`mt-1.5`}
          {...register("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className={`mt-1.5`}
          {...register("email")}
          placeholder="john.doe@example.com"
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="purpose">
          Purpose of visit <span className="text-destructive">*</span>
        </Label>
        <Controller
          control={control}
          name="purpose"
          render={({ field }) => (
            <SimpleSelect
              id="purpose"
              className={`mt-1.5 w-full`}
              value={field.value}
              onChange={field.onChange}
              options={PURPOSES}
            />
          )}
        />
        <FieldError message={errors.purpose?.message} />
      </div>

      <div>
        <Label htmlFor="host">
          Who are you visiting? <span className="text-destructive">*</span>
        </Label>
        <Controller
          control={control}
          name="hostId"
          render={({ field }) => (
            <SimpleSelect
              id="host"
              className={`mt-1.5 w-full`}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select a host"
              options={hosts.map((h) => ({
                value: h.id,
                label: h.department
                  ? `${h.fullName} · ${h.department}`
                  : h.fullName,
              }))}
            />
          )}
        />
        <FieldError message={errors.hostId?.message} />
        {hosts.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            No hosts are currently available at this branch.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2.5">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="consent"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <Label
            htmlFor="consent"
            className="font-normal text-muted-foreground"
          >
            I agree to share my visit details for building safety and security
            purposes.
          </Label>
        </div>
        <FieldError message={errors.consent?.message} />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || hosts.length === 0}
        className="mt-2 h-12 rounded-full text-base"
      >
        {isSubmitting ? "Checking in…" : "Check In"}
      </Button>
    </form>
  );
}
