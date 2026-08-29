import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Tag,
  Mail,
  User,
  Calendar,
  RefreshCw,
  MessageSquare,
  Star,
  StarOff,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Base URL - adjust based on your environment
const API_BASE_URL = '';

interface ContactSubmission {
  id: string;
  name: string;
  contactNumber: string;
  location: string;
  category: string;
  enquiryType: 'retail' | 'wholesale' | 'manufacturing';
  message?: string;
  status: 'pending' | 'read' | 'responded' | 'archived';
  createdAt: string;
  isStarred: boolean;
  notes?: string;
}

interface Stats {
  total: number;
  pending: number;
  read: number;
  responded: number;
  archived: number;
}

const AdminContact = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEnquiryType, setFilterEnquiryType] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [sortField, setSortField] = useState<keyof ContactSubmission>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    read: 0,
    responded: 0,
    archived: 0
  });

  // Axios instance with default config
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Fetch submissions from API
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterEnquiryType !== 'all') params.enquiry_type = filterEnquiryType;
      params.sort_by = sortField === 'createdAt' ? 'createdAt' : sortField;
      params.sort_order = sortDirection;

      const response = await api.get('/api/submissions', { params });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [searchTerm, filterStatus, filterEnquiryType, sortField, sortDirection]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSubmissions();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: ContactSubmission['status']) => {
    try {
      await api.patch(`/api/submissions/${id}/status?status=${newStatus}`);
      toast.success(`Status updated to ${newStatus}`);
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle toggle star
  const handleToggleStar = async (id: string) => {
    try {
      await api.patch(`/api/submissions/${id}/star`);
      fetchSubmissions();
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Failed to toggle star');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    
    try {
      await api.delete(`/api/submissions/${id}`);
      toast.success('Submission deleted successfully');
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  // Handle bulk action
  const handleBulkAction = async (action: 'delete' | 'archive' | 'mark-read') => {
    if (selectedIds.length === 0) return;
    
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} submissions?`)) return;
    
    try {
      const response = await api.post('/api/submissions/bulk', {
        action,
        ids: selectedIds
      });
      
      toast.success(response.data.message || `Bulk ${action} completed`);
      setSelectedIds([]);
      setIsBulkActionOpen(false);
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  // Handle select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSubmissions.map(sub => sub.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle select one
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'read': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'responded': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'archived': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'read': return <Eye className="w-4 h-4" />;
      case 'responded': return <CheckCircle className="w-4 h-4" />;
      case 'archived': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getEnquiryTypeBadge = (type: string) => {
    const colors = {
      retail: 'bg-amber-50 text-amber-700 border-amber-200',
      wholesale: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      manufacturing: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[type as keyof typeof colors] || colors.retail;
  };

  // Filter and sort submissions
  const filteredSubmissions = submissions
    .filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sub.contactNumber.includes(searchTerm) ||
                           sub.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sub.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
      const matchesEnquiryType = filterEnquiryType === 'all' || sub.enquiryType === filterEnquiryType;
      return matchesSearch && matchesStatus && matchesEnquiryType;
    })
    .sort((a, b) => {
      const aVal = a[sortField]?.toString() || '';
      const bVal = b[sortField]?.toString() || '';
      if (sortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

  // Mobile Card View Component
  const MobileCardView = ({ submission }: { submission: ContactSubmission }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <div className="bg-[#1a1a1a] border border-amber-400/20 rounded-xl p-4 mb-3 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="checkbox"
              checked={selectedIds.includes(submission.id)}
              onChange={() => handleSelectOne(submission.id)}
              className="rounded border-amber-400/30 bg-black text-amber-400 focus:ring-amber-400 mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStar(submission.id)}
                  className="text-gray-600 hover:text-amber-400 transition-colors"
                >
                  {submission.isStarred ? (
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ) : (
                    <StarOff className="w-4 h-4" />
                  )}
                </button>
                <h3 className="text-white font-semibold">{submission.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(submission.status)}`}>
                  {submission.status}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getEnquiryTypeBadge(submission.enquiryType)}`}>
                  {submission.enquiryType}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-400/10 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Contact</label>
                <p className="text-sm text-white flex items-center gap-1">
                  <Phone className="w-3 h-3 text-amber-400/60" />
                  {submission.contactNumber}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Location</label>
                <p className="text-sm text-white flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400/60" />
                  {submission.location}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Category</label>
                <p className="text-sm text-white flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-400/60" />
                  {submission.category}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Date</label>
                <p className="text-sm text-white">{formatDate(submission.createdAt)}</p>
              </div>
            </div>
            
            {submission.message && (
              <div>
                <label className="text-xs text-gray-500">Message</label>
                <p className="text-sm text-gray-300 bg-black p-2 rounded-lg mt-1">{submission.message}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedSubmission(submission);
                  setIsDetailModalOpen(true);
                }}
                className="flex-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 py-1.5 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
              >
                <Eye className="w-4 h-4" /> View
              </button>
              <button
                onClick={() => handleStatusChange(
                  submission.id,
                  submission.status === 'pending' ? 'read' : 
                  submission.status === 'read' ? 'responded' : 'read'
                )}
                className="flex-1 bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 py-1.5 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Update
              </button>
              <button
                onClick={() => handleDelete(submission.id)}
                className="flex-1 bg-red-400/10 hover:bg-red-400/20 text-red-400 py-1.5 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header with Brand - Black & Gold Theme */}
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-amber-400/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-wide">Contact Management</h1>
              <p className="text-gray-400 text-sm mt-1">Manage customer inquiries and submissions</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-gray-400">THANGATAMIL</div>
                <div className="text-xs text-amber-400 font-semibold tracking-wider">CRACKERS</div>
              </div>
              <button 
                onClick={() => { fetchSubmissions(); fetchStats(); }}
                className="bg-amber-400 hover:bg-amber-500 text-black font-semibold px-4 sm:px-6 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-amber-400/20 text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {[
            { label: 'Total', value: stats.total, icon: '📊' },
            { label: 'Pending', value: stats.pending, icon: '⏳' },
            { label: 'Read', value: stats.read, icon: '👁️' },
            { label: 'Responded', value: stats.responded, icon: '✅' },
            { label: 'Archived', value: stats.archived, icon: '📦' },
          ].map((stat, index) => (
            <div key={index} className="bg-[#1a1a1a] rounded-xl p-3 sm:p-4 border border-amber-400/30 shadow-lg shadow-amber-400/5">
              <div className="flex items-center justify-between">
                <div className="text-xl sm:text-2xl font-bold text-amber-400">{stat.value}</div>
                <div className="text-xl sm:text-2xl">{stat.icon}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters and Search - Black & Gold */}
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-amber-400/20">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by name, number, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 bg-black border border-amber-400/30 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-black border border-amber-400/30 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="read">Read</option>
                <option value="responded">Responded</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={filterEnquiryType}
                onChange={(e) => setFilterEnquiryType(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-black border border-amber-400/30 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="all">All Types</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setIsBulkActionOpen(true)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-amber-400 text-black font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/20 text-sm"
                >
                  <Filter className="w-4 h-4" />
                  Bulk ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Modal */}
        {isBulkActionOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-amber-400/20">
              <h3 className="text-xl font-bold mb-4 text-amber-400">Bulk Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleBulkAction('mark-read')}
                  className="w-full text-left px-4 py-2 hover:bg-amber-400/10 rounded-lg transition-all text-gray-300 hover:text-amber-400"
                >
                  Mark as Read
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="w-full text-left px-4 py-2 hover:bg-amber-400/10 rounded-lg transition-all text-gray-300 hover:text-amber-400"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                >
                  Delete All
                </button>
                <button
                  onClick={() => setIsBulkActionOpen(false)}
                  className="w-full text-left px-4 py-2 hover:bg-amber-400/10 rounded-lg transition-all mt-2 border-t border-amber-400/20 pt-2 text-gray-400 hover:text-amber-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden lg:block">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl border border-amber-400/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-amber-400 focus:ring-amber-400"
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-gray-700 text-sm font-semibold cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => {
                        setSortField('name');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-gray-700 text-sm font-semibold">Contact</th>
                    <th className="px-4 py-3 text-left text-gray-700 text-sm font-semibold">Location</th>
                    <th className="px-4 py-3 text-left text-gray-700 text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-gray-700 text-sm font-semibold">Category</th>
                    <th 
                      className="px-4 py-3 text-left text-gray-700 text-sm font-semibold cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => {
                        setSortField('status');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-gray-700 text-sm font-semibold cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => {
                        setSortField('createdAt');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortField === 'createdAt' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-gray-700 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-400/10">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                          <span className="ml-3 text-gray-400">Loading submissions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">No submissions found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-amber-400/5 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(submission.id)}
                            onChange={() => handleSelectOne(submission.id)}
                            className="rounded border-amber-400/30 bg-black text-amber-400 focus:ring-amber-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStar(submission.id)}
                              className="text-gray-600 hover:text-amber-400 transition-colors"
                            >
                              {submission.isStarred ? (
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              ) : (
                                <StarOff className="w-4 h-4" />
                              )}
                            </button>
                            <span className="text-white font-medium">{submission.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Phone className="w-4 h-4 text-amber-400/60" />
                            {submission.contactNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="w-4 h-4 text-amber-400/60" />
                            {submission.location}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getEnquiryTypeBadge(submission.enquiryType)}`}>
                            {submission.enquiryType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-amber-400/60" />
                            {submission.category}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center gap-1 w-fit ${getStatusColor(submission.status)}`}>
                            {getStatusIcon(submission.status)}
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {formatDate(submission.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-1.5 bg-amber-400/10 hover:bg-amber-400/20 rounded-lg transition-colors text-amber-400"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(
                                submission.id,
                                submission.status === 'pending' ? 'read' : 
                                submission.status === 'read' ? 'responded' : 'read'
                              )}
                              className="p-1.5 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg transition-colors text-emerald-400"
                              title="Update Status"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(submission.id)}
                              className="p-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile Card View - Shown only on mobile */}
        <div className="lg:hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <span className="ml-3 text-gray-400">Loading submissions...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No submissions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((submission) => (
                <MobileCardView key={submission.id} submission={submission} />
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {isDetailModalOpen && selectedSubmission && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-amber-400/20">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-400">Contact Details</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-500 hover:text-amber-400 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="font-medium text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-400/60" />
                      {selectedSubmission.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Contact Number</label>
                    <p className="font-medium text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-amber-400/60" />
                      {selectedSubmission.contactNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Location</label>
                    <p className="font-medium text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400/60" />
                      {selectedSubmission.location}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Category</label>
                    <p className="font-medium text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-400/60" />
                      {selectedSubmission.category}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Enquiry Type</label>
                    <p className="font-medium text-white capitalize">{selectedSubmission.enquiryType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border inline-flex items-center gap-1 ${getStatusColor(selectedSubmission.status)}`}>
                      {getStatusIcon(selectedSubmission.status)}
                      {selectedSubmission.status}
                    </span>
                  </div>
                </div>

                {selectedSubmission.message && (
                  <div>
                    <label className="text-sm text-gray-500">Message</label>
                    <p className="bg-black p-3 rounded-lg mt-1 text-gray-300 border border-amber-400/10 text-sm">{selectedSubmission.message}</p>
                  </div>
                )}

                {selectedSubmission.notes && (
                  <div>
                    <label className="text-sm text-gray-500">Notes</label>
                    <p className="bg-black p-3 rounded-lg mt-1 text-gray-300 border border-amber-400/10 text-sm">{selectedSubmission.notes}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500">Submitted On</label>
                  <p className="flex items-center gap-2 text-gray-300 text-sm">
                    <Calendar className="w-4 h-4 text-amber-400/60" />
                    {formatDate(selectedSubmission.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber-400/20">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedSubmission.id, 'responded');
                      setIsDetailModalOpen(false);
                    }}
                    className="flex-1 bg-amber-400 text-black font-semibold py-2 rounded-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-400/20"
                  >
                    Mark as Responded
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedSubmission.id, 'archived');
                      setIsDetailModalOpen(false);
                    }}
                    className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedSubmission.id);
                      setIsDetailModalOpen(false);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContact;