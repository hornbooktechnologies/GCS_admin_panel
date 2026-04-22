import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { hasPermission } from "../lib/utils/permissions";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";

const CareerCurrentOpenings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "career", "create");
  const [openings, setOpenings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOpenings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/career/current-openings");
      setOpenings(response.data?.data?.openings || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load current openings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenings();
  }, []);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete opening "${item.position}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await apiClient.delete(`/career/current-openings/${item.id}`);
      showSuccessToast("Current opening deleted successfully");
      fetchOpenings();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete current opening");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Current Openings</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage open positions shown on the career page.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={fetchOpenings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (

            <Button type="button" className="rounded-xl" onClick={() => navigate("/career/current-openings/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Opening
          </Button>

          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading current openings...</div>
        ) : openings.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No current openings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Position</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Education</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Experience</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Description</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openings.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{item.position}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.education}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.experience}</td>
                    <td className="px-5 py-4 text-sm text-slate-600"><div className="line-clamp-2">{item.description}</div></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/career/current-openings/${item.id}/edit`)}>
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

export default CareerCurrentOpenings;
