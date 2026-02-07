import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Eye } from 'lucide-react';
import type { TeacherStudent } from '@/api/teacher.api';

const columns: ColumnDef<TeacherStudent>[] = [
  {
    accessorKey: 'name',
    header: 'Ad Soyad',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <span className="font-medium text-gray-900">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'E-posta',
    cell: ({ row }) => <span className="text-gray-600">{row.original.email}</span>,
  },
  {
    id: 'class',
    header: 'Sınıf / Seviye',
    cell: ({ row }) => {
      const c = row.original.class;
      if (!c) return <Badge variant="outline">Sınıf atanmadı</Badge>;
      return (
        <Badge variant="secondary">
          {c.level.name} – {c.name}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'enrollmentDate',
    header: 'Katılım',
    cell: ({ row }) =>
      new Date(row.original.enrollmentDate).toLocaleDateString('tr-TR'),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link to={`/students/${row.original.id}`}>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Detay
        </Button>
      </Link>
    ),
  },
];

interface StudentsTableProps {
  data: TeacherStudent[];
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}

export function StudentsTable({
  data,
  globalFilter,
  onGlobalFilterChange,
}: StudentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === 'function' ? updater(globalFilter) : updater;
      onGlobalFilterChange(String(next ?? ''));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Öğrenci ara (ad, e-posta)..."
          value={globalFilter ?? ''}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-500"
                >
                  Öğrenci bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
