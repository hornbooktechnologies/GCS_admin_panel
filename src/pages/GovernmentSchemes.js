import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, RefreshCw, Shield, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { hasPermission } from "../lib/utils/permissions";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return new Intl.NumberFormat("en-IN").format(Number(value));
};

const GovernmentSchemes = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "government-schemes", "create");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/government-schemes");
      setItems(response.data?.data?.schemes || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load government schemes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.scheme_name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/government-schemes/${item.id}`);
      showSuccessToast("Government scheme deleted successfully");
      fetchItems();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete government scheme");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Government Schemes</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage scheme details, annual stats, documents, and speciality lists.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={fetchItems}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button type="button" className="rounded-xl" onClick={() => navigate("/government-schemes/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Scheme
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading government schemes...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No government schemes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Scheme</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Badge</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">OPD Visits</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">IPD Admissions</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Shield className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{item.scheme_name}</p>
                          <p className="text-xs text-slate-500">Display order: {item.display_order || 0}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.badge_text || "-"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{formatNumber(item.opd_visits)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{formatNumber(item.ipd_admissions)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/government-schemes/${item.id}/edit`)}>
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

export default GovernmentSchemes;
