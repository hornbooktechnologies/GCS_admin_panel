import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const Journals = () => {
  const navigate = useNavigate();
  const { showErrorToast, showSuccessToast } = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/journals");
      setItems(response.data?.data?.journals || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load journals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete journal volume "${item.volume}" number "${item.number}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/journals/${item.id}`);
      showSuccessToast("Journal deleted successfully");
      fetchItems();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete journal");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Journals</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage volume, number, duration, and section-wise journal entries.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={fetchItems}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => navigate("/journals/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Journal
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading journals...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No journals found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Volume</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Number</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Duration</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Entries</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{item.volume}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{item.number}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{item.duration}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div>Editorial: {item.entry_counts?.editorial || 0}</div>
                      <div>Original Article: {item.entry_counts?.original_article || 0}</div>
                      <div>Case Report: {item.entry_counts?.case_report || 0}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/journals/${item.id}/edit`)}>
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

export default Journals;
