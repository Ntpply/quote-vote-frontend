import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import styles from '../styles/quotePage.module.css'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

interface Quote {
    id: string
    text: string
    author: string
    createdAt: string
    votes: number
    votedBy: string[]
    userVoted: boolean
    category: string
}
const categories = [
    'คำคมความรัก',
    'คำคมสร้างแรงบันดาลใจ',
    'คำคมตลกขำขัน',
    'คำคมชีวิต',
    'คำคมความสำเร็จ',
    'คำคมมิตรภาพ',
    'คำคมสุขภาพ'
]

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#d0ed57', '#a4de6c']
export default function QuotePage() {
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [text, setText] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [token, setToken] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
    const [editingText, setEditingText] = useState('')
    const router = useRouter()
    const [category, setCategory] = useState(categories[0])
    const [editingCategory, setEditingCategory] = useState(categories[0])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const bottomRef = useRef<HTMLDivElement | null>(null)
    interface Quotes {
        id: string
        text: string
        author: string
        votes: number
    }

    const [selectedQuote, setSelectedQuote] = useState<Quotes | null>(null)


    useEffect(() => {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('username')
        if (!savedToken || !savedUser) {
            router.push('/login')
            return
        }
        setToken(savedToken)
        setUsername(savedUser)
        fetchQuotes(savedToken, savedUser)
    }, [])

    const filteredQuotes = selectedCategory
        ? quotes.filter(q => q.category === selectedCategory)
        : quotes
    const latestQuotes = [...filteredQuotes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const mostVotedQuotes = [...filteredQuotes]
        .sort((a, b) => b.votes - a.votes)

    const fetchQuotes = async (authToken: string, currentUser: string, pageNum = 1) => {
        try {
            const res = await axios.get(`http://localhost:8080/quotes/getQuotes`, {
                params: {
                    limit: 10,
                    page: pageNum,
                    search: search,
                    category: selectedCategory,
                    sortBy: sortBy,
                    sortOrder: sortOrder
                },
                headers: { Authorization: `Bearer ${authToken}` }
            })

            const fetchedQuotes: Quote[] = Array.isArray(res.data)
                ? res.data.map((q: any) => ({
                    ...q,
                    userVoted: q.votedBy?.includes(currentUser) || false
                }))
                : []

            if (pageNum === 1) {
                setQuotes(fetchedQuotes)
            } else {
                setQuotes((prev) => [...prev, ...fetchedQuotes])
            }

            setHasMore(fetchedQuotes.length >= 10)
        } catch (err) {
            console.error('Failed to load quotes:', err)
            setError('ไม่สามารถโหลดคำคมได้')
            if (pageNum === 1) setQuotes([])
        }
    }
    useEffect(() => {
        if (token && username) {
            setPage(1)
            fetchQuotes(token, username, 1)
        }
    }, [search, selectedCategory, sortBy, sortOrder])

    const loadMoreQuotes = async () => {
        if (loadingMore || !hasMore || !token || !username) return
        setLoadingMore(true)
        const nextPage = page + 1
        await fetchQuotes(token, username, nextPage)
        setPage(nextPage)
        setLoadingMore(false)
    }
    useEffect(() => {
        if (!bottomRef.current) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreQuotes()
            }
        })
        observer.observe(bottomRef.current)
        return () => {
            if (bottomRef.current) observer.unobserve(bottomRef.current)
        }
    }, [bottomRef.current, loadMoreQuotes])

    const handleAddQuote = async () => {
        if (!text.trim()) {
            setError('กรุณาใส่คำคม')
            return
        }
        if (!token || !username) {
            setError('กรุณาเข้าสู่ระบบ')
            return
        }

        try {
            await axios.post(
                'http://localhost:8080/quotes/addQuote',
                { text, author: username, category },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setText('')
            setShowAddForm(false)
            fetchQuotes(token, username)
            setError('')
        } catch (err) {
            console.error('Failed to add quote:', err)
            setError('ไม่สามารถเพิ่มคำคมได้')
        }
    }

    const handleVote = async (quoteId: string, currentVotes: number, userHasVoted: boolean) => {
        if (!token || !username) {
            setError('กรุณาเข้าสู่ระบบก่อนโหวต')
            return
        }

        try {
            if (userHasVoted) {
                // ยกเลิกโหวต
                await axios.post(
                    `http://localhost:8080/quotes/vote/${quoteId}`,
                    { username, action: 'unvote' },
                    { headers: { Authorization: `Bearer ${token}` } }
                )

                setQuotes(prevQuotes =>
                    prevQuotes.map(q =>
                        q.id === quoteId
                            ? {
                                ...q,
                                votes: currentVotes - 1,
                                userVoted: false,
                                votedBy: q.votedBy.filter(u => u !== username),
                            }
                            : q
                    )
                )
            } else {
                // โหวตใหม่
                await axios.post(
                    `http://localhost:8080/quotes/vote/${quoteId}`,
                    { username, action: 'vote' },
                    { headers: { Authorization: `Bearer ${token}` } }
                )

                setQuotes(prevQuotes =>
                    prevQuotes.map(q =>
                        q.id === quoteId
                            ? {
                                ...q,
                                votes: currentVotes + 1,
                                userVoted: true,
                                votedBy: [...q.votedBy, username],
                            }
                            : q
                    )
                )
            }

            setError('')
        } catch (err) {
            console.error('Failed to vote:', err)
            setError('โหวตไม่สำเร็จ กรุณาลองใหม่')
            if (token && username) fetchQuotes(token, username)
        }
    }

    const handleUpdateQuote = async (quoteId: string) => {
        if (!editingText.trim()) {
            setError('กรุณาใส่คำคม')
            return
        }
        if (!token) {
            setError('กรุณาเข้าสู่ระบบ')
            return
        }

        try {
            await axios.put(
                `http://localhost:8080/quotes/updateQuote/${quoteId}`,
                { text: editingText },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setEditingQuoteId(null)
            setEditingText('')
            fetchQuotes(token, username)
            setError('')
        } catch (err: any) {
            console.error('Failed to update quote:', err)
            if (err.response?.data?.error) {
                setError(err.response.data.error)
            } else {
                setError('ไม่สามารถแก้ไขคำคมได้')
            }
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        router.push('/login')
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const topQuotes = quotes
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5)
        .map((q) => ({
            id: q.id,                // <<== ต้องมี id เพื่อแมปกลับ
            name: q.text.length > 20 ? q.text.slice(0, 20) + '...' : q.text,
            votes: q.votes,
        }))

    // จำนวนคำคมในแต่ละหมวด
    const categoryStats = categories.map(cat => ({
        name: cat,
        count: quotes.filter(q => q.category === cat).length
    }))

    // ผู้ใช้โหวตอะไรบ้าง
    const votedStats = [
        { name: 'คุณเคยโหวตแล้ว', value: quotes.some(q => q.userVoted) ? 1 : 0 },
        { name: 'ยังไม่เคยโหวต', value: quotes.some(q => q.userVoted) ? 0 : 1 }
    ]

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerLeft}>
                        <div className={styles.logo}>
                            <span className={styles.logoIcon}>💭</span>
                            <div className={styles.logoText}>
                                <h1 className={styles.title}>Quote Collection</h1>
                                <p className={styles.subtitle}>แบ่งปันความคิดดีๆ กับทุกคน</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.userInfo}>
                            <span className={styles.username}>{username}</span>
                        </div>
                        <button onClick={handleLogout} className={styles.logoutButton}>
                            ออกจากระบบ
                        </button>
                    </div>
                </div>
            </header>

            <div className={styles.container}>
                <div className={styles.categoryFilterSection}>
                    <div className={styles.categoryButtons}>
                        <button
                            className={`${styles.categoryButton} ${selectedCategory === null ? styles.activeCategory : ''}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            ทั้งหมด
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`${styles.categoryButton} ${selectedCategory === cat ? styles.activeCategory : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.chartSection}>
                    <h2 className={styles.subHeader}>สถิติคำคม</h2>

                    <div className={styles.chartsGrid}>

                        <div className={styles.chartBox}>
                            <h3 className={styles.chartTitle}>คำคมยอดนิยม (Top 5)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topQuotes}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar
                                        dataKey="votes"
                                        fill="#8884d8"
                                        onClick={(_, index) => {
                                            const clickedQuote = topQuotes[index]
                                            const fullQuote = quotes.find(q => q.id === clickedQuote.id)
                                            if (fullQuote) setSelectedQuote(fullQuote)
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>


                        <div className={styles.chartBox}>
                            <h3 className={styles.chartTitle}>การมีส่วนร่วมของคุณ</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={votedStats} dataKey="value" nameKey="name" outerRadius={100} label>
                                        {votedStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {selectedQuote && (
                            <div className={styles.popupOverlay} onClick={() => setSelectedQuote(null)}>
                                <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                                    <h4 className={styles.popupHeader}>คำคมยอดนิยม</h4>
                                    <p className={styles.popupText}>"{selectedQuote.text}"</p>
                                    <p className={styles.popupAuthor}>โดย {selectedQuote.author}</p>
                                    <button className={styles.popupClose} onClick={() => setSelectedQuote(null)}>
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className={styles.chartBox}>
                            <h3 className={styles.chartTitle}>จำนวนคำคมในแต่ละหมวด</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryStats}
                                        dataKey="count"
                                        nameKey="name"
                                        outerRadius={100}
                                        label
                                    >
                                        {categoryStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>


                <div className={styles.addSection}>
                    <div className={styles.searchSortControls}>
                        <input
                            type="text"
                            placeholder="ค้นหาคำคม..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setPage(1)
                                    fetchQuotes(token!, username!, 1)
                                }
                            }}
                            className={styles.searchInput}
                        />

                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
                            <option value="createdAt">เรียงตามวันที่</option>
                            <option value="votes">เรียงตามคะแนน</option>
                        </select>

                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} className={styles.sortSelect}>
                            <option value="desc">ใหม่สุดไปเก่าสุด</option>
                            <option value="asc">เก่าสุดไปใหม่สุด</option>
                        </select>
                    </div>
                    {!showAddForm ? (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className={styles.addQuoteButton}
                        >
                            <span>เพิ่มคำคมใหม่</span>
                        </button>
                    ) : (
                        <div className={styles.addForm}>
                            <h3 className={styles.addFormTitle}>เพิ่มคำคมใหม่</h3>
                            <textarea
                                placeholder="พิมพ์คำคมของคุณที่นี่..."
                                value={text}
                                onChange={e => setText(e.target.value)}
                                className={styles.textArea}
                                rows={4}
                            />
                            <h3 className={styles.addFormTitle}>หมวดหมู่คำคม</h3>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className={styles.selectCategory}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {error && (
                                <div className={styles.error}>
                                    {error}
                                </div>
                            )}
                            <div className={styles.addFormButtons}>
                                <button onClick={handleAddQuote} className={styles.confirmButton}>
                                    เพิ่มคำคม
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddForm(false)
                                        setText('')
                                        setError('')
                                    }}
                                    className={styles.cancelButton}
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.quoteListSection}>
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                            <p className={styles.loadingText}>กำลังโหลด...</p>
                        </div>
                    ) : quotes.length > 0 ? (
                        <div className={styles.quoteList}>
                            <div className={styles.quoteListGrid}>
                                {search.trim() !== '' && (
                                    <div className={styles.searchResultsSection}>
                                        <h2 className={styles.subHeader}>ผลการค้นหา "{search}"</h2>
                                        {filteredQuotes.length > 0 ? (
                                            <div className={styles.quoteList}>
                                                {filteredQuotes.map((q) => (
                                                    <div key={q.id} className={styles.quoteItem}>
                                                        <div className={styles.quoteContent}>
                                                            <div className={styles.quoteBar}></div>
                                                            <div className={styles.quoteMain}>
                                                                <blockquote className={styles.quoteText}>{q.category}</blockquote>
                                                                <blockquote className={styles.quoteText}>"{q.text}"</blockquote>
                                                                <div className={styles.quoteMeta}>
                                                                    <div className={styles.authorInfo}>
                                                                        <span className={styles.authorIcon}>👤</span>
                                                                        <span className={styles.author}>{q.author}</span>
                                                                    </div>
                                                                    <div className={styles.dateInfo}>
                                                                        <span className={styles.date}>{formatDate(q.createdAt)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={styles.voteSection}>
                                                            <button
                                                                onClick={() => handleVote(q.id, q.votes, q.userVoted)}
                                                                className={`${styles.voteButton} ${q.userVoted ? styles.votedButton : ''}`}
                                                            >
                                                                <span className={styles.voteIcon}>
                                                                    {q.userVoted ? '❤️' : '🤍'}
                                                                </span>
                                                                <span className={styles.voteCount}>{q.votes}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={styles.emptyText}>ไม่พบคำคมที่ตรงกับ "{search}"</p>
                                        )}
                                    </div>
                                )}
                                {search.trim() === '' && (
                                    <div className={styles.latestColumn}>
                                        <h2 className={styles.subHeader}>คำคมล่าสุด</h2>
                                        {latestQuotes.map((q, index) => (
                                            <div key={q.id} className={styles.quoteItem} style={{ animationDelay: `${index * 100}ms` }}>
                                                <div className={styles.quoteContent}>
                                                    <div className={styles.quoteBar}></div>
                                                    <div className={styles.quoteMain}>
                                                        {editingQuoteId === q.id ? (
                                                            <>
                                                                <textarea
                                                                    className={styles.textArea}
                                                                    rows={3}
                                                                    value={editingText}
                                                                    onChange={e => setEditingText(e.target.value)}
                                                                />
                                                                <select
                                                                    value={editingCategory}
                                                                    onChange={e => setEditingCategory(e.target.value)}
                                                                    className={styles.selectCategory}
                                                                >
                                                                    {categories.map(cat => (
                                                                        <option key={cat} value={cat}>{cat}</option>
                                                                    ))}
                                                                </select>
                                                                {error && (
                                                                    <div className={styles.error}>
                                                                        {error}
                                                                    </div>
                                                                )}
                                                                <div className={styles.addFormButtons}>
                                                                    <button onClick={() => handleUpdateQuote(q.id)} className={styles.confirmButton}>
                                                                        บันทึก
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingQuoteId(null)
                                                                            setEditingText('')
                                                                            setError('')
                                                                        }}
                                                                        className={styles.cancelButton}
                                                                    >
                                                                        ยกเลิก
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <blockquote className={styles.quoteText}>
                                                                    {q.category}
                                                                </blockquote>
                                                                <blockquote className={styles.quoteText}>
                                                                    "{q.text}"
                                                                </blockquote>

                                                                <div className={styles.quoteMeta}>
                                                                    <div className={styles.authorInfo}>
                                                                        <span className={styles.authorIcon}>👤</span>
                                                                        <span className={styles.author}>{q.author || 'ไม่ทราบชื่อ'}</span>
                                                                    </div>
                                                                    <div className={styles.dateInfo}>
                                                                        <span className={styles.date}>
                                                                            {q.createdAt ? formatDate(q.createdAt) : 'ไม่ทราบเวลา'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.voteSection}>
                                                    {q.votes === 0 && q.author === username && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingQuoteId(q.id)
                                                                setEditingText(q.text)
                                                                setError('')
                                                            }}
                                                            className={styles.editButton}
                                                        >
                                                            แก้ไข
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleVote(q.id, q.votes, q.userVoted)}
                                                        className={`${styles.voteButton} ${q.userVoted ? styles.votedButton : ''}`}
                                                    >
                                                        <span className={styles.voteIcon}>
                                                            {q.userVoted ? '❤️' : '🤍'}
                                                        </span>
                                                        <span className={styles.voteCount}>{q.votes}</span>
                                                    </button>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {search.trim() === '' && (
                                    <div className={styles.popularColumn}>
                                        <h2 className={styles.subHeader}>คำคมยอดนิยม</h2>

                                        {mostVotedQuotes.map((q, index) => (
                                            <div key={q.id} className={styles.quoteItem} style={{ animationDelay: `${index * 100}ms` }}>
                                                <div className={styles.quoteContent}>
                                                    <div className={styles.quoteBar}></div>
                                                    <div className={styles.quoteMain}>
                                                        {editingQuoteId === q.id ? (
                                                            <>
                                                                <textarea
                                                                    className={styles.textArea}
                                                                    rows={3}
                                                                    value={editingText}
                                                                    onChange={e => setEditingText(e.target.value)}
                                                                />
                                                                <select
                                                                    value={editingCategory}
                                                                    onChange={e => setEditingCategory(e.target.value)}
                                                                    className={styles.selectCategory}
                                                                >
                                                                    {categories.map(cat => (
                                                                        <option key={cat} value={cat}>{cat}</option>
                                                                    ))}
                                                                </select>
                                                                {error && (
                                                                    <div className={styles.error}>
                                                                        {error}
                                                                    </div>
                                                                )}
                                                                <div className={styles.addFormButtons}>
                                                                    <button onClick={() => handleUpdateQuote(q.id)} className={styles.confirmButton}>
                                                                        บันทึก
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingQuoteId(null)
                                                                            setEditingText('')
                                                                            setError('')
                                                                        }}
                                                                        className={styles.cancelButton}
                                                                    >
                                                                        ยกเลิก
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <blockquote className={styles.quoteText}>
                                                                    {q.category}
                                                                </blockquote>
                                                                <blockquote className={styles.quoteText}>
                                                                    "{q.text}"
                                                                </blockquote>

                                                                <div className={styles.quoteMeta}>
                                                                    <div className={styles.authorInfo}>
                                                                        <span className={styles.authorIcon}>👤</span>
                                                                        <span className={styles.author}>{q.author || 'ไม่ทราบชื่อ'}</span>
                                                                    </div>
                                                                    <div className={styles.dateInfo}>
                                                                        <span className={styles.date}>
                                                                            {q.createdAt ? formatDate(q.createdAt) : 'ไม่ทราบเวลา'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.voteSection}>
                                                    {q.votes === 0 && q.author === username && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingQuoteId(q.id)
                                                                setEditingText(q.text)
                                                                setError('')
                                                            }}
                                                            className={styles.editButton}
                                                        >
                                                            แก้ไข
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleVote(q.id, q.votes, q.userVoted)}
                                                        className={`${styles.voteButton} ${q.userVoted ? styles.votedButton : ''}`}
                                                    >
                                                        <span className={styles.voteIcon}>
                                                            {q.userVoted ? '❤️' : '🤍'}
                                                        </span>
                                                        <span className={styles.voteCount}>{q.votes}</span>
                                                    </button>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                            <div ref={bottomRef} className={styles.scrollObserver}></div>
                            {loadingMore && <p className={styles.loadingMore}>กำลังโหลดเพิ่มเติม...</p>}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📝</div>
                            <p className={styles.emptyText}>ยังไม่มีคำคม</p>
                            <p className={styles.emptySubtext}>เริ่มต้นด้วยการเพิ่มคำคมแรกของคุณ</p>
                        </div>
                    )}

                </div>

            </div>
        </div>
    )
}
