"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Edit + delete-with-confirmation button pair shared by the admin tables/cards. */
export function RowActions({
  onEdit,
  onDelete,
  deleteTitle,
  deleteDescription = "This action cannot be undone.",
  isDeleting = false,
  extra,
}: {
  onEdit: () => void;
  onDelete: () => void;
  deleteTitle: string;
  deleteDescription?: string;
  isDeleting?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex justify-end gap-2">
      {extra}
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Pencil /> Edit
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 /> Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
