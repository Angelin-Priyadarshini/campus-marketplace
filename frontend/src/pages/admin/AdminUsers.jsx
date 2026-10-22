import React, { useState, useEffect } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Badge, Button, Input, Pagination, Spinner } from '../../components/ui'

const DEPARTMENTS = ['IT', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'Other']

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', department: '', year_of_study: 1, role: 'student',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    else if (!/[a-zA-Z]/.test(form.password)) e.password = 'Must contain a letter'
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await adminApi.createUser({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        department: form.department || null,
        year_of_study: Number(form.year_of_study),
        role: form.role,
      })
      toast.success(`Account created for ${form.email}`)
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Create Student Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Account will be pre-verified and active. Share the credentials with the student directly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Full Name *" placeholder="e.g. Priya Sundaram"
            value={form.full_name} onChange={(e) => set('full_name', e.target.value)}
            error={errors.full_name} />

          <Input label="Campus Email *" type="email" placeholder="name@ssn.edu.in"
            value={form.email} onChange={(e) => set('email', e.target.value)}
            error={errors.email} />

          <Input label="Password *" type="password" placeholder="Min 8 chars, letter + number"
            value={form.password} onChange={(e) => set('password', e.target.value)}
            error={errors.password} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Select</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
              <select value={form.year_of_study} onChange={(e) => set('year_of_study', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
                {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={loading}>Create Account</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadUsers() }, [page, search])

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
        if (!window.confirm(`Suspend account for ${user.email}?`)) return
        await adminApi.suspendUser(user.id)
        toast.success(`${user.email} suspended`)
      } else {
        await adminApi.unsuspendUser(user.id)
        toast.success(`${user.email} unsuspended`)
      }
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user status')
    }
  }

  return (
    <div className="card p-6 bg-white border border-gray-200 rounded-2xl space-y-4">
      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={loadUsers} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Student User Directory
        </h2>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <input type="text" placeholder="Search name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input-base py-1.5 pl-8 text-xs w-full" />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}
            className="gap-1.5 whitespace-nowrap">
            <UserPlus size={14} />
            New Account
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center"><Spinner size="md" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-2">Student</th>
                <th className="py-2.5 px-2">Department</th>
                <th className="py-2.5 px-2">Role</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-2">
                    <p className="font-semibold text-gray-900">{u.full_name}</p>
                    <p className="text-[11px] text-gray-400">{u.email}</p>
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
                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {u.role !== 'admin' && (
                      <Button variant={u.is_active ? 'danger' : 'secondary'} size="sm"
                        onClick={() => handleToggleSuspend(u)}
                        className="text-[11px] py-1 px-2.5">
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
