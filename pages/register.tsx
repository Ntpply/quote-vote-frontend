import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import styles from '../styles/register.module.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    try {
      await axios.post('http://localhost:8080/auth/register', { username, password })
      setSuccess(true)
      
      // Auto redirect after success animation
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'สร้างบัญชีไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✅</div>
            <h1 className={styles.successTitle}>สร้างบัญชีสำเร็จ!</h1>
            <p className={styles.successText}>กำลังเปลี่ยนไปหน้าเข้าสู่ระบบ...</p>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.registerCard}>
          <div className={styles.header}>
            <div className={styles.logoIcon}>💭</div>
            <h1 className={styles.title}>Quote Collection</h1>
            <p className={styles.subtitle}>สร้างบัญชีเพื่อเริ่มต้นการเดินทาง</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.registerForm}>
            <div className={styles.inputGroup}>
              <div className={styles.inputIcon}>👤</div>
              <input
                type="text"
                placeholder="ชื่อผู้ใช้"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className={styles.input}
                disabled={loading}
                minLength={3}
              />
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputIcon}>🔒</div>
              <input
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className={styles.input}
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputIcon}>🔑</div>
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            <div className={styles.passwordStrength}>
              <div className={styles.strengthItem}>
                <span className={password === confirmPassword && password.length > 0 ? styles.checkGreen : styles.checkGray}>✓</span>
                <span>รหัสผ่านตรงกัน</span>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.registerButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  กำลังสร้างบัญชี...
                </>
              ) : (
                'สร้างบัญชี'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>มีบัญชีอยู่แล้ว?</p>
            <button 
              onClick={() => router.push('/login')}
              className={styles.loginLink}
              disabled={loading}
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}