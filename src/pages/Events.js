import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuthStore } from "../context/AuthContext";
import { hasPermission } from "../lib/utils/permissions";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";


const Events = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "events", "create");
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
    year: "",
    place: "",
  });

  const isAdmin = hasPermission(user, "events", "list");

  const fetchEvents = async (page = pagination.page, nextFilters = filters) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/events", {
        params: {
          page,
          limit: pagination.limit,
          search: nextFilters.search.trim() || undefined,
          year: nextFilters.year.trim() || undefined,
          place: nextFilters.place.trim() || undefined,
        },
      });
      const data = response.data?.data || {};
      setEvents(data.events || []);
      setPagination((current) => ({
        ...current,
        ...(data.pagination || {}),
        page: data.pagination?.page || page,
        pages: Math.max(1, data.pagination?.pages || 1),
      }));
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load event data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin]);

  const handleDelete = async (eventItem) => {
    try {
      await apiClient.delete(`/events/${eventItem.id}`);
      showSuccessToast("Event deleted successfully");
      const shouldStepBack = events.length === 1 && pagination.page > 1;
      fetchEvents(shouldStepBack ? pagination.page - 1 : pagination.page);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete event");
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.pages || nextPage === pagination.page) {
      return;
    }

    fetchEvents(nextPage);
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
    fetchEvents(1);
  };

  const clearFilters = () => {
    const emptyFilters = { search: "", year: "", place: "" };
    setFilters(emptyFilters);
    fetchEvents(1, emptyFilters);
  };

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <p className="mt-2 text-sm text-slate-500">
          Event management is only available for admin users.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Events
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage event listings, thumbnails, galleries, dates, and places.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => fetchEvents(pagination.page)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (

            <Button
            type="button"
            className="rounded-lg"
            onClick={() => navigate("/events/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>

          )}
        </div>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="rounded-lg border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl"
      >
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.7fr_1fr_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Search events
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Title or description"
                className="rounded-lg pl-10"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Year
            </label>
            <Input
              type="number"
              value={filters.year}
              onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              placeholder="2025"
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Place
            </label>
            <Input
              value={filters.place}
              onChange={(event) => setFilters((current) => ({ ...current, place: event.target.value }))}
              placeholder="Auditorium, campus..."
              className="rounded-lg"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="rounded-lg" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button type="button" variant="outline" className="rounded-lg" onClick={clearFilters} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Calendar className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">No events found</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create your first event to populate this module.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Event
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Place
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Gallery
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((eventItem) => (
                  <tr key={eventItem.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="min-w-20 h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                          {eventItem.thumbnail_image_url ? (
                            <img
                              src={eventItem.thumbnail_image_url}
                              alt={eventItem.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-800">
                            {eventItem.title}
                          </div>
                          <div className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {eventItem.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {String(eventItem.event_date).slice(0, 10)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{eventItem.place}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {eventItem.gallery_images?.length || 0} image(s)
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => navigate(`/events/${eventItem.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <DeleteConfirmationButton onConfirm={() => handleDelete(eventItem)}>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </DeleteConfirmationButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            Showing page {pagination.page} of {pagination.pages} - {pagination.total} total events
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

export default Events;
