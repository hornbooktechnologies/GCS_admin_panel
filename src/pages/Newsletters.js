import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../context/AuthContext";
import { hasPermission } from "../lib/utils/permissions";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const Newsletters = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "newsletters", "create");
  const [newsletters, setNewsletters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = hasPermission(user, "newsletters", "list");

  const fetchNewsletters = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/newsletters");
      setNewsletters(response.data?.data?.newsletters || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load newsletters");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchNewsletters();
    }
  }, [isAdmin]);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete newsletter "${item.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/newsletters/${item.id}`);
      showSuccessToast("Newsletter deleted successfully");
      fetchNewsletters();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete newsletter");
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Newsletters</h1>
        <p className="mt-2 text-sm text-slate-500">
          Newsletter management is only available for admin users.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Newsletters
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage newsletter title, photo, attachment, and year.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={fetchNewsletters}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (

            <Button
            type="button"
            className="rounded-xl"
            onClick={() => navigate("/newsletters/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Newsletter
          </Button>

          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            Loading newsletters...
          </div>
        ) : newsletters.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              No newsletters found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create your first newsletter to populate this module.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Newsletter
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Year
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Attachment
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {newsletters.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-24 overflow-hidden rounded-2xl bg-slate-100">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={item.title}
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
                            {item.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.year}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="inline-flex items-center gap-2">
                        {item.attachment_type === "pdf" ? (
                          <FileText className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="capitalize">{item.attachment_type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <a
                          href={item.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Open
                        </a>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => navigate(`/newsletters/${item.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(item)}
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

export default Newsletters;
