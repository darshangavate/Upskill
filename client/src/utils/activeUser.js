export const DEFAULT_USER_ID = "u-emp-02";

export function getActiveUserId() {
  return localStorage.getItem("activeUserId") || DEFAULT_USER_ID;
}

export function setActiveUserId(userId) {
  localStorage.setItem("activeUserId", userId);
  // force refresh so all pages refetch with new user
  window.location.reload();
}
