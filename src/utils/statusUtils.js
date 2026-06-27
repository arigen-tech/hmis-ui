export const normalizeStatus = (status) => {
  if (status === null || status === undefined) return "";
  return String(status).trim().toLowerCase();
};

export const isStatusActive = (status) => normalizeStatus(status) === "y";
export const getToggleStatus = (status) => (isStatusActive(status) ? "n" : "y");
export const getStatusLabel = (status) => (isStatusActive(status) ? "Active" : "Inactive");
export const getStatusAction = (status) => (normalizeStatus(status) === "y" ? "activate" : "deactivate");
