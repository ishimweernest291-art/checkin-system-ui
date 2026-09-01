import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginImagePanel } from "@/components/auth/LoginImagePanel";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full gap-8 px-6 py-10 lg:grid-cols-2 lg:items-stretch lg:gap-10">
      <LoginImagePanel />
      <div className="flex flex-col justify-center gap-6">
        <Suspense>
          <LoginForm />
        </Suspense>
        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-1 w-max text-center text-sm text-muted-foreground underline hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
