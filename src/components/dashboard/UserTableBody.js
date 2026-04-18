import React, { useMemo } from 'react';
import ReusableDataTable from '../common/data-table/ReusableDataTable';
import { EllipsisVertical, UserRoundPen, Trash2, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function UserTable({
  users,
  setFormMode,
  setIsCreateEditUserDialogOpen,
  getUserForEdit,
  handleViewUser,
  handleDeleteUser,
  handlePageChange,
  handlePerPageChange,
  onRowClick,
  pagination,
  loading,
  resetSortTrigger,
}) {
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant='secondary'
            className='capitalize bg-green-200 text-green-800'
          >
            {status}
          </Badge>
        );
      case 'inactive':
        return (
          <Badge
            variant='secondary'
            className='capitalize bg-red-200 text-red-800'
          >
            {status}
          </Badge>
        );
      default:
        return <span className="capitalize">{status}</span>;
    }
  };

  const columns = useMemo(
    () => [
      // {
      //   field: 'index',
      //   headerName: 'Sr. No',
      //   width: '60px',
      //   sortable: false,
      //   renderCell: (params) => {
      //     const index = users.findIndex((u) => u.id === params.row.id);
      //     return (
      //       (pagination?.current_page - 1) * (pagination?.per_page || 10) +
      //       index +
      //       1
      //     );
      //   },
      // },
      {
        field: 'first_name',
        headerName: 'Name',
        valueGetter: (value, row) => `${row.first_name} ${row.last_name}`,
        renderCell: (params) => (
          <span className='capitalize'>
            {params.row.first_name} {params.row.last_name}
          </span>
        ),
      },
      {
        field: 'email',
        headerName: 'Email',
        renderCell: ({ value }) => (
          <div className="w-full flex items-center" title={value}>
            <span className='text-slate-600 font-semibold truncate max-w-[200px] block'>
              {value}
            </span>
          </div>
        ),
      },
      {
        field: 'phone_number',
        headerName: 'Phone Number',
        width: '150px',
        renderCell: ({ value }) => (
          <span className='text-slate-600'>{value || 'N/A'}</span>
        ),
      },
      {
        field: 'dob',
        headerName: 'Date of Birth',
        width: '150px',
        renderCell: ({ value }) => (
          <span className='text-slate-600'>
            {value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
          </span>
        ),
      },
      {
        field: 'role',
        headerName: 'Role',
        width: '120px',
        renderCell: ({ value }) => (
          <span className='uppercase font-medium'>{value}</span>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: '120px',
        sortable: true,
        renderCell: ({ value }) => renderStatusBadge(value),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        align: 'center',
        sticky: 'right',
        cellClassName: 'pl-6 bg-white',
        headerClassName: 'pl-6 bg-white',
        renderCell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='data-[state=open]:bg-muted h-8 w-8 p-0 hover:bg-slate-100 rounded-full transition-colors'
              >
                <EllipsisVertical className='h-4 w-4 text-slate-500 hover:text-slate-900' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-fit min-w-auto p-2 space-y-1 bg-white border border-slate-200 shadow-lg rounded-xl'
            >
              <DropdownMenuItem
                className='cursor-pointer flex items-center gap-2 p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus:bg-slate-100'
                onClick={() => handleViewUser(row.id)}
              >
                <Eye className='w-4 h-4 text-green-500' />
                <span className='font-medium'>View</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className='cursor-pointer flex items-center gap-2 p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus:bg-slate-100'
                onClick={() => {
                  setFormMode?.('edit');
                  setIsCreateEditUserDialogOpen?.(true);
                  getUserForEdit(row.id);
                }}
              >
                <UserRoundPen className='w-4 h-4 text-blue-500' />
                <span className='font-medium'>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className='cursor-pointer flex items-center gap-2 p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:bg-red-50'
                onClick={() => handleDeleteUser(row.id)}
              >
                <Trash2 className='w-4 h-4' />
                <span className='font-medium'>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      pagination,
      users,
      setFormMode,
      setIsCreateEditUserDialogOpen,
      getUserForEdit,
    ],
  );

  return (
    <>
      <ReusableDataTable
        columns={columns}
        rows={users || []}
        loading={loading}
        checkboxSelection={false}
        pageSize={10}
        handlePageChange={handlePageChange}
        handlePerPageChange={handlePerPageChange}
        emptyMessage='No users available at the moment!'
        onRowClick={onRowClick}
        pagination={pagination}
        resetSortTrigger={resetSortTrigger}
      />
    </>
  );
}
