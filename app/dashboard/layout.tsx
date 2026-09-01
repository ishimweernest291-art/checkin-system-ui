import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/session";
import { getBackendUrl } from "../../lib/config";
import { UserMenu } from "../../components/dashboard/UserMenu";
import { Logo } from "../../components/Logo";
import { DashboardNav } from "../../components/dashboard/DashboardNav";
import { FilterProvider } from "../../components/dashboard/FilterProvider";
import type { Branch } from "../../lib/types";

const NAV = [
  { href: "/dashboard", label: "Overview", managerOnly: false },
  { href: "/dashboard/visits", label: "Visits", managerOnly: false },
  { href: "/dashboard/entrances", label: "Entrances", managerOnly: false },
  { href: "/dashboard/hosts", label: "Hosts", managerOnly: false },
  { href: "/dashboard/branches", label: "Branches", managerOnly: true },
  { href: "/dashboard/users", label: "Users", managerOnly: true },
];

async function getOwnBranchName(
  branchId: string,
  token: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${getBackendUrl()}/api/admin/branches/${branchId}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!response.ok) {
      return null;
    }
    const branch: Branch = await response.json();
    return branch.name;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const links = NAV.filter(
    (item) => !item.managerOnly || session.role === "MANAGER",
  );

  const branchName =
    session.role === "BRANCH_MANAGER" && session.branchId
      ? await getOwnBranchName(session.branchId, session.token)
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="flex shrink-0 items-center">
            <Logo className="h-6 w-auto sm:h-8 lg:h-14" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              {branchName && (
                <p className="text-sm font-semibold text-foreground">
                  {branchName}
                </p>
              )}
              <p className="text-sm font-medium text-foreground">
                {session.fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.email} · {session.role}
              </p>
            </div>
            <UserMenu fullName={session.fullName} email={session.email} />
          </div>
        </div>
        <div className="mx-auto overflow-x-auto px-6 pb-3 pt-3">
          <DashboardNav links={links} />
        </div>
      </header>
      <main className="mx-auto w-full flex-1 px-6 py-8">
        <FilterProvider>{children}</FilterProvider>
      </main>
    </div>
  );
}
