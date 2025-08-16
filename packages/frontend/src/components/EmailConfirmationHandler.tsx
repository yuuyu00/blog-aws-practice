import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export const EmailConfirmationHandler = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading } = useAuth()
  const { showToast } = useToast()
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Extract the error, if any, from the URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('Email confirmation error:', error, errorDescription)
          showToast('メール確認に失敗しました。もう一度お試しください。', 'error')
          navigate('/login')
          return
        }

        // Wait for auth state to settle
        let attempts = 0
        const maxAttempts = 10
        
        while (!user && !loading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }
        
        if (user) {
          showToast('メールアドレスが確認されました', 'success')
          // The ProfileCheckWrapper will handle redirecting to signup-profile if needed
          navigate('/')
        } else if (!loading) {
          // If still no user after waiting, something went wrong
          showToast('確認に失敗しました。もう一度ログインしてください。', 'error')
          navigate('/login')
        }
      } catch (err) {
        console.error('Error handling email confirmation:', err)
        showToast('エラーが発生しました。', 'error')
        navigate('/login')
      } finally {
        setProcessing(false)
      }
    }

    if (!loading) {
      handleConfirmation()
    }
  }, [user, loading, searchParams, navigate, showToast])

  if (processing || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-400">確認処理中...</div>
      </div>
    )
  }

  return null
}