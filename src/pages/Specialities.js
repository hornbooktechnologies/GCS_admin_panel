import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, FileText, Image as ImageIcon, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const Specialities = () => {
  const navigate = useNavigate();
  const { showErrorToast, showSuccessToast } = useToast();
  const [specialities, setSpecialities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSpecialities = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/specialities");
      setSpecialities(response.data?.data?.specialities || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load specialities");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialities();
  }, []);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.title}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await apiClient.delete(`/specialities/${item.id}`);
      showSuccessToast("Speciality deleted successfully");
      fetchSpecialities();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete speciality");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Specialities</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage top banners, main banners, descriptions, category, and brochure assets.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={fetchSpecialities}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => navigate("/specialities/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Speciality
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading specialities...</div>
        ) : specialities.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No specialities found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Speciality</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Category</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Main Banners</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Brochure</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {specialities.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-24 overflow-hidden rounded-2xl bg-slate-100">
                          {item.top_banner_url ? (
                            <img src={item.top_banner_url} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                          <div className="line-clamp-2 text-sm text-slate-500">{item.sub_description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm capitalize text-slate-600">{item.category}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.main_banners?.length || 0} image(s)</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <a href={item.brochure_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        Open {item.brochure_type === "pdf" ? "PDF" : "file"}
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/specialities/${item.id}/edit`)}>
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

export default Specialities;
