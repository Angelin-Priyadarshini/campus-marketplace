import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Badge, Button, Input, Spinner } from '../../components/ui'

const EMPTY_FORM = { name: '', slug: '', icon: '', sort_order: 0 }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = () => {
    setLoading(true)
    adminApi
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false))
  }

  const handleEdit = (cat) => {
    setEditingId(cat.id)
    setEditForm({ name: cat.name, slug: cat.slug, icon: cat.icon || '', sort_order: cat.sort_order ?? 0 })
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await adminApi.updateCategory(editingId, editForm)
      toast.success('Category updated')
      setEditingId(null)
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This will fail if listings use it.`)) return
    try {
      await adminApi.deleteCategory(cat.id)
      toast.success('Category deleted')
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete category')
    }
  }

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.slug.trim()) {
      toast.error('Name and slug are required')
      return
    }
    setSaving(true)
    try {
      await adminApi.createCategory(addForm)
      toast.success('Category created')
      setShowAdd(false)
      setAddForm(EMPTY_FORM)
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const autoSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div className="card p-6 bg-white border border-gray-200 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Categories</h2>
        <Button size="sm" onClick={() => { setShowAdd(true); setAddForm(EMPTY_FORM) }}>
          <Plus size={14} className="inline mr-1" />New Category
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-700">New Category</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-500 mb-0.5 block">Name *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={addForm.name}
                onChange={(e) => setAddForm(f => ({
                  ...f,
                  name: e.target.value,
                  slug: f.slug || autoSlug(e.target.value)
                }))}
                placeholder="e.g. Textbooks"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-0.5 block">Slug *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={addForm.slug}
                onChange={(e) => setAddForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. textbooks"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-0.5 block">Icon (emoji)</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={addForm.icon}
                onChange={(e) => setAddForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="📚"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-0.5 block">Sort Order</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={addForm.sort_order}
                onChange={(e) => setAddForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} loading={saving}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center"><Spinner size="md" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-2">Icon</th>
                <th className="py-2.5 px-2">Name</th>
                <th className="py-2.5 px-2">Slug</th>
                <th className="py-2.5 px-2">Sort</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) =>
                editingId === cat.id ? (
                  <tr key={cat.id} className="bg-yellow-50">
                    <td className="py-2 px-2">
                      <input
                        className="w-12 border border-gray-200 rounded px-1.5 py-1 text-xs"
                        value={editForm.icon}
                        onChange={(e) => setEditForm(f => ({ ...f, icon: e.target.value }))}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        className="w-32 border border-gray-200 rounded px-1.5 py-1 text-xs"
                        value={editForm.name}
                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        className="w-32 border border-gray-200 rounded px-1.5 py-1 text-xs"
                        value={editForm.slug}
                        onChange={(e) => setEditForm(f => ({ ...f, slug: e.target.value }))}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        className="w-16 border border-gray-200 rounded px-1.5 py-1 text-xs"
                        value={editForm.sort_order}
                        onChange={(e) => setEditForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button onClick={handleSaveEdit} disabled={saving} className="text-green-600 hover:text-green-800 mr-2">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-2 text-lg">{cat.icon || '—'}</td>
                    <td className="py-3 px-2 font-semibold text-gray-900">{cat.name}</td>
                    <td className="py-3 px-2 text-gray-500 font-mono">{cat.slug}</td>
                    <td className="py-3 px-2 text-gray-500">{cat.sort_order}</td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <button onClick={() => handleEdit(cat)} className="text-primary-600 hover:text-primary-800">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              )}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
