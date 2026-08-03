import { useEffect, useState, useCallback } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { formatDate, currency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import Pagination from '@/components/Pagination';
import { Spinner } from '@/components/Spinner';

function DonationList() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    donationLabel: '',
  });

  // Fetch unique donation labels for filter dropdown
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await api.get('/donations/labels');
        if (response.data?.data) {
          setLabels(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch donation labels:', error);
      }
    };
    fetchLabels();
  }, []);

  // Fetch donation statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/donations/stats');
        if (response.data?.data) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch donation stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Fetch donations list
  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      if (filters.search) params.append('search', filters.search);
      if (filters.donationLabel) params.append('donationLabel', filters.donationLabel);

      const response = await api.get(`/donations?${params.toString()}`);
      if (response.data?.data) {
        setDonations(response.data.data || []);
        setPagination(response.data.meta || null);
      }
    } catch (error) {
      console.error('Failed to fetch donations:', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleLabelFilter = (value) => {
    setFilters((prev) => ({ ...prev, donationLabel: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.donationLabel) params.append('donationLabel', filters.donationLabel);

      // Fetch Excel file using the authenticated api client
      const response = await api.get(`/donations/export/json?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create blob and trigger download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `donations_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export donations:', getErrorMessage(error));
    }
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      donationLabel: '',
    });
  };

  const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalItems = pagination?.total ?? donations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Donations</h1>
        <p className="mt-1 text-sm text-gray-600">Manage and track all donations by devotees</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Donations</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalDonations}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="mt-2 text-2xl font-bold text-green-600">{currency(stats.totalAmount)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Unique Donors</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.uniqueDonors}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Sevas</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {Object.keys(stats.byLabel).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Search by name */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by devotee name..."
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter by donation label/seva */}
              <Select
                value={filters.donationLabel}
                onChange={(e) => handleLabelFilter(e.target.value)}
                className="sm:w-48"
              >
                <option value="">All Sevas</option>
                {labels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </Select>

              {/* Export button */}
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={loading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Clear filters button */}
            {(filters.search || filters.donationLabel) && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {donations.length > 0
              ? `Donations (${totalItems} total)`
              : 'No donations found'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : donations.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Devotee Name</TableHead>
                      <TableHead>Mobile Number</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Seva (Label)</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Donated At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation, index) => (
                      <TableRow key={`${donation.donationId}-${index}`}>
                        <TableCell className="font-medium">{donation.devoteeName}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {donation.mobileNumber}
                        </TableCell>
                        <TableCell className="text-sm">{donation.devoteeCategory}</TableCell>
                        <TableCell>
                          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                            {donation.sevaId}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {currency(donation.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(donation.donatedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary row */}
              {donations.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Page Total:</p>
                      <p className="text-lg font-bold text-green-600">{currency(totalAmount)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600">No donations found. Try adjusting your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && donations.length > 0 && (
        <Pagination meta={pagination} onPageChange={handlePageChange} />
      )}
    </div>
  );
}

export default DonationList;
