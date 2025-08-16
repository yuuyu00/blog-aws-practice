import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router'
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

export const AuthGuard = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  
  // Check if user exists in our database
  const { data, loading: checkingUser, error } = useQuery(CHECK_USER, {
    skip: !user || authLoading,
    fetchPolicy: 'network-only' // Always check the latest status
  })

  useEffect(() => {
    if (authLoading || checkingUser) return

    if (!user) {
      // Not logged in, redirect to login
      navigate('/login')
    } else if (error || !data?.me) {
      // Logged in but no profile, redirect to profile setup
      navigate('/signup-profile')
    }
    // If data.me exists, user is fully set up, continue
  }, [user, authLoading, checkingUser, data, error, navigate])

  if (authLoading || checkingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-400">読み込み中...</div>
      </div>
    )
  }

  // User is authenticated and has a profile
  return <Outlet />
}