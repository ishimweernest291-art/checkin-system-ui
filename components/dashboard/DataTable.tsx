"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  headClassName?: string;
  cellClassName?: string;
}

/** Generic admin table renderer (skeleton loading + empty state) styled like VisitsTable. */
export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  getRowKey,
  emptyMessage = "No results found.",
  skeletonRows = 5,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  getRowKey: (row: T) => string;
  emptyMessage?: React.ReactNode;
  skeletonRows?: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.headClassName}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: skeletonRows }).map((_, i) => (
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.cellClassName}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="py-10 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row) => (
            <TableRow key={getRowKey(row)} className="hover:bg-muted">
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn("align-middle", column.cellClassName)}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
