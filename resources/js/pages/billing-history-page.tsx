import { useState, useEffect } from 'react';
import { Download, Eye, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BillingRecord {
    id: number;
    subscription_id: number;
    product_title: string;
    plan_name: string;
    tier: string;
    amount: number;
    currency: string;
    billing_date: string;
    due_date: string;
    status: 'active' | 'pending' | 'failed' | 'processing';
    subscription_reference: string;
    invoice_number: string;
}

interface PaginatedResponse {
    data: BillingRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function BillingHistoryPage() {
    const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    useEffect(() => {
        fetchBillingHistory();
    }, [currentPage, statusFilter, sortBy]);

    const fetchBillingHistory = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                per_page: '15',
                status: statusFilter !== 'all' ? statusFilter : '',
                sort: sortBy
            });

            const response = await fetch(`/api/billing/history?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch billing history');
            }

            const data: PaginatedResponse = await response.json();
            setBillingRecords(data.data);
            setTotalPages(data.last_page);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setBillingRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async (billingId: number, invoiceNumber: string) => {
        try {
            setDownloadingId(billingId);
            const response = await fetch(`/api/billing/invoice/${billingId}/download`, {
                headers: {
                    'Accept': 'application/pdf',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download invoice');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download invoice');
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case 'paid':
                return '●';
            case 'pending':
                return '●';
            case 'processing':
                return '●';
            case 'failed':
                return '●';
            default:
                return '●';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        const symbols: { [key: string]: string } = {
            'KES': 'KSh',
            'USD': '$',
            'EUR': '€'
        };
        return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-gray-900">Billing History</h1>
                    <p className="text-gray-600 mt-2">View and manage your subscriptions and invoices</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Filter by:</span>
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="failed">Failed</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="date">Latest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="amount_high">Amount: High to Low</option>
                        <option value="amount_low">Amount: Low to High</option>
                    </select>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-gray-600 mt-4">Loading billing history...</p>
                        </div>
                    </div>
                ) : billingRecords.length === 0 ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-12 text-center">
                            <div className="text-gray-400 text-5xl mb-4">📋</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No billing records found</h3>
                            <p className="text-gray-600">You haven't made any purchases yet. Subscribe to a plan to see billing history here.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Billing Table */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                Plan Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                Billing Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                Due Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {billingRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{record.plan_name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{record.product_title}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(record.amount, record.currency)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm text-gray-700">{formatDate(record.billing_date)}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm text-gray-700">{formatDate(record.due_date)}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-lg ${
                                                            record.status === 'active' ? 'text-green-500' :
                                                            record.status === 'pending' ? 'text-yellow-500' :
                                                            record.status === 'processing' ? 'text-blue-500' :
                                                            'text-red-500'
                                                        }`}>
                                                            {getStatusDot(record.status)}
                                                        </span>
                                                        <Badge className={`text-xs font-medium capitalize ${getStatusColor(record.status)}`}>
                                                            {record.status}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                            title="View invoice details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDownloadInvoice(record.id, record.invoice_number)}
                                                            disabled={downloadingId === record.id}
                                                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                            title="Download invoice as PDF"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="text-sm"
                                >
                                    Previous
                                </Button>
                                
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className="w-10 h-10 text-sm"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    {totalPages > 5 && <span className="text-gray-500">...</span>}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="text-sm"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}