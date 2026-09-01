import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const STEPS = [
  {
    title: "Scan the QR code at the entrance",
    description:
      "Look for the QR code posted at reception or the entrance you're visiting, and scan it with your phone camera.",
  },
  {
    title: "Complete the check-in form",
    description:
      "Fill in your name, phone number, the purpose of your visit, and select who you are visiting.",
  },
  {
    title: "Wait for the confirmation",
    description:
      "You'll receive a reference code once your visit is recorded — keep it handy for when you leave.",
  },
  {
    title: "Use your reference or phone number to check out",
    description:
      "When you're ready to leave, visit the check-out page and enter either your reference code or phone number.",
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16 sm:py-20">
      <div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>
        <h1 className="mt-6 font-serif text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
          <span className="block italic text-[#1c97d9]">How it works.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          A quick guide to checking in and out as a visitor. If you get stuck,
          reception staff at your branch are always happy to help.
        </p>
      </div>

      <ol className="flex flex-col">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-5 border-t border-border py-6 first:pt-0 first:border-none"
          >
            <span className="font-serif text-2xl italic text-[#1c97d9]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="text-base font-medium text-foreground">
                {step.title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
