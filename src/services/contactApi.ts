// services/contactApi.ts
import axios from 'axios';

const API_BASE_URL =  '';

export interface ContactSubmission {
  id: string;
  name: string;
  contactNumber: string;
  location?: string;
  category?: string;
  enquiryType: 'retail' | 'wholesale' | 'manufacturing';
  message?: string;
  status: 'pending' | 'read' | 'responded' | 'archived';
  createdAt: string;
  isStarred: boolean;
  notes?: string;
}

export interface CreateSubmissionData {
  name: string;
  contactNumber: string;
  location?: string;
  category?: string;
  enquiryType: 'retail' | 'wholesale' | 'manufacturing';
  message?: string;
}

export interface StatsResponse {
  total: number;
  pending: number;
  read: number;
  responded: number;
  archived: number;
}

export interface BulkActionRequest {
  action: 'delete' | 'archive' | 'mark-read';
  ids: string[];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const contactApi = {
  // Get all submissions with filters
  getSubmissions: async (params?: {
    search?: string;
    status?: string;
    enquiry_type?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get<ContactSubmission[]>('/api/submissions', { params });
    return response.data;
  },

  // Get single submission
  getSubmission: async (id: string) => {
    const response = await api.get<ContactSubmission>(`/api/submissions/${id}`);
    return response.data;
  },

  // Create new submission
  createSubmission: async (data: CreateSubmissionData) => {
    const response = await api.post<ContactSubmission>('/api/submissions', data);
    return response.data;
  },

  // Update submission
  updateSubmission: async (id: string, data: Partial<CreateSubmissionData>) => {
    const response = await api.put<ContactSubmission>(`/api/submissions/${id}`, data);
    return response.data;
  },

  // Update status
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/api/submissions/${id}/status?status=${status}`);
    return response.data;
  },

  // Toggle star
  toggleStar: async (id: string) => {
    const response = await api.patch(`/api/submissions/${id}/star`);
    return response.data;
  },

  // Delete submission
  deleteSubmission: async (id: string) => {
    const response = await api.delete(`/api/submissions/${id}`);
    return response.data;
  },

  // Bulk action
  bulkAction: async (data: BulkActionRequest) => {
    const response = await api.post('/api/submissions/bulk', data);
    return response.data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get<StatsResponse>('/api/stats');
    return response.data;
  },
};

export default contactApi;