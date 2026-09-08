export const DASHBOARD_REFRESH_EVENT = "dashboard-refresh";

export function refreshDashboard() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DASHBOARD_REFRESH_EVENT));
  }
}