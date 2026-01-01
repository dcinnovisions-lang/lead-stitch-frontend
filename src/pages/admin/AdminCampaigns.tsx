import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'
import type { Campaign } from '../../types/api/campaign.types'
import type { AxiosError } from 'axios'

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface CampaignFilters {
  search: string
  status: string
}

interface CampaignsResponse {
  campaigns: Campaign[]
  pagination: Pagination
}

function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [filters, setFilters] = useState<CampaignFilters>({ search: '', status: '' })

  useEffect(() => {
    fetchCampaigns()
  }, [pagination.page, filters])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      }
      const response = await api.get<CampaignsResponse>('/admin/campaigns', { params })
      setCampaigns(response.data.campaigns)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error fetching campaigns:', axiosError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage all user campaigns</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No campaigns found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      {campaign.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{campaign.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{(campaign as any).user?.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        {(campaign as any).user?.first_name || (campaign as any).user?.firstName} {(campaign as any).user?.last_name || (campaign as any).user?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.created_at || campaign.createdAt || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminCampaigns

