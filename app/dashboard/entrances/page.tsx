"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BranchFilter } from "../../../components/dashboard/BranchFilter";
import { useFilters } from "../../../components/dashboard/FilterProvider";
import { EntranceFormDialog } from "@/components/dashboard/EntranceFormDialog";
import { RowActions } from "@/components/dashboard/RowActions";
import { useByEntrance } from "../../../lib/use-stats";
import { formatNumber, formatRelativeTime } from "../../../lib/format";
import { adminFetch } from "../../../lib/api-admin";
import { useSession } from "../../../lib/use-session";
import { useOrigin } from "../../../lib/use-origin";
import type { Branch, Entrance } from "../../../lib/types";

function EntranceQr({
  entrance,
  origin,
}: {
  entrance: Entrance;
  origin: string;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const url = `${origin}/check-in?entrance=${entrance.id}`;

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${entrance.name}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function handlePrint() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(
      `<html><head><title>${entrance.name}</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>${entrance.name}</h2><img src="${dataUrl}" /></body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={canvasRef}>
        <QRCodeCanvas value={url} size={140} />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download /> Download
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer /> Print
        </Button>
      </div>
    </div>
  );
}

export default function EntrancesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [branchFilter, setBranchFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editingEntrance, setEditingEntrance] = useState<Entrance | null>(null);
  const origin = useOrigin();

  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => adminFetch<Branch[]>("/admin/branches"),
    enabled: session?.role === "MANAGER",
  });

  const entrances = useQuery({
    queryKey: ["entrances", branchFilter],
    queryFn: () =>
      adminFetch<Entrance[]>(
        `/admin/entrances${branchFilter ? `?branchId=${branchFilter}` : ""}`,
      ),
  });

  const { committedFilters } = useFilters();
  const entranceStats = useByEntrance(committedFilters);
  const statsByEntranceId = new Map(
    (entranceStats.data ?? []).map((s) => [s.entranceId, s]),
  );

  const remove = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/entrances/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrances"] });
      toast.success("Entrance deleted.");
    },
    onError: () => toast.error("Failed to delete entrance."),
  });

  function startCreate() {
    setEditingEntrance(null);
    setOpen(true);
  }

  function startEdit(entrance: Entrance) {
    setEditingEntrance(entrance);
    setOpen(true);
  }

  const branchName = (id: string) =>
    branches.data?.find((b) => b.id === id)?.name ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Entrances</h1>
        <div className="flex items-center gap-2">
          {session?.role === "MANAGER" && (
            <BranchFilter value={branchFilter} onChange={setBranchFilter} />
          )}
          <Button size="lg" onClick={startCreate}>
            <Plus /> New entrance
          </Button>
        </div>
      </div>

      <EntranceFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editingEntrance}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(entrances.data ?? []).map((entrance) => (
          <Card key={entrance.id} flat className="bg-muted/40">
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <div>
                <p className="font-medium">{entrance.name}</p>
                <p className="text-xs text-muted-foreground">
                  {branchName(entrance.branchId)}
                </p>
                {statsByEntranceId.has(entrance.id) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumber(statsByEntranceId.get(entrance.id)!.count)}{" "}
                    scans in period · last{" "}
                    {formatRelativeTime(
                      statsByEntranceId.get(entrance.id)!.lastScanAt,
                    )}
                  </p>
                )}
                {!entrance.active && (
                  <Badge variant="secondary" className="mt-1">
                    Inactive
                  </Badge>
                )}
              </div>
              {origin && <EntranceQr entrance={entrance} origin={origin} />}
              <RowActions
                onEdit={() => startEdit(entrance)}
                onDelete={() => remove.mutate(entrance.id)}
                isDeleting={remove.isPending}
                deleteTitle={`Delete ${entrance.name}?`}
              />
            </CardContent>
          </Card>
        ))}
        {entrances.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No entrances yet.</p>
        )}
      </div>
    </div>
  );
}
