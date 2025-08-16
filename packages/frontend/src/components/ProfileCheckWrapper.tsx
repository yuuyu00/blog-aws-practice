import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { useAuth } from '@/contexts/AuthContext'

const CHECK_USER = gql`
  query CheckUser {
    me {
      id
      sub
      name
      email
    }
  }
`

interface ProfileCheckWrapperProps {
  children: React.ReactNode
}

export const ProfileCheckWrapper = ({ children }: ProfileCheckWrapperProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  
  // Check if user exists in our database
  const { data, loading: checkingUser, error } = useQuery(CHECK_USER, {
    skip: !user || authLoading,
    fetchPolicy: 'network-only' // Always check the latest status
  })

  useEffect(() => {
    if (authLoading || checkingUser) return

    // Skip redirect if we're already on these pages
    const skipRedirectPaths = ['/login', '/signup', '/signup-profile', '/auth/callback']
    if (skipRedirectPaths.includes(location.pathname)) return

    if (user && (error || !data?.me)) {
      // User is authenticated but has no profile, redirect to profile setup
      navigate('/signup-profile')
    }
  }, [user, authLoading, checkingUser, data, error, navigate, location.pathname])

  return <>{children}</>
}