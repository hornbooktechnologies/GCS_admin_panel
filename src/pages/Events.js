import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const Events = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/events");
      setEvents(response.data?.data?.events || []);
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
    const confirmed = window.confirm(
      `Delete event "${eventItem.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/events/${eventItem.id}`);
      showSuccessToast("Event deleted successfully");
      fetchEvents();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete event");
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
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
            className="rounded-xl"
            onClick={fetchEvents}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => navigate("/events/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
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
                        <div className="h-16 w-24 overflow-hidden rounded-2xl bg-slate-100">
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
                          className="rounded-xl"
                          onClick={() => navigate(`/events/${eventItem.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(eventItem)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
