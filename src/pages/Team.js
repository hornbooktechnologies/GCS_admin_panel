import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { hasPermission } from "../lib/utils/permissions";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";


const Team = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "team", "create");
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/team");
      setMembers(response.data?.data?.members || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (item) => {
    try {
      await apiClient.delete(`/team/${item.id}`);
      showSuccessToast("Team member deleted successfully");
      fetchMembers();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete team member");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage team member profiles and assign them to team categories.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-lg" onClick={fetchMembers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (

            <Button type="button" className="rounded-lg" onClick={() => navigate("/team/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>

          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No team members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Member</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Category</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Subtitle</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                          {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon className="h-5 w-5" /></div>}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                          {item.role_tag ? (
                            <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">{item.role_tag}</div>
                          ) : null}
                          <div className="line-clamp-2 text-sm text-slate-500">
                            {item.short_description || ""}
                          </div>
                          {(item.verification_value || item.affiliation_value) ? (
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                              {item.verification_value ? (
                                <span>
                                  {item.verification_label || "Verification"}: {item.verification_value}
                                </span>
                              ) : null}
                              {item.affiliation_value ? (
                                <span>
                                  {item.affiliation_label || "Affiliation"}: {item.affiliation_value}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.category_title}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.subtitle}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate(`/team/${item.id}/edit`)}>
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

export default Team;
