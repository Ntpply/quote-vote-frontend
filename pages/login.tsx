import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await axios.post('http://localhost:8080/auth/login', { username, password })
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('username', username)
            router.push('/showList')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed')
        }
    }

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    )
}
