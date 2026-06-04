import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";

const ROLES = ["Chairman", "Secretary", "Member-Secretary", "Ex-officio", "Member"];

const DEPT_LABEL = {
  hospital: "Hospital",
  research: "Research",
  medical_college: "Medical College",
  nursing: "Nursing",
};

const CommitteeMembers = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showErrorToast, showSuccessToast } = useToast();
  const [committee, setCommittee] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRow, setNewRow] = useState({ member_name: "", member_role: "Member", sort_order: "", contact_no: "", email: "" });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/committees/${id}`);
      const item = response.data?.data?.committee;
      if (!item) {
        showErrorToast("Committee not found");
        navigate("/committees");
        return;
      }
      setCommittee(item);
      setMembers(
        (item.members || []).map((m) => ({ ...m, _dirty: false })),
      );
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load committee");
      navigate("/committees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const updateLocalMember = (memberId, field, value) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, [field]: value, _dirty: true } : m,
      ),
    );
  };

  const saveMember = async (member) => {
    setSavingId(member.id);
    try {
      await apiClient.put(`/committees/${id}/members/${member.id}`, {
        member_name: member.member_name,
        member_role: member.member_role,
        sort_order: Number(member.sort_order) || 0,
        contact_no: member.contact_no || null,
        email: member.email || null,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, _dirty: false } : m)),
      );
      showSuccessToast("Member updated successfully");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to save member");
    } finally {
      setSavingId(null);
    }
  };

  const deleteMember = async (member) => {
    setDeletingId(member.id);
    try {
      await apiClient.delete(`/committees/${id}/members/${member.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      showSuccessToast("Member removed");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete member");
    } finally {
      setDeletingId(null);
    }
  };

  const addMember = async () => {
    if (!newRow.member_name.trim()) {
      showErrorToast("Member name is required");
      return;
    }
    setIsAddingRow(true);
    try {
      const response = await apiClient.post(`/committees/${id}/members`, {
        member_name: newRow.member_name.trim(),
        member_role: newRow.member_role,
        sort_order: Number(newRow.sort_order) || members.length,
        contact_no: newRow.contact_no.trim() || null,
        email: newRow.email.trim() || null,
      });
      const newId = response.data?.data?.id;
      setMembers((prev) => [
        ...prev,
        {
          id: newId,
          member_name: newRow.member_name.trim(),
          member_role: newRow.member_role,
          sort_order: Number(newRow.sort_order) || members.length,
          contact_no: newRow.contact_no.trim() || null,
          email: newRow.email.trim() || null,
          _dirty: false,
        },
      ]);
      setNewRow({ member_name: "", member_role: "Member", sort_order: "", contact_no: "", email: "" });
      showSuccessToast("Member added successfully");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to add member");
    } finally {
      setIsAddingRow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading committee members...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6">
      <div>
        <Button type="button" variant="ghost" className="-ml-3 mb-2 rounded-lg px-3 text-slate-500" onClick={() => navigate("/committees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Committees
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {committee?.name}
        </h1>
        {committee && (
          <p className="mt-1 text-sm font-medium text-slate-500">
            {DEPT_LABEL[committee.department]} — {members.length} members
          </p>
        )}
      </div>

      <div className="rounded-lg border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Member Name</th>
                <th className="w-52 px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Role</th>
                <th className="w-36 px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Contact No</th>
                <th className="w-48 px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Email</th>
                <th className="w-28 px-5 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">Order</th>
                <th className="w-36 px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((member) => (
                <tr key={member.id} className={member._dirty ? "bg-amber-50/40" : "hover:bg-slate-50"}>
                  <td className="px-5 py-3">
                    <Input
                      value={member.member_name}
                      onChange={(e) => updateLocalMember(member.id, "member_name", e.target.value)}
                      className="h-9 rounded-lg border-slate-200 text-sm"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Select
                      value={member.member_role}
                      onValueChange={(v) => updateLocalMember(member.id, "member_role", v)}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      value={member.contact_no || ""}
                      onChange={(e) => updateLocalMember(member.id, "contact_no", e.target.value)}
                      placeholder="Optional"
                      className="h-9 rounded-lg border-slate-200 text-sm"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      value={member.email || ""}
                      onChange={(e) => updateLocalMember(member.id, "email", e.target.value)}
                      placeholder="Optional"
                      className="h-9 rounded-lg border-slate-200 text-sm"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      type="number"
                      min="0"
                      value={member.sort_order}
                      onChange={(e) => updateLocalMember(member.id, "sort_order", e.target.value)}
                      className="h-9 rounded-lg border-slate-200 text-center text-sm"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {member._dirty && (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-lg"
                          disabled={savingId === member.id}
                          onClick={() => saveMember(member)}
                        >
                          {savingId === member.id ? (
                            <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Save
                        </Button>
                      )}
                      <DeleteConfirmationButton onConfirm={() => deleteMember(member)}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                          disabled={deletingId === member.id}
                        >
                          {deletingId === member.id ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DeleteConfirmationButton>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Add new member row */}
              <tr className="border-t-2 border-dashed border-slate-200 bg-slate-50/60">
                <td className="px-5 py-3">
                  <Input
                    value={newRow.member_name}
                    onChange={(e) => setNewRow((r) => ({ ...r, member_name: e.target.value }))}
                    placeholder="New member name"
                    className="h-9 rounded-lg border-slate-200 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addMember();
                    }}
                  />
                </td>
                <td className="px-5 py-3">
                  <Select value={newRow.member_role} onValueChange={(v) => setNewRow((r) => ({ ...r, member_role: v }))}>
                    <SelectTrigger className="h-9 rounded-lg border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-5 py-3">
                  <Input
                    value={newRow.contact_no}
                    onChange={(e) => setNewRow((r) => ({ ...r, contact_no: e.target.value }))}
                    placeholder="Optional"
                    className="h-9 rounded-lg border-slate-200 text-sm"
                  />
                </td>
                <td className="px-5 py-3">
                  <Input
                    value={newRow.email}
                    onChange={(e) => setNewRow((r) => ({ ...r, email: e.target.value }))}
                    placeholder="Optional"
                    className="h-9 rounded-lg border-slate-200 text-sm"
                  />
                </td>
                <td className="px-5 py-3">
                  <Input
                    type="number"
                    min="0"
                    value={newRow.sort_order}
                    onChange={(e) => setNewRow((r) => ({ ...r, sort_order: e.target.value }))}
                    placeholder={String(members.length)}
                    className="h-9 rounded-lg border-slate-200 text-center text-sm"
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-lg"
                      disabled={isAddingRow}
                      onClick={addMember}
                    >
                      {isAddingRow ? (
                        <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Add
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommitteeMembers;
