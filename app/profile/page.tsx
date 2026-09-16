'use client'

import Avatar from '@/components/common/Avatar'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { RoleBadge } from '@/components/common/StatusBadge'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime } from '@/lib/format'

/**
 * The signed-in admin's own record.
 *
 * Read-only: the fields here (name, email, college) come from the Google
 * account and the public profile flow, so editing them belongs on the main site rather than here.
 */
export default function ProfilePage() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className='flex justify-center py-16 text-muted-foreground'>
        <Spinner />
      </div>
    )
  }

  if (!user) return null

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Phone', value: user.phone || '—' },
    { label: 'College', value: user.college || '—' },
    { label: 'District', value: user.district || '—' },
    { label: 'Referral code', value: user.referralCode },
    { label: 'Joined', value: formatDateTime(user.createdAt) },
  ]

  return (
    <>
      <PageHeader
        title='Profile'
        description='The account you are signed in with.'
      />

      <div className='max-w-2xl space-y-3'>
        <div className='flex items-center gap-3 rounded-lg border border-border bg-card p-4'>
          <Avatar
            name={user.name}
            seed={user.email}
            className='h-12 w-12 text-sm'
          />
          <div className='min-w-0'>
            {/* Wraps rather than truncates: this is the one screen where the
                whole name should be readable however long it is. */}
            <p className='text-sm font-semibold break-words text-foreground'>
              {user.name}
            </p>
            <p className='text-xs break-all text-muted-foreground'>
              {user.email}
            </p>
          </div>
          <div className='ml-auto shrink-0 self-start'>
            <RoleBadge role={user.role} />
          </div>
        </div>

        <dl className='divide-y divide-border overflow-hidden rounded-lg border border-border bg-card'>
          {rows.map((row) => (
            <div
              key={row.label}
              className='flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:gap-4'
            >
              <dt className='shrink-0 text-xs text-muted-foreground sm:w-36'>
                {row.label}
              </dt>
              <dd className='min-w-0 text-sm break-words text-foreground'>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className='flex justify-end'>
          <Button size='sm' onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </>
  )
}
