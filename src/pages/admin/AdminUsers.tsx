import { useEffect, useState, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { fetchUsers, updateUser, deleteUser, setFilters, setPage, clearError } from '../../store/slices/adminUsersSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { RootState } from '../../types/redux/rootState.types'
import type { User } from '../../types/api/auth.types'

interface EditForm {
  first_name: string
  last_name: string
  role: 'user' | 'admin'
  password: string
  confirmPassword: string
}

interface EditErrors {
  first_name?: string
  last_name?: string
  role?: string
  password?: string
  confirmPassword?: string
}

interface SuccessPopup {
  message: string
  passwordChanged?: boolean
}

interface ConfirmDialog {
  type: 'suspend' | 'delete'
  userId: number
  isActive?: boolean
}

interface ActionSuccessPopup {
  message: string
  type: 'suspend' | 'activate' | 'delete'
}

interface ToastMessage {
  message: string
  type: 'error' | 'info' | 'success' | 'warning'
}

function AdminUsers() {
  const dispatch = useAppDispatch()
  
  // Use selector - should always exist after store initialization
  const adminUsersState = useAppSelector((state: RootState) => {
    console.log('Selector - Full RootState keys:', Object.keys(state || {}))
    console.log('Selector - Full RootState:', state)
    const adminState = state?.adminUsers
    console.log('Selector - adminUsersState:', adminState)
    return adminState
  })
  
  // Also get the full state for debugging
  const fullState = useAppSelector((state: RootState) => state)
  useEffect(() => {
    console.log('Full Redux State:', fullState)
    console.log('adminUsers key exists:', 'adminUsers' in (fullState || {}))
  }, [fullState])
  
  // Provide defaults if state is not initialized yet
  const users = adminUsersState?.users || []
  const pagination = adminUsersState?.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
  const filters = adminUsersState?.filters || { search: '', role: '', is_active: '' }
  const loading = adminUsersState?.loading || false
  const error = adminUsersState?.error || null
  
  // Debug log - log the actual state structure
  useEffect(() => {
    console.log('Component - Full adminUsersState:', adminUsersState)
    console.log('Component - users array:', users)
    console.log('Component - users length:', users.length)
    console.log('Component - pagination:', pagination)
    console.log('Component - loading:', loading)
    console.log('Component - error:', error)
    
    // Log if state exists but users array is empty
    if (adminUsersState && adminUsersState.users && adminUsersState.users.length === 0 && !loading) {
      console.warn('WARNING: State exists but users array is empty. Pagination:', adminUsersState.pagination)
    }
  }, [adminUsersState, users, pagination, loading, error])

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    first_name: '',
    last_name: '',
    role: 'user',
    password: '',
    confirmPassword: '',
  })
  const [editErrors, setEditErrors] = useState<EditErrors>({})
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  // Popup/Modal states
  const [successPopup, setSuccessPopup] = useState<SuccessPopup | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null)
  const [successMessage, setSuccessMessage] = useState<ToastMessage | null>(null)
  const [actionSuccessPopup, setActionSuccessPopup] = useState<ActionSuccessPopup | null>(null)

  // Search protection refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const previousSearchValueRef = useRef<string>('')
  const modalOpenTimeRef = useRef<number>(0)
  const isUserTypingRef = useRef<boolean>(false)
  const searchLockedRef = useRef<boolean>(false)

  // Fetch users on mount and when filters or page change
  useEffect(() => {
    const params: {
      page?: number
      limit?: number
      search?: string
      role?: string
      is_active?: string
      sort?: string
      order?: string
    } = {
      page: pagination.page,
      limit: pagination.limit,
    }

    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim()
    }
    if (filters.role) {
      params.role = filters.role
    }
    if (filters.is_active) {
      params.is_active = filters.is_active
    }

    console.log('Fetching users with params:', params)
    dispatch(fetchUsers(params))
      .unwrap()
      .then((result) => {
        console.log('Users fetched successfully:', result)
        console.log('Users count:', result?.users?.length || 0)
        console.log('Users data:', result?.users)
      })
      .catch((err) => {
        console.error('Error fetching users:', err)
      })
  }, [dispatch, pagination.page, pagination.limit, filters.search, filters.role, filters.is_active])

  // Initial fetch on mount - ensure we fetch users when component loads
  useEffect(() => {
    // Fetch users on initial mount
    console.log('Component mounted - checking if initial fetch needed')
    console.log('Current users count:', users.length)
    console.log('Current loading state:', loading)
    
    // If no users and not loading, trigger initial fetch
    if (users.length === 0 && !loading && pagination.total === 0) {
      console.log('Initial fetch triggered - fetching users...')
      dispatch(fetchUsers({
        page: 1,
        limit: 20,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Lock search when modal opens
  useEffect(() => {
    if (editingUser) {
      searchLockedRef.current = true
      modalOpenTimeRef.current = Date.now()
      previousSearchValueRef.current = filters.search
    } else {
      // Unlock after modal closes (with small delay)
      setTimeout(() => {
        searchLockedRef.current = false
      }, 300)
    }
  }, [editingUser, filters.search])

  // Handle filter changes with autocomplete protection
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    // Block search changes when modal is open (autocomplete protection)
    if (key === 'search' && searchLockedRef.current) {
      // Check if change is from browser autocomplete
      const timeSinceModalOpen = Date.now() - modalOpenTimeRef.current
      if (timeSinceModalOpen < 1000 && !isUserTypingRef.current) {
        // Likely autocomplete - ignore and restore previous value
        if (searchInputRef.current) {
          searchInputRef.current.value = previousSearchValueRef.current
        }
        return
      }
    }

    if (key === 'search') {
      isUserTypingRef.current = true
      setTimeout(() => {
        isUserTypingRef.current = false
      }, 1000)
    }

    dispatch(setFilters({ [key]: value }))
  }

  // Clear search
  const handleClearSearch = () => {
    dispatch(setFilters({ search: '' }))
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
  }

  // Handle edit button click
  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      first_name: user.first_name || user.firstName || '',
      last_name: user.last_name || user.lastName || '',
      role: user.role || 'user',
      password: '',
      confirmPassword: '',
    })
    setEditErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  // Validate edit form
  const validateEditForm = (): boolean => {
    const errors: EditErrors = {}

    if (!editForm.first_name.trim()) {
      errors.first_name = 'First name is required'
    }

    if (!editForm.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }

    if (!editForm.role) {
      errors.role = 'Role is required'
    }

    if (editForm.password) {
      if (editForm.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      }

      if (editForm.password !== editForm.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }

    if (editForm.confirmPassword && !editForm.password) {
      errors.confirmPassword = 'Please enter password first'
    }

    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!validateEditForm() || !editingUser) {
      return
    }

    try {
      setSaving(true)

      const updateData: {
        first_name: string
        last_name: string
        role: 'user' | 'admin'
        password?: string
      } = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        role: editForm.role,
      }

      const passwordChanged = editForm.password && editForm.password.trim() !== ''
      if (passwordChanged) {
        updateData.password = editForm.password
      }

      const result = await dispatch(updateUser({ userId: editingUser.id, userData: updateData })).unwrap()

      setSuccessPopup({
        message: passwordChanged
          ? 'User information has been updated successfully. A password reset email has been sent to the user.'
          : 'User information has been updated successfully.',
        passwordChanged,
      })
      setEditingUser(null)
      setEditForm({ first_name: '', last_name: '', role: 'user', password: '', confirmPassword: '' })
      setEditErrors({})

      // Refresh users list
      dispatch(fetchUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        role: filters.role,
        is_active: filters.is_active,
      }))
    } catch (err: any) {
      setSuccessMessage({
        message: err || 'Failed to update user',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle suspend/activate click
  const handleSuspendClick = (userId: number, isActive: boolean | undefined, userRole: string | undefined) => {
    if (userRole === 'admin') {
      setSuccessMessage({
        message: 'Admin users cannot be suspended.',
        type: 'info',
      })
      return
    }
    setConfirmDialog({ type: 'suspend', userId, isActive: isActive || false })
  }

  // Handle delete click
  const handleDeleteClick = (userId: number, userRole: string | undefined) => {
    if (userRole === 'admin') {
      setSuccessMessage({
        message: 'Admin users cannot be deleted.',
        type: 'info',
      })
      return
    }
    setConfirmDialog({ type: 'delete', userId })
  }

  // Handle confirm action
  const handleConfirmAction = async () => {
    if (!confirmDialog) return

    try {
      if (confirmDialog.type === 'suspend') {
        await dispatch(updateUser({
          userId: confirmDialog.userId,
          userData: { is_active: !confirmDialog.isActive },
        })).unwrap()

        setActionSuccessPopup({
          message: confirmDialog.isActive
            ? 'The user has been suspended and cannot access their account.'
            : 'The user has been activated and can now access their account.',
          type: confirmDialog.isActive ? 'suspend' : 'activate',
        })
        dispatch(setFilters({ is_active: '' })) // Clear status filter
      } else if (confirmDialog.type === 'delete') {
        await dispatch(deleteUser(confirmDialog.userId)).unwrap()
        setActionSuccessPopup({
          message: 'The user has been removed from the system.',
          type: 'delete',
        })
      }

      setConfirmDialog(null)

      // Refresh users list
      dispatch(fetchUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        role: filters.role,
        is_active: filters.is_active,
      }))
    } catch (err: any) {
      setSuccessMessage({
        message: err || 'Failed to perform action',
        type: 'error',
      })
      setConfirmDialog(null)
    }
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage))
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all platform users</p>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message Toast */}
        {successMessage && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg ${
              successMessage.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : successMessage.type === 'info'
                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}
          >
            {successMessage.message}
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by email or name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
              {filters.search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Role Filter */}
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-2">Error: {error}</p>
              <button
                onClick={() => {
                  dispatch(fetchUsers({
                    page: pagination.page,
                    limit: pagination.limit,
                    search: filters.search,
                    role: filters.role,
                    is_active: filters.is_active,
                  }))
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No users found</p>
              <p className="text-sm text-gray-400 mt-2">
                {pagination.total > 0 
                  ? `Total: ${pagination.total} | Page: ${pagination.page} of ${pagination.pages}`
                  : 'Try refreshing the page or check your connection'}
              </p>
              {pagination.total === 0 && (
                <button
                  onClick={() => {
                    dispatch(fetchUsers({
                      page: 1,
                      limit: 20,
                      search: filters.search,
                      role: filters.role,
                      is_active: filters.is_active,
                    }))
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">
                            {user.first_name || user.firstName} {user.last_name || user.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active || user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_active || user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at || user.createdAt || '').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleSuspendClick(
                                user.id,
                                user.is_active || user.isActive,
                                user.role
                              )
                            }
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active || user.isActive
                                ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            }`}
                            title={user.is_active || user.isActive ? 'Suspend user' : 'Activate user'}
                          >
                            {user.is_active || user.isActive ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user.id, user.role)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {pagination.page} of {pagination.pages} ({pagination.total} total users)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Email (read-only) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* First Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      editErrors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.first_name && (
                    <p className="mt-1 text-sm text-red-500">{editErrors.first_name}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, last_name: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      editErrors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.last_name && (
                    <p className="mt-1 text-sm text-red-500">{editErrors.last_name}</p>
                  )}
                </div>

                {/* Role */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as 'user' | 'admin' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={(e) =>
                        setEditForm({ ...editForm, password: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                        editErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {editErrors.password && (
                    <p className="mt-1 text-sm text-red-500">{editErrors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to keep current password. Minimum 6 characters.
                  </p>
                </div>

                {/* Confirm Password */}
                {editForm.password && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={editForm.confirmPassword}
                        onChange={(e) =>
                          setEditForm({ ...editForm, confirmPassword: e.target.value })
                        }
                        className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                          editErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {editErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{editErrors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {successPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">{successPopup.message}</p>
                <button
                  onClick={() => setSuccessPopup(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="mb-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      confirmDialog.type === 'delete' ? 'bg-red-100' : 'bg-orange-100'
                    }`}
                  >
                    {confirmDialog.type === 'delete' ? (
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                  {confirmDialog.type === 'delete'
                    ? 'Delete User?'
                    : confirmDialog.isActive
                    ? 'Suspend User?'
                    : 'Activate User?'}
                </h3>
                <p className="text-gray-600 mb-6 text-center">
                  {confirmDialog.type === 'delete'
                    ? 'This action cannot be undone. The user will be permanently removed from the system.'
                    : confirmDialog.isActive
                    ? 'The user will be suspended and will not be able to access their account.'
                    : 'The user will be activated and will be able to access their account.'}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className={`px-4 py-2 text-white rounded-lg ${
                      confirmDialog.type === 'delete'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {confirmDialog.type === 'delete'
                      ? 'Delete'
                      : confirmDialog.isActive
                      ? 'Suspend'
                      : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Success Popup */}
        {actionSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 text-center">
                <div className="mb-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      actionSuccessPopup.type === 'delete'
                        ? 'bg-red-100'
                        : actionSuccessPopup.type === 'suspend'
                        ? 'bg-orange-100'
                        : 'bg-green-100'
                    }`}
                  >
                    {actionSuccessPopup.type === 'delete' ? (
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    ) : actionSuccessPopup.type === 'suspend' ? (
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">{actionSuccessPopup.message}</p>
                <button
                  onClick={() => setActionSuccessPopup(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminUsers
