import { useState } from 'react'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')

    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }

    try {
      const formData = new URLSearchParams()

      formData.append('username', email)
      formData.append('password', password)

      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: 'include',
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.role) {
        setError(data.message || 'Invalid email or password.')
        return
      }

      onLogin(data)
    } catch (error) {
      console.error('Login error:', error)
      setError('Unable to connect to server.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Employee Directory</h1>
        <p>Login to continue</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>

        <button
          className="login-button"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  )
}

export default Login