import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  getActivityLogs,
  deleteActivityLog,
  deleteMultipleActivityLogs,
} from "../../services/activityLogService";
import {
  Loader2,
  Trash2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
} from "../ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";

const ActivityLogTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [filters, setFilters] = useState({
    module: "",
    user_id: "",
    date: "",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pagination.per_page,
          ...filters,
        };
        // Clean up empty filters
        Object.keys(params).forEach(
          (key) =>
            (params[key] === "" || params[key] === null) && delete params[key],
        );

        const response = await getActivityLogs(params);
        if (response.success || response.logs) {
          // Handle case where success might be implicit or response structure varies
          const responseData = response.data || response; // Sometimes requestHandler returns data directly or wrapper

          // Check for 'logs' array in different possible locations
          const data = responseData.logs || responseData.data || [];

          const meta = responseData.pagination || {
            current_page: responseData.page || page,
            per_page: responseData.limit || 10,
            total: responseData.total || data.length,
            last_page:
              responseData.totalPages ||
              Math.ceil(
                (responseData.total || data.length) /
                (responseData.limit || 10),
              ),
          };

          setLogs(Array.isArray(data) ? data : []);
          setPagination({
            current_page: meta.current_page || page,
            per_page: meta.per_page || 10,
            total: meta.total || 0,
            last_page: meta.last_page || 1,
          });
        }
      } catch (error) {
        console.error("Failed to fetch activity logs", error);
        toast.error("Failed to fetch activity logs.");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.per_page],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ module: "", user_id: "", date: "" });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchLogs(newPage);
    }
  };

  const handlePerPageChange = (value) => {
    setPagination((prev) => ({
      ...prev,
      per_page: Number(value),
      current_page: 1,
    }));
    // We need to trigger a fetch, but since pagination.per_page is a dependency of fetchLogsCallback,
    // and we're updating it via state, the effect might not pick it up correctly if we don't be careful.
    // However, fetchLogs depends on pagination.per_page.
    // So updating state will trigger the effect if included in dependency array of useEffect.
    // But fetchLogs is memoized with [pagination.per_page].
    // Let's rely on the useEffect which calls fetchLogs(1) when per_page changes?
    // Actually, current useEffect is on mount only: useEffect(() => { fetchLogs(1); }, [fetchLogs]);
    // And fetchLogs depends on pagination.per_page. So if per_page changes, fetchLogs is recreated.
    // So the effect will run again? Yes.
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteActivityLog(id);
      if (response && (response.success || response.success === undefined)) {
        toast.success("Log deleted successfully.");
        fetchLogs(pagination.current_page);
        setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
      } else {
        toast.error(response?.message || "Failed to delete log.");
      }
    } catch (error) {
      console.error("Delete error", error);
      toast.error("An error occurred while deleting.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const response = await deleteMultipleActivityLogs(selectedIds);
      if (response && (response.success || response.success === undefined)) {
        toast.success("Selected logs deleted successfully.");
        fetchLogs(1); // Reset to first page
        setSelectedIds([]);
      } else {
        toast.error(response?.message || "Failed to delete logs.");
      }
    } catch (error) {
      console.error("Bulk delete error", error);
      toast.error("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(logs.map((log) => log.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const getPageNumbers = () => {
    const { current_page, last_page } = pagination;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);

    if (last_page <= 1) return range;

    for (let i = current_page - delta; i <= current_page + delta; i++) {
      if (i < last_page && i > 1) {
        range.push(i);
      }
    }

    range.push(last_page);

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (

    <>
      {/* Page Header - Outside Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary-hover to-primary bg-clip-text text-transparent pb-2">
            Activity Logs
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            View and manage system activity logs
          </p>
        </div>
      </div>

      <Card
        className="border border-white/60 shadow-2xl overflow-hidden backdrop-blur-xl bg-white/60 ring-1 ring-black/5"
        style={{
          boxShadow:
            "0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <CardHeader className="flex flex-row items-center justify-end pb-2 space-y-0">
          <div className='flex flex-wrap gap-2 w-full md:w-auto justify-end'>
            <Input
              placeholder='Filter Module'
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className='w-full md:w-32 lg:w-40 h-9 bg-white'
            />
            <Input
              placeholder='Filter User ID'
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className='w-full md:w-32 lg:w-40 h-9 bg-white'
            />

            <div className='relative group w-full md:w-auto'>
              {/* Visible Display Input (Formatted dd-mm-yyyy) */}
              <Input
                type="text"
                readOnly
                placeholder="Select Date"
                value={filters.date ? filters.date.split('-').reverse().join('-') : ""}
                className='w-full md:w-32 lg:w-40 h-9 pr-10 bg-white border-2 border-gray-200 focus:border-[#5283c5] text-gray-700'
              />

              <Calendar
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#3a5f9e] transition-colors'
                size={16}
              />

              <Input
                type='date'
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                style={{ colorScheme: 'light' }}
                onClick={(e) => {
                  try {
                    if (e.target.showPicker) {
                      e.target.showPicker();
                    }
                  } catch (err) { }
                }}
              />
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={clearFilters}
              className='h-9 px-3 border-2 border-gray-200 bg-white hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all duration-200'
              title='Clear Filters'
            >
              <X className='w-4 h-4' />
            </Button>
            {selectedIds.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size='sm'
                    className='h-9 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md border-0 transition-all duration-300'
                  >
                    <Trash2 className='w-4 h-4 mr-2' />
                    Delete ({selectedIds.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the selected activity logs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className='bg-red-600 hover:bg-red-700'
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 sm:pt-0 overflow-x-auto">
          {loading ? (
            <div className='flex justify-center p-12'>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className='text-center p-8 text-gray-500'>
              No activity logs found matching your criteria.
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader className='bg-gray-50'>
                    <TableRow>
                      <TableHead className='w-[50px]'>
                        <Checkbox
                          checked={
                            selectedIds.length === logs.length && logs.length > 0
                          }
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className='text-right sticky right-0 bg-gray-50 z-20 shadow-[-2px_0px_5px_rgba(0,0,0,0.05)] w-[100px]'>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className='hover:bg-gray-50/50'>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(log.id)}
                            onChange={(e) =>
                              toggleSelectOne(log.id, e.target.checked)
                            }
                          />
                        </TableCell>
                        <TableCell className='font-medium text-gray-700 whitespace-nowrap'>
                          {new Date(log.created_at).toLocaleString('en-GB')}
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-col'>
                            <span className='font-medium text-gray-900'>
                              {log.first_name} {log.last_name}
                            </span>
                            <span className='text-xs text-gray-500'>
                              {log.email || `ID: ${log.user_id}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100'>
                            {log.module_name || log.module}
                          </span>
                        </TableCell>
                        <TableCell
                          className='max-w-xs truncate'
                          title={log.description}
                        >
                          {log.description}
                        </TableCell>
                        <TableCell className='font-mono text-xs text-gray-500'>
                          {log.ip_address}
                        </TableCell>
                        <TableCell className='text-right sticky right-0 bg-white z-10 shadow-[-2px_0px_5px_rgba(0,0,0,0.05)]'>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-red-500 hover:text-red-700 hover:bg-red-50'
                              >
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Log?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this activity
                                  log? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(log.id)}
                                  className='bg-red-600 hover:bg-red-700'
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              {pagination.last_page > 1 && (
                <div className='flex items-center justify-between border-t border-gray-200 pt-4'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-500'>Rows per page:</span>
                    <Select
                      value={pagination.per_page.toString()}
                      onValueChange={handlePerPageChange}
                    >
                      <SelectTrigger className='w-[70px] h-8'>
                        <SelectValue placeholder={pagination.per_page} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='10'>10</SelectItem>
                        <SelectItem value='20'>20</SelectItem>
                        <SelectItem value='50'>50</SelectItem>
                        <SelectItem value='100'>100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() =>
                        handlePageChange(pagination.current_page - 1)
                      }
                      disabled={pagination.current_page === 1}
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </Button>

                    <div className='flex items-center gap-1'>
                      {getPageNumbers().map((page, index) =>
                        page === '...' ? (
                          <span
                            key={`dots-${index}`}
                            className='px-2 text-gray-400'
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={
                              pagination.current_page === page
                                ? 'default'
                                : 'outline'
                            }
                            size='sm'
                            className="h-8 w-8"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        ),
                      )}
                    </div>

                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() =>
                        handlePageChange(pagination.current_page + 1)
                      }
                      disabled={pagination.current_page === pagination.last_page}
                    >
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ActivityLogTable;

