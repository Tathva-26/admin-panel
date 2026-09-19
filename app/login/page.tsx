'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { signIn } from '@/lib/auth-client'

function LoginContent() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState(false)

  const handleLogin = async () => {
    if (starting) return
    setStarting(true)
    setStartError(false)
    try {
      // better-auth resolves with { error } on HTTP failures instead of throwing.
      // On success the client navigates to Google, so `starting` stays true.
      const { error } = await signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/auth/callback`,
        errorCallbackURL: `${window.location.origin}/login?error=auth_failed`,
      })
      if (error) throw new Error(error.message || error.statusText)
    } catch (error) {
      console.error('Failed to start Google sign-in:', error)
      setStartError(true)
      setStarting(false)
    }
  }

  return (
    <div className='flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12'>
      <div className='w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>
            Tathva &apos;26 Admin Panel
          </h1>
          <p className='mt-2 text-sm text-foreground'>
            Sign in with your Google account to access the admin panel
          </p>
        </div>

        {errorParam || startError ? (
          <div
            role='alert'
            className='mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700'
          >
            {startError
              ? 'Could not reach the sign-in service. Please try again.'
              : errorParam === 'session_expired'
                ? 'Your session has expired. Please sign in again.'
                : errorParam === 'unauthorized'
                  ? 'You do not have permission to access the admin panel.'
                  : errorParam === 'logout_failed'
                    ? 'Sign-out failed, so you may still be signed in. Try again.'
                    : 'Authentication error occurred. Please try again.'}
          </div>
        ) : null}

        <div className='mt-8'>
          <Button
            variant='primary'
            className='w-full justify-center py-2.5'
            onClick={handleLogin}
            disabled={starting}
          >
            <svg className='h-4 w-4 mr-2' viewBox='0 0 24 24'>
              <path
                fill='#EA4335'
                d='M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z'
              />
              <path
                fill='#4285F4'
                d='M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z'
              />
              <path
                fill='#FBBC05'
                d='M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-1.5-.8-3.5 0-5z'
              />
              <path
                fill='#34A853'
                d='M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z'
              />
            </svg>
            Sign in with Google OAuth
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-dvh items-center justify-center bg-background'>
          <div className='text-sm text-foreground'>Loading sign in...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
