import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, FileText, Image as ImageIcon, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../context/AuthContext";
import { hasPermission } from "../lib/utils/permissions";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const Downloads = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "downloads", "create");
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = hasPermission(user, "downloads", "list");

  const fetchDownloads = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/downloads");
      setDownloads(response.data?.data?.downloads || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load downloads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDownloads();
    }
  }, [isAdmin]);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/downloads/${item.id}`);
      showSuccessToast("Download deleted successfully");
      fetchDownloads();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete download");
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Downloads</h1>
        <p className="mt-2 text-sm text-slate-500">Download management is only available for admin users.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Downloads</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage title, image, and PDF for downloadable items.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={fetchDownloads}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (

            <Button type="button" className="rounded-xl" onClick={() => navigate("/downloads/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Download
          </Button>

          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading downloads...</div>
        ) : downloads.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No downloads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Download</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">PDF</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {downloads.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-24 overflow-hidden rounded-2xl bg-slate-100">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <a href={item.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        Open PDF
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/downloads/${item.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button type="button" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDelete(item)}>
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

export default Downloads;
