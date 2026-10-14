import React, { useState, useRef } from 'react'
import { User as UserIcon, Camera, Star, CheckCircle2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi } from '../api/users'
import { useAuth } from '../context/AuthContext'
import { Avatar, Button, Input, Select } from '../components/ui'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [yearOfStudy, setYearOfStudy] = useState(user?.year_of_study || 2)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed.')
      return
    }

    setUploadingAvatar(true)
    try {
      const res = await usersApi.uploadAvatar(file)
      updateUser({ avatar_url: res.data.avatar_url })
      toast.success('Avatar updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    setLoading(true)
    try {
      const res = await usersApi.updateMe({
        full_name: fullName.trim(),
        department: department.trim() || null,
        year_of_study: Number(yearOfStudy),
      })
      updateUser(res.data)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Profile Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Update your campus personal information and check your reputation score.
        </p>
      </div>

      <div className="card p-6 sm:p-8 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
          <div className="relative">
            <Avatar src={user?.avatar_url} name={user?.full_name} size="xl" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white hover:bg-primary-700 shadow-md transition-colors"
              title="Upload new avatar"
            >
              <Camera size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>

            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                Buyer Rating: {Number(user?.buyer_rating_avg || 0).toFixed(1)} ({user?.buyer_rating_cnt || 0})
              </span>
              <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200/60">
                <Shield size={13} />
                Verified Student
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Department"
              placeholder="e.g. Information Technology"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <Select
              label="Year of Study"
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
              <option value={5}>5th Year (PG)</option>
            </Select>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" loading={loading}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
