import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { hasPermission } from "../lib/utils/permissions";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";


const CampusLife = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "campus-life", "create");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
  });

  const fetchItems = async (page = pagination.page, nextFilters = filters) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/campus-life", {
        params: {
          page,
          limit: pagination.limit,
          search: nextFilters.search.trim() || undefined,
        },
      });
      const data = response.data?.data || {};
      setItems(data.campusLifeItems || []);
      setPagination((current) => ({
        ...current,
        ...(data.pagination || {}),
        page: data.pagination?.page || page,
        pages: Math.max(1, data.pagination?.pages || 1),
      }));
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load campus life items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (item) => {
    try {
      await apiClient.delete(`/campus-life/${item.id}`);
      showSuccessToast("Campus life item deleted successfully");
      const shouldStepBack = items.length === 1 && pagination.page > 1;
      fetchItems(shouldStepBack ? pagination.page - 1 : pagination.page);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete campus life item");
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.pages || nextPage === pagination.page) {
      return;
    }

    fetchItems(nextPage);
  };

  const getPageNumbers = () => {
    const totalPages = pagination.pages || 1;
    const currentPage = pagination.page || 1;
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    fetchItems(1);
  };

  const clearFilters = () => {
    const emptyFilters = { search: "" };
    setFilters(emptyFilters);
    fetchItems(1, emptyFilters);
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campus Life</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage campus life image cards and titles.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => fetchItems(pagination.page)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (

            <Button type="button" className="rounded-lg" onClick={() => navigate("/campus-life/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Campus Life
          </Button>

          )}
        </div>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="rounded-lg border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Search campus life
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search by title"
                className="rounded-lg pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="rounded-lg" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button type="button" variant="outline" className="rounded-lg" onClick={clearFilters} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </form>

      <div className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading campus life items...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No campus life items found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
                <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                  <div className="bg-slate-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-full min-h-56 w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-56 items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{item.title}</h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate(`/campus-life/${item.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <DeleteConfirmationButton onConfirm={() => handleDelete(item)}>
                        <Button type="button" variant="outline" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </DeleteConfirmationButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            Showing page {pagination.page} of {pagination.pages} - {pagination.total} total items
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {getPageNumbers().map((pageNumber) => (
              <Button
                key={pageNumber}
                type="button"
                variant={pageNumber === pagination.page ? "default" : "outline"}
                className="h-10 min-w-10 rounded-lg px-3"
                disabled={isLoading}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={pagination.page >= pagination.pages || isLoading}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusLife;
