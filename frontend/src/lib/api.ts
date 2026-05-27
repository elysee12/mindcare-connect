import Constants from 'expo-constants';

// Backend URL — reads from app.json extra config, falls back to live Render URL
const BACKEND_URL = (Constants.expoConfig?.extra?.BACKEND_URL || 'https://mindcare-connect.onrender.com') + '/api';

let authUserId: string | null = null;

export function setAuthUserId(id: string | null) {
  authUserId = id;
}

async function request(path: string, options: RequestInit = {}) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}) as Record<string, string>,
    };

    if (authUserId) {
      headers['x-user-id'] = authUserId;
    }

    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers,
      ...options,
    });
    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `API error ${res.status}`;
      
      try {
        const jsonError = JSON.parse(text);
        // Extract message from various error response formats
        errorMessage = jsonError.message || jsonError.error || text;
      } catch (e) {
        // If not JSON, use the text as-is
        errorMessage = text || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    return res.json();
  } catch (error: any) {
    if (error.message.toLowerCase().includes('network')) {
      throw new Error(`Cannot reach backend at ${BACKEND_URL}. Check if backend is running and IP is correct.`);
    }
    throw error;
  }
}

export const api = {
  setAuthUserId,
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  requestOtp: (email: string) => request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email: string, otp: string) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  resetPassword: (email: string, otp: string, newPassword: string) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  dashboard: (role: string, userId?: string) => request(`/dashboard?role=${encodeURIComponent(role)}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`),
  users: (search?: string, role?: string) => request(`/users${search || role ? `?${search ? `search=${encodeURIComponent(search)}` : ''}${search && role ? '&' : ''}${role ? `role=${encodeURIComponent(role)}` : ''}` : ''}`),
  createUser: (payload: any) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id: string, payload: any) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  userById: (id: string) => request(`/users/${id}`),
  patients: (search?: string, role?: string, mhpId?: string, assignedChwId?: string, assignedFamilyId?: string) => {
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (role) params.push(`role=${encodeURIComponent(role)}`);
    if (mhpId) params.push(`mhpId=${encodeURIComponent(mhpId)}`);
    if (assignedChwId) params.push(`assignedChwId=${encodeURIComponent(assignedChwId)}`);
    if (assignedFamilyId) params.push(`assignedFamilyId=${encodeURIComponent(assignedFamilyId)}`);
    return request(`/patients${params.length ? `?${params.join('&')}` : ''}`);
  },
  patientById: (id: string) => request(`/patients/${id}`),
  createPatient: (payload: any) => request('/patients', { method: 'POST', body: JSON.stringify(payload) }),
  updatePatient: (id: string, payload: any) => request(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePatient: (id: string) => request(`/patients/${id}`, { method: 'DELETE' }),
  followups: (patientId: string) => request(`/patients/${patientId}/followups`),
  createFollowup: (patientId: string, payload: any) => request(`/patients/${patientId}/followups`, { method: 'POST', body: JSON.stringify(payload) }),
  notifications: (userId?: string) => request(`/notifications${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  notificationById: (id: number) => request(`/notifications/${id}`),
  updateNotification: (id: number, data: any) => request(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteNotification: (id: number) => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearAllNotifications: (userId: number) => request(`/notifications/user/${userId}/clear-all`, { method: 'DELETE' }),
  reminders: (patientId?: string) => request(`/reminders${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ''}`),
  createReminder: (payload: any) => request('/reminders', { method: 'POST', body: JSON.stringify(payload) }),
  updateReminder: (id: number, payload: any) => request(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteReminder: (id: number) => request(`/reminders/${id}`, { method: 'DELETE' }),
  treatmentChanges: () => request('/treatment-changes'),
  createTreatmentChange: (payload: any) => request('/treatment-changes', { method: 'POST', body: JSON.stringify(payload) }),
  updateTreatmentChange: (id: number, payload: any) => request(`/treatment-changes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTreatmentChange: (id: number) => request(`/treatment-changes/${id}`, { method: 'DELETE' }),
  systemLogs: () => request('/system-logs'),
  clearLogs: () => request('/system-logs', { method: 'DELETE' }),
  trackedPatients: () => request('/patients/tracked'),
  trackPatient: (id: number) => request(`/patients/${id}/track`, { method: 'PATCH' }),
  markPatientAsFound: (id: number, locationFound: string, details?: string) => 
    request(`/patients/${id}/found`, { method: 'PATCH', body: JSON.stringify({ locationFound, details }) }),
  submitReport: (payload: any) => request('/reports', { method: 'POST', body: JSON.stringify(payload) }),
  updateReport: (id: number, payload: any) => request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteReport: (id: number) => request(`/reports/${id}`, { method: 'DELETE' }),
  reports: (params?: { search?: string; startDate?: string; endDate?: string; chwId?: string; mhpId?: string; timeframe?: string }) => {
    let query = '';
    const parts = [];
    if (params) {
      if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.startDate) parts.push(`startDate=${params.startDate}`);
      if (params.endDate) parts.push(`endDate=${params.endDate}`);
      if (params.chwId) parts.push(`chwId=${params.chwId}`);
      if (params.mhpId) parts.push(`mhpId=${params.mhpId}`);
      if (params.timeframe) parts.push(`timeframe=${params.timeframe}`);
    }
    if (parts.length > 0) query = `?${parts.join('&')}`;
    return request(`/reports${query}`);
  },
  globalFollowups: (params?: { search?: string; startDate?: string; endDate?: string }) => {
    let query = '';
    if (params) {
      const parts = [];
      if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.startDate) parts.push(`startDate=${params.startDate}`);
      if (params.endDate) parts.push(`endDate=${params.endDate}`);
      if (parts.length > 0) query = `?${parts.join('&')}`;
    }
    return request(`/followups${query}`);
  },
};

// Expo Router requires route files under `app/` to export a default component.
// This file is a helper API module, so we provide a harmless fallback component.
export default function ApiRoute() {
  return null;
}

