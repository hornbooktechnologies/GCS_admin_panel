import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { hasPermission } from "../lib/utils/permissions";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";


const CareerCurrentOpenings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "career", "create");
  const [openings, setOpenings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOpenings = async (searchTerm = search) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const response = await apiClient.get(`/career/current-openings?${params.toString()}`);
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
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchOpenings(search)}
            placeholder="Search positions..."
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/30 w-64"
          />
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => fetchOpenings(search)}>
            Search
          </Button>
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => fetchOpenings()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button type="button" className="rounded-lg" onClick={() => navigate("/career/current-openings/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Opening
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
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
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Education</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Experience</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Department</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Description</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openings.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{item.position}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.status === "open"
                          ? "bg-green-100 text-green-700"
                          : item.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {item.status === "open" ? "Open" : item.status === "draft" ? "Draft" : "Closed"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.education}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.experience}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.department || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600"><div className="line-clamp-2">{item.description}</div></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate(`/career/current-openings/${item.id}/edit`)}>
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
