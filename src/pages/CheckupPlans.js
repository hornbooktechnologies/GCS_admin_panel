import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Eye,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { hasPermission } from "../lib/utils/permissions";
import { useAuthStore } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import apiClient from "../lib/utils/network-client";
import { DeleteConfirmationButton } from "../components/common/ConfirmationDialog";

const TEST_PREVIEW_COUNT = 6;

const CheckupPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showErrorToast, showSuccessToast } = useToast();
  const canCreate = hasPermission(user, "checkup-plans", "create");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/checkup-plans");
      setItems(response.data?.data?.checkupPlans || []);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to load checkup plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (!selectedPlan) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedPlan(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedPlan]);

  const handleDelete = async (item) => {
    try {
      await apiClient.delete(`/checkup-plans/${item.id}`);
      showSuccessToast("Checkup plan deleted successfully");
      fetchItems();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Unable to delete checkup plan");
    }
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Checkup Plans</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage plan name, image, price, and included tests.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="rounded-lg" onClick={fetchItems}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate && (

            <Button type="button" className="rounded-lg" onClick={() => navigate("/checkup-plans/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Checkup Plan
          </Button>

          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">Loading checkup plans...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No checkup plans found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {items.map((item) => {
              const tests = item.test_names || [];
              const remainingTests = Math.max(
                tests.length - TEST_PREVIEW_COUNT,
                0,
              );

              return (
              <div key={item.id} className="h-full overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
                <div className="grid h-full gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100 md:aspect-auto md:min-h-[280px]">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-56 items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-lg font-bold text-slate-800">{item.name}</h2>
                        <p className="mt-1 text-sm font-semibold text-primary">Rs. {item.price}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tests Included</p>
                      <div className="flex flex-wrap gap-2">
                        {tests.slice(0, TEST_PREVIEW_COUNT).map((testName, index) => (
                          <span key={`${item.id}-${index}-${testName}`} className="max-w-full break-words rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {testName}
                          </span>
                        ))}
                      </div>

                      {remainingTests > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(item)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-blue-100"
                        >
                          <Eye className="h-4 w-4" />
                          +{remainingTests} more — View all tests
                        </button>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate(`/checkup-plans/${item.id}/edit`)}>
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
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlan && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/70 p-3 backdrop-blur-sm md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-checkup-tests-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close test list"
            onClick={() => setSelectedPlan(null)}
          />

          <div className="relative z-10 flex h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl md:h-[calc(100dvh-3rem)]">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Tests Included
                </p>
                <h2
                  id="admin-checkup-tests-title"
                  className="mt-1 line-clamp-2 text-xl font-bold text-slate-900"
                >
                  {selectedPlan.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-emerald-600">
                  Rs. {selectedPlan.price}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                aria-label="Close test list"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-4 md:p-6">
              <div className="h-full overflow-auto overscroll-contain rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-slate-100 shadow-[0_1px_0_0_rgb(226_232_240)]">
                    <tr>
                      <th className="border-r border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                        Test
                      </th>
                      <th className="w-24 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                        Included
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPlan.test_names || []).map((testName, index) => (
                      <tr
                        key={`${selectedPlan.id}-${index}-${testName}`}
                        className="odd:bg-white even:bg-slate-50"
                      >
                        <td className="break-words border-r border-t border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                          {testName}
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-center">
                          <Check className="mx-auto h-5 w-5 text-emerald-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 md:px-6">
              {(selectedPlan.test_names || []).length} tests included
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckupPlans;
