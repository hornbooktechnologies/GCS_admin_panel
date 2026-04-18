import React, { useCallback, useEffect, useState } from "react";
import { RefreshCcw, Download, UserPlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import UserTable from "./UserTableBody";
import { exportCSV } from "../../lib/utils/exportCSV";
import { useNavigate } from "react-router-dom";
import { requestHandler } from "../../lib/utils/network-client";
import CreateOrEditUserForm from "./CreateOrEditUserForm";
import useToast from "../../hooks/useToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import ViewUserDialog from "./ViewUserDialog";

const UsersList = () => {
  const [usersList, setUsersList] = useState({
    users: [],
    pagination: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
  });
  const [sortedUsers, setSortedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateEditUserDialogOpen, setIsCreateEditUserDialogOpen] =
    useState(false);
  const [formMode, setFormMode] = useState("create");
  const [userToEdit, setUserToEdit] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // View User State
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [userToView, setUserToView] = useState(null);

  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const fetchUsers = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    try {
      const response = await requestHandler("/users/all", {
        method: "GET",
        params: { page, limit },
      });

      if (response.success) {
        const responseData = response.data || {};
        // Handle new structure: response.data.data has users, response.data.pagination has meta
        const users = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];
        const paginationMeta = responseData.pagination || {
          total: users.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(users.length / limit),
        };

        setUsersList({
          users: users,
          pagination: {
            current_page: paginationMeta.page,
            per_page: paginationMeta.limit,
            total: paginationMeta.total,
            last_page: paginationMeta.totalPages,
          },
        });
        setSortedUsers(users);
        setPagination({
          current_page: paginationMeta.page,
          per_page: paginationMeta.limit,
          total: paginationMeta.total,
          last_page: paginationMeta.totalPages,
        });
      } else {
        console.error("Failed to fetch users:", response.message);
      }
    } catch (error) {
      console.error("Error in fetchUsers:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, 10);
  }, [fetchUsers]);

  const handlePageChange = (page) => {
    fetchUsers(page, pagination.per_page);
  };

  const handlePerPageChange = (newPerPage) => {
    fetchUsers(1, newPerPage);
  };

  const provideUserForEdit = async (id) => {
    if (!id) return;
    setFormMode("edit");
    setUserToEdit(null); // Clear previous data to indicate loading/reset

    try {
      // Optional: You could set a specific loading state here if needed
      const response = await requestHandler(`/users/${id}`, {
        method: "GET",
      });

      if (response.success) {
        setUserToEdit(response.data);
      } else {
        showErrorToast(response.message || "Failed to fetch user details");
        // Close the dialog if fetch fails, to prevent editing invalid state
        setIsCreateEditUserDialogOpen(false);
      }
    } catch (error) {
      console.error("Error fetching user for edit:", error);
      showErrorToast("Error loading user details");
      setIsCreateEditUserDialogOpen(false);
    }
  };

  const handleViewUser = async (id) => {
    if (!id) return;
    try {
      const response = await requestHandler(`/users/${id}`, {
        method: "GET",
      });
      if (response.success) {
        setUserToView(response.data);
        setIsViewUserDialogOpen(true);
      } else {
        showErrorToast(response.message || "Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      showErrorToast("Something went wrong while fetching details");
    }
  };

  const confirmDelete = (id) => {
    setUserToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await requestHandler(`/users/${userToDelete}`, {
        method: "DELETE",
      });
      if (response.success) {
        showSuccessToast(response.message || "User deleted successfully");
        fetchUsers(pagination.current_page, pagination.per_page);
      } else {
        showErrorToast(response.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showErrorToast("Something went wrong while deleting user");
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleExportCSV = () => {
    const exportData = (sortedUsers || usersList?.users)?.map((user) => ({
      FirstName: user.first_name,
      LastName: user.last_name,
      Email: user.email,
      Role: user.role,
      Status: user.status,
      PhoneNumber: user.phone_number || "N/A",
    }));
    exportCSV("users.csv", exportData || []);
    showSuccessToast("Users exported successfully");
  };

  return (
    <>
      {/* Page Header - Outside Card */}
      <div className="flex flex-row items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary-hover to-primary bg-clip-text text-transparent pb-2">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Manage users and their permissions
          </p>
        </div>
        <Button
          onClick={() => {
            setFormMode("create");
            setUserToEdit(undefined);
            setIsCreateEditUserDialogOpen((prev) => !prev);
          }}
          className="h-10 px-4 sm:px-6 bg-primary hover:bg-primary-hover
                    text-white font-semibold gap-2
                    shadow-lg shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40
                    hover:-translate-y-0.5 transition-all duration-200
                    active:scale-95"
        >
          <UserPlus size={18} />
          <span className="hidden sm:inline">Add User</span>
        </Button>
      </div>

      {/* Table Card with Glass Effect */}
      <Card
        className="border border-white/60 shadow-2xl overflow-hidden backdrop-blur-xl bg-white/60 ring-1 ring-black/5"
        style={{
          boxShadow:
            "0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        {/* Card Header with Refresh and Export buttons */}
        <div className="flex items-center justify-end gap-2 p-4 pb-0 sm:p-6 sm:pb-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchUsers(pagination.current_page, pagination.per_page);
                    setRefreshTrigger((prev) => prev + 1);
                  }}
                  className="h-10 w-10 p-0 border-2 border-gray-200 bg-white hover:bg-blue-50 
                            text-gray-700 hover:text-[#5283c5] hover:border-[#5283c5]
                            transition-all duration-200 shadow-sm hover:shadow-md group flex items-center justify-center"
                >
                  <RefreshCcw size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh user data</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="h-10 w-10 p-0 border-2 border-gray-200 bg-white hover:bg-blue-50 
                            text-gray-700 hover:text-[#5283c5] hover:border-[#5283c5]
                            transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                >
                  <Download size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <CardContent className="p-2 sm:p-6 overflow-x-auto">
          <UserTable
            users={sortedUsers || usersList?.users}
            setFormMode={setFormMode}
            setIsCreateEditUserDialogOpen={setIsCreateEditUserDialogOpen}
            getUserForEdit={provideUserForEdit}
            handleViewUser={handleViewUser}
            handleDeleteUser={confirmDelete}
            handlePageChange={handlePageChange}
            handlePerPageChange={handlePerPageChange}
            onRowClick={(row) => console.log("Row clicked", row)}
            pagination={pagination}
            loading={isLoading}
            resetSortTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>

      <CreateOrEditUserForm
        setIsOpen={setIsCreateEditUserDialogOpen}
        isOpen={isCreateEditUserDialogOpen}
        type={formMode}
        editableUser={userToEdit}
        fetchUsers={(page, limit) => {
          // If we are editing, stay on the current page. 
          // If we are creating, go to page 1 to see the new user.
          if (formMode === 'edit') {
            fetchUsers(page || pagination.current_page, limit || pagination.per_page);
          } else {
            fetchUsers(1, limit || pagination.per_page);
          }
        }}
      />

      <ViewUserDialog
        isOpen={isViewUserDialogOpen}
        setIsOpen={setIsViewUserDialogOpen}
        user={userToView}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="w-[90%] sm:max-w-lg rounded-xl">
          <AlertDialogHeader className="!text-left mb-4">
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!flex-row !justify-end gap-3">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} className="!mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersList;

