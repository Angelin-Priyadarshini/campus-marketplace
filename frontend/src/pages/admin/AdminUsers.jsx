import React, { useState, useEffect } from 'react'
import { Search, UserCheck, UserX, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Badge, Button, Input, Pagination, Spinner } from '../../components/ui'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [page, search])

  const loadUsers = () => {
    setLoading(true)
    adminApi
      .getUsers({ q: search.trim() || undefined, page, page_size: 15 })
      .then((res) => {
        setUsers(res.data.items || [])
        setTotalPages(res.data.total_pages || 1)
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }

  const handleToggleSuspend = async (user) => {
    try {
      if (user.is_active) {
        if (!window.confirm(`Suspend account for ${user.email}? They will not be able to log in.`)) return
        await adminApi.suspendUser(user.id)
        toast.success(`User ${user.email} suspended`)
      } else {
        await adminApi.unsuspendUser(user.id)
        toast.success(`User ${user.email} unsuspended`)
      }
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user status')
    }
  }

  return (
    <div className="card p-6 bg-white border border-gray-200 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Student User Directory
        </h2>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="input-base py-1.5 pl-8 text-xs"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-2">Student</th>
                <th className="py-2.5 px-2">Department</th>
                <th className="py-2.5 px-2">Role</th>
                <th className="py-2.5 px-2">Verified</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-semibold text-gray-900">{u.full_name}</p>
                      <p className="text-[11px] text-gray-400">{u.email}</p>
                    </div>
                  </td>

                  <td className="py-3 px-2 text-gray-600">
                    {u.department || 'N/A'} {u.year_of_study ? `(Yr ${u.year_of_study})` : ''}
                  </td>

                  <td className="py-3 px-2">
                    <Badge variant={u.role === 'admin' ? 'danger' : 'default'}>
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>

                  <td className="py-3 px-2">
                    <Badge variant={u.is_verified ? 'success' : 'warning'}>
                      {u.is_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>

                  <td className="py-3 px-2">
                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>

                  <td className="py-3 px-2 text-right">
                    {u.role !== 'admin' && (
                      <Button
                        variant={u.is_active ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleSuspend(u)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        {u.is_active ? 'Suspend' : 'Unsuspend'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
