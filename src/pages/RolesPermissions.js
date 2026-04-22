import React, { useEffect, useState } from "react";
import { Edit, LoaderCircle, Plus, Save, Shield, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import { requestHandler } from "../lib/utils/network-client";
import {
  hasPermission,
  PermissionActions,
  PermissionModules,
} from "../lib/utils/permissions";

const emptyPermissions = (modules = PermissionModules) =>
  modules.reduce((acc, module) => {
    acc[module.key] = {
      create: false,
      list: false,
      edit: false,
      delete: false,
    };
    return acc;
  }, {});

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  permissions: emptyPermissions(),
};

const RolesPermissions = () => {
  const { user } = useAuthStore();
  const { showSuccessToast, showErrorToast } = useToast();
  const canCreate = hasPermission(user, "roles", "create");
  const canEdit = hasPermission(user, "roles", "edit");
  const canDelete = hasPermission(user, "roles", "delete");
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState(PermissionModules);
  const [actions, setActions] = useState(PermissionActions);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const [rolesResponse, modulesResponse] = await Promise.all([
        requestHandler("/roles"),
        requestHandler("/roles/modules"),
      ]);

      if (modulesResponse.success) {
        setModules(modulesResponse.data.modules || PermissionModules);
        setActions(modulesResponse.data.actions || PermissionActions);
      }

      if (rolesResponse.success) {
        setRoles(rolesResponse.data.roles || []);
      } else {
        showErrorToast(rolesResponse.message || "Failed to load roles");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ ...emptyForm, permissions: emptyPermissions(modules) });
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name || "",
      slug: role.slug || "",
      description: role.description || "",
      status: role.status || "active",
      permissions: {
        ...emptyPermissions(modules),
        ...(role.permissions || {}),
      },
    });
    setDialogOpen(true);
  };

  const setPermission = (moduleKey, action, checked) => {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [moduleKey]: {
          ...(current.permissions[moduleKey] || {}),
          [action]: checked,
        },
      },
    }));
  };

  const toggleModule = (moduleKey, checked) => {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [moduleKey]: actions.reduce((acc, action) => {
          acc[action] = checked;
          return acc;
        }, {}),
      },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showErrorToast("Role name is required");
      return;
    }

    setIsSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
    };
    const response = await requestHandler(
      editingRole ? `/roles/${editingRole.id}` : "/roles",
      {
        method: editingRole ? "PUT" : "POST",
        body: payload,
      },
    );
    setIsSaving(false);

    if (response.success) {
      showSuccessToast(response.message);
      setDialogOpen(false);
      fetchRoles();
    } else {
      showErrorToast(response.message || "Unable to save role");
    }
  };

  const handleDelete = async (role) => {
    const confirmed = window.confirm(`Delete role "${role.name}"?`);
    if (!confirmed) return;

    const response = await requestHandler(`/roles/${role.id}`, {
      method: "DELETE",
    });
    if (response.success) {
      showSuccessToast(response.message);
      fetchRoles();
    } else {
      showErrorToast(response.message || "Unable to delete role");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create custom roles and assign create, list, edit, and delete access.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        )}
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm font-medium text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading roles...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => {
                  const moduleCount = Object.values(role.permissions || {}).filter(
                    (permission) => Object.values(permission).some(Boolean),
                  ).length;
                  return (
                    <tr key={role.id} className="border-b border-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{role.name}</p>
                            <p className="text-xs text-slate-500">
                              {role.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">
                        {role.slug}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                          {role.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {role.slug === "admin" ? "All modules" : `${moduleCount} modules`}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={Boolean(role.is_system)}
                              onClick={() => handleDelete(role)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[980px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  disabled={editingRole?.slug === "admin"}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  disabled={Boolean(editingRole?.is_system)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, status: value }))
                  }
                  disabled={Boolean(editingRole?.is_system)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="max-h-[52vh] overflow-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Module</th>
                    {actions.map((action) => (
                      <th key={action} className="px-4 py-3 text-center capitalize">
                        {action}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center">All</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => {
                    const modulePermissions =
                      form.permissions[module.key] || emptyPermissions([module])[module.key];
                    const allChecked = actions.every((action) => modulePermissions[action]);
                    return (
                      <tr key={module.key} className="border-b border-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {module.label}
                        </td>
                        {actions.map((action) => (
                          <td key={action} className="px-4 py-3 text-center">
                            <Checkbox
                              checked={Boolean(modulePermissions[action])}
                              disabled={editingRole?.slug === "admin"}
                              onChange={(event) =>
                                setPermission(module.key, action, event.target.checked)
                              }
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={allChecked}
                            disabled={editingRole?.slug === "admin"}
                            onChange={(event) =>
                              toggleModule(module.key, event.target.checked)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPermissions;
