import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../context/AuthContext";
import { hasPermission } from "../lib/utils/permissions";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";

const DEPT_BADGE = {
  hospital: "bg-blue-50 text-blue-700",
  research: "bg-violet-50 text-violet-700",
  medical_college: "bg-amber-50 text-amber-700",
  nursing: "bg-rose-50 text-rose-700",
};

const DEPT_LABEL = {
  hospital: "Hospital",
  research: "Research",
  medical_college: "Medical College",
  nursing: "Nursing",
};

const Committees = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "committees", "create");
  const isAdmin = hasPermission(user, "committees", "list");
  const [committees, setCommittees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCommittees = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/committees");
      setCommittees(response.data?.data?.committees || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load committees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchCommittees();
  }, [isAdmin]);

  const handleDelete = async (item) => {
    try {
      await apiClient.delete(`/committees/${item.id}`);
      showSuccessToast("Committee deleted successfully");
      fetchCommittees();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete committee");
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Committees</h1>
        <p className="mt-2 text-sm text-slate-500">Committee management is only available for admin users.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Committees</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage all governance committees across hospital, research, and college departments.
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-lg" onClick={fetchCommittees}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button type="button" className="rounded-lg" onClick={() => navigate("/committees/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Committee
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading committees...</div>
        ) : committees.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No committees found.</div>
        ) : (
          <div className="overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Committee Name</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">Members</th>
                  <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">Order</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {committees.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                      {item.description && (
                        <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${DEPT_BADGE[item.department] || "bg-slate-100 text-slate-600"}`}>
                        {DEPT_LABEL[item.department] || item.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      {item.members?.length ?? 0}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-500">
                      {item.sort_order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => navigate(`/committees/${item.id}/members`)}
                        >
                          <Users className="mr-2 h-3.5 w-3.5" />
                          Members
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => navigate(`/committees/${item.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <DeleteConfirmationButton onConfirm={() => handleDelete(item)}>
                          <Button type="button" variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
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

export default Committees;
