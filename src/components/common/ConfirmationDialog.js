import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { cn } from "../../lib/utils/utils";

const DEFAULT_DESCRIPTION =
  "This action cannot be undone. The selected record will be permanently deleted.";

export function ConfirmationDialog({
  open,
  onOpenChange,
  trigger,
  title = "Confirm deletion",
  description = DEFAULT_DESCRIPTION,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  confirmClassName,
  isLoading = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent className="w-[92%] rounded-lg border border-red-100 bg-white p-0 shadow-2xl sm:max-w-md">
        <AlertDialogHeader className="space-y-4 px-6 pt-6 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-3 border-t border-slate-100 px-6 py-5 sm:space-x-0">
          <AlertDialogCancel className="!mt-0 rounded-lg border-slate-200 px-4 font-semibold">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              "rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700 focus:ring-red-300",
              confirmClassName,
            )}
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteConfirmationButton({
  children,
  title = "Confirm deletion",
  description = DEFAULT_DESCRIPTION,
  confirmLabel = "Delete",
  onConfirm,
  isLoading = false,
}) {
  return (
    <ConfirmationDialog
      trigger={children}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
