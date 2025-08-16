import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Field, Label } from '@/components/ui/fieldset'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // バリデーション
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password)
      setSuccess(true)
      // 数秒後にログイン画面へリダイレクト
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      if (err instanceof Error) {
        // Supabaseのエラーメッセージを日本語化
        if (err.message.includes('already registered')) {
          setError('このメールアドレスは既に登録されています')
        } else if (err.message.includes('Invalid email')) {
          setError('有効なメールアドレスを入力してください')
        } else {
          setError(err.message)
        }
      } else {
        setError('登録に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
          新規アカウント登録
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 text-sm">
              <strong className="font-semibold">登録完了</strong>
              <p className="mt-1">
                確認メールを送信しました。メールを確認してアカウントを有効化してください。
                まもなくログイン画面に移動します...
              </p>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={success}
            />
          </Field>

          <Field>
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={success}
            />
            <p className="mt-1 text-sm text-gray-600">
              6文字以上で入力してください
            </p>
          </Field>

          <Field>
            <Label htmlFor="confirmPassword">パスワード（確認）</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={success}
            />
          </Field>

          <div>
            <Button
              type="submit"
              color="blue"
              className="w-full"
              disabled={loading || success}
            >
              {loading ? '登録中...' : '新規登録'}
            </Button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          既にアカウントをお持ちの場合{' '}
          <Link
            to="/login"
            className="font-semibold leading-6 text-blue-600 hover:text-blue-500"
          >
            ログインはこちら
          </Link>
        </p>
      </div>
    </div>
  )
}