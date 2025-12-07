import { useState, useEffect } from 'react';
import { Download, Eye, Search, Plus } from 'lucide-react';

export default function UserSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch subscriptions from GET /api/subscriptions
      const subResponse = await fetch('/api/subscriptions');
      const subData = await subResponse.json();
      
      if (subData.success && subData.data) {
        // API returns paginated data in data.data
        setSubscriptions(Array.isArray(subData.data.data) ? subData.data.data : []);
      } else {
        setSubscriptions([]);
      }

      // Fetch orders for billing history from GET /api/user/orders
      const ordersResponse = await fetch('/api/user/orders');
      const ordersData = await ordersResponse.json();
      
      if (ordersData.success && ordersData.data) {
        setBillingHistory(Array.isArray(ordersData.data) ? ordersData.data : []);
      } else {
        setBillingHistory([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      setCancellingId(subscriptionId);
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
        },
        body: JSON.stringify({ reason: 'User requested cancellation' })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data after cancellation
        await fetchData();
      } else {
        setError(data.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'text-green-600',
      'success': 'text-green-600',
      'processing': 'text-yellow-600',
      'pending': 'text-yellow-600',
      'expired': 'text-red-600',
      'failed': 'text-red-600',
      'cancelled': 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusBg = (status) => {
    const bg = {
      'active': 'bg-green-50',
      'success': 'bg-green-50',
      'processing': 'bg-yellow-50',
      'pending': 'bg-yellow-50',
      'expired': 'bg-red-50',
      'failed': 'bg-red-50',
      'cancelled': 'bg-gray-50'
    };
    return bg[status] || 'bg-gray-50';
  };

  const getStatusDot = (status) => {
    const dots = {
      'active': '🟢',
      'success': '🟢',
      'processing': '🟡',
      'pending': '🟡',
      'expired': '🔴',
      'failed': '🔴',
      'cancelled': '⚪'
    };
    return dots[status] || '⚪';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const filteredHistory = billingHistory.filter(item => {
    const matchesSearch = 
      (item.product?.title || item.order_reference || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.order_reference || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
          <p className="text-gray-600 mt-2">Manage your active subscriptions and view billing history</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Active Subscriptions Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Active Subscriptions</h2>
              <p className="text-gray-600 text-sm mt-1">
                You have {subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <a href="/" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
              <Plus className="w-4 h-4" />
              Browse Plans
            </a>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="text-gray-600 mt-4">Loading subscriptions...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 text-lg">No active subscriptions yet</p>
              <a href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">Browse available plans →</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{sub.product?.title || 'Subscription'}</h3>
                      <p className="text-sm text-gray-600 mt-1 capitalize">{sub.tier || 'standard'} Plan</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(sub.status)} ${getStatusBg(sub.status)}`}>
                      {getStatusDot(sub.status)} {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price</span>
                      <span className="font-semibold text-gray-900">${parseFloat(sub.price || 0).toFixed(2)} {sub.currency || 'KES'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Renewal Date</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(sub.next_billing_date)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Started</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(sub.started_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 text-sm border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition font-medium">
                      Change Plan
                    </button>
                    <button
                      onClick={() => handleCancelSubscription(sub.id)}
                      disabled={cancellingId === sub.id}
                      className="flex-1 text-sm border border-red-300 text-red-600 py-2 rounded hover:bg-red-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingId === sub.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Billing History Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing History</h2>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search billing history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Billing Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Plan Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Purchase Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">End Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No billing history found
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{item.product?.title || item.order_reference || 'Order'}</p>
                            <p className="text-xs text-gray-600 mt-1">{item.order_reference}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          ${parseFloat(item.total || item.amount || 0).toFixed(2)} {item.currency || 'KES'}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {item.expires_at ? formatDate(item.expires_at) : 'Ongoing'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {getStatusDot(item.status)} {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              title="Download Invoice"
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              title="View Details"
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition"
                            >
                              <Eye className="w-4 h-4" />
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
      </div>
    </div>
  );
}