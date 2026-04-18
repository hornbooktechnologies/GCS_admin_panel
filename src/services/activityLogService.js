import { requestHandler } from "../lib/utils/network-client";

export const getActivityLogs = async (params) => {
  return await requestHandler("/activity-logs", {
    method: "GET",
    params: params,
  });
};

export const deleteActivityLog = async (id) => {
  return await requestHandler(`/activity-logs/${id}`, {
    method: "DELETE",
  });
};

export const deleteMultipleActivityLogs = async (ids) => {
  return await requestHandler("/activity-logs", {
    method: "DELETE",
    body: { ids },
  });
};
