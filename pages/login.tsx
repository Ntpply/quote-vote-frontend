import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import styles from '../styles/login.module.css'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        try {
            const response = await axios.post('http://localhost:8080/auth/login', { username, password })
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('username', username)
            router.push('/showList')
        } catch (err: any) {
            setError(err.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <div className={styles.header}>
                        <div className={styles.logoIcon}>💭</div>
                        <h1 className={styles.title}>Quote Collection</h1>
                        <p className={styles.subtitle}>เข้าสู่ระบบเพื่อแบ่งปันความคิดดีๆ</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.loginForm}>
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
                            />
                        </div>

                        {error && (
                            <div className={styles.error}>
                                <span className={styles.errorIcon}>⚠️</span>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className={styles.loginButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                'เข้าสู่ระบบ'
                            )}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <p className={styles.footerText}>ยังไม่มีบัญชี?</p>
                        <button 
                            onClick={() => router.push('/register')}
                            className={styles.registerLink}
                        >
                            สร้างบัญชีใหม่
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}