'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  // AUTH + LOADING
  const [loading, setLoading] = useState(true)

  // DATA
  const [notes, setNotes] = useState<any[]>([])

  // TABS
  const [tabs, setTabs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<any>(null)

  // SEARCH
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searchMode, setSearchMode] = useState<'global' | 'current'>('global')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // INIT
  useEffect(() => {
    const init = async () => {
        const { data } = await supabase.auth.getUser()

        if (!data.user) {
        router.push('/')
        } else {
        const fetchedNotes = await fetchNotes()

        setLoading(false)

        if (fetchedNotes.length > 0) {
            const latestBatch = fetchedNotes.slice(-15)

            setTabs(latestBatch)
            setActiveTab(latestBatch[latestBatch.length - 1])
        }
        }
    }

    init()
    }, [])

  // CTRL+F
  useEffect(() => {
    const runSearch = async () => {
        if (!search) {
        setResults([])
        return
        }

        if (searchMode === 'global') {
        const { data } = await supabase
            .from('notes')
            .select('*')
            .ilike('content', `%${search}%`)
            .limit(100)

        if (data) setResults(data)
        }

        if (searchMode === 'current' && activeTab) {
        if (
            activeTab.content
            ?.toLowerCase()
            .includes(search.toLowerCase())
        ) {
            setResults([activeTab])
        } else {
            setResults([])
        }
        }
    }

    runSearch()
    }, [search, searchMode, activeTab])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        e.stopPropagation()
        setShowSearch(prev => !prev)
        }
    }

    window.addEventListener('keydown', handleKey)

    return () => {
        window.removeEventListener('keydown', handleKey)
    }
    }, [])
    
  useEffect(() => {
    if (showSearch) {
        setTimeout(() => {
        searchInputRef.current?.focus()
        }, 0)
    }
    }, [showSearch])  
    
  useEffect(() => {
    if (!showSearch) return

    const handleKey = (e: KeyboardEvent) => {
        if (!results.length) return

        if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : prev
        )
        }

        if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : prev
        )
        }

        if (e.key === 'Enter') {
        e.preventDefault()
        const selected = results[selectedIndex]
        if (selected) {
            openBatchFromNote(selected)
        }
        }
    }

    window.addEventListener('keydown', handleKey)

    return () => window.removeEventListener('keydown', handleKey)
    }, [results, selectedIndex, showSearch])

  // FETCH NOTES
  const fetchNotes = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) return []

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (error) {
        console.error(error)
        return []
    }

    setNotes(data)
    return data // ✅ TRÈS IMPORTANT
    }

  // ADD NOTE
  const addNote = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) return

    const { data, error } = await supabase
        .from('notes')
        .insert([
        {
            user_id: user.id,
            title: 'New note',
            content: ''
        }
        ])
        .select()

    if (!error && data) {
        const newNote = data[0]

        // ✅ update notes (ordre logique)
        const updatedNotes = [...notes, newNote]
        setNotes(updatedNotes)

        // ✅ recalcul batch des 13 derniers
        const latestBatch = updatedNotes.slice(-15)

        setTabs(latestBatch)
        setActiveTab(latestBatch[latestBatch.length - 1])
    }
    }

  // DELETE NOTE
  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)

    // ✅ update liste des notes
    const updatedNotes = notes.filter(n => n.id !== id)
    setNotes(updatedNotes)

    // ✅ recalcul batch des 13 derniers
    if (updatedNotes.length > 0) {
        const latestBatch = updatedNotes.slice(-15)

        setTabs(latestBatch)
        setActiveTab(latestBatch[latestBatch.length - 1])
    } else {
        // ✅ plus aucune note
        setTabs([])
        setActiveTab(null)
    }
    }

  // UPDATE NOTE
  const updateNote = async (id: string, field: string, value: string) => {
    await supabase
      .from('notes')
      .update({
        [field]: value,
        updated_at: new Date()
      })
      .eq('id', id)

    setNotes(notes.map(n => n.id === id ? { ...n, [field]: value } : n))

    setTabs(tabs.map(t => t.id === id ? { ...t, [field]: value } : t))

    if (activeTab?.id === id) {
      setActiveTab({ ...activeTab, [field]: value })
    }
  }

  // OPEN TAB
  const openTab = (note: any) => {
    const exists = tabs.find(t => t.id === note.id)

    if (!exists) {
      const newTabs = [...tabs, note].slice(-15)
      setTabs(newTabs)
      setActiveTab(note)
    } else {
      setActiveTab(note)
    }
  }

  // SEARCH
  const handleSearch = async () => {
    if (!search) return

    if (searchMode === 'global') {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .ilike('content', `%${search}%`)
      
        if (data) {
        setResults(data)
        setSelectedIndex(0)
        }

    }

    if (searchMode === 'current' && activeTab) {
      if (activeTab.content?.includes(search)) {
        setResults([activeTab])
      } else {
        setResults([])
      }
    }
  }

  const openBatchFromNote = (note: any) => {
    if (!notes || notes.length === 0) return

    const index = notes.findIndex(n => n.id === note.id)

    if (index === -1) return

    // ✅ fenêtre de 13 notes
    const BATCH_SIZE = 13
    const HALF = Math.floor(BATCH_SIZE / 2)

    let start = index - HALF

    if (start < 0) start = 0

    let end = start + BATCH_SIZE

    // ✅ si on dépasse la fin → on recale
    if (end > notes.length) {
        end = notes.length
        start = Math.max(0, end - BATCH_SIZE)
    }

    const batch = notes.slice(start, end)

    setTabs(batch)
    setActiveTab(note)
    }
    

  if (loading) return <p className="p-10">Loading...</p>

  return (
    <div className="flex flex-col h-screen">

      <div className="flex border-b items-center justify-between">
        {/* TABS */}
        <div className="flex overflow-x-auto">
            {tabs.map(tab => (
            <div
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 cursor-pointer border-r ${
                activeTab?.id === tab.id
                    ? 'bg-white font-bold'
                    : 'bg-gray-100'
                }`}
            >
                {tab.title}
            </div>
            ))}
        </div>

        {/* SEARCH BUTTON */}
        <button
            onClick={() => setShowSearch(true)}
            className="px-3 py-1 border-l bg-gray-200 hover:bg-gray-300"
        >
            🔍 (Ctrl+F)
        </button>

        </div>
        

      <div className="flex flex-1 overflow-hidden">

        {/* SEARCH SIDEBAR */}
        {showSearch && (
        <>
            {/* FOND sombre */}
            <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowSearch(false)}
            />

            {/* SIDEBAR overlay */}
            <div
            className="fixed left-0 top-0 h-full w-1/4 bg-white border-r p-4 z-50 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            >
            {/* bouton fermer */}
            <button 
                onClick={() => {
                setShowSearch(false)
                setSearch('')
                setResults([])
                setSelectedIndex(0)
                }}
            >
                Close
            </button>

            {/* SEARCH INPUT */}
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="border p-2 w-full mb-2"
            />

            {/* MODE */}
            <div className="flex gap-2 mb-2">
                <button onClick={() => setSearchMode('global')}>
                Global
                </button>
                <button onClick={() => setSearchMode('current')}>
                Current
                </button>
            </div>
            <p className="text-sm text-gray-500 mb-2">
            Mode: {searchMode === 'global' ? 'All notes' : 'Current note'}
            </p>        

            {/* BUTTON */}
            <button
                onClick={handleSearch}
                className="bg-blue-500 text-white px-2 py-1 mb-2"
            >
                Search
            </button>

            {/* RESULTS */}
            <p className="text-xs text-gray-400 mb-2">
            {results.length} results
            </p>
            {results.map((r, i) => (
                <div
                    key={r.id}
                    ref={
                    i === selectedIndex
                        ? (el: HTMLDivElement | null) => {
                            el?.scrollIntoView({ block: 'nearest' })
                        }
                        : null
                    }
                    onClick={() => openBatchFromNote(r)}
                    className={`cursor-pointer border-b py-2 px-1 ${
                    i === selectedIndex
                        ? 'bg-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                >
                    {r.title}
                </div>
                ))}
            {results.length === 0 && search && (
                <p className="text-sm text-gray-500">
                    No results found
                </p>
                )}
            </div>
        </>
        )}

        {/* NOTES LIST (optionnel mais utile) */}
        {!showSearch && (
          <div className="w-1/4 border-r p-4 overflow-y-auto">
            <button
              onClick={addNote}
              className="mb-4 bg-blue-500 text-white px-3 py-2 rounded"
            >
              + New note
            </button>

            {notes.slice(-20).reverse().map(note => (
              <div
                key={note.id}
                className="flex justify-between items-center mb-2 cursor-pointer"
              >
                <span onClick={() => openTab(note)}>
                  {note.title}
                </span>

                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-red-500 ml-2"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        {/* EDITOR */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab ? (
            <>
              <input
                className="w-full text-xl font-bold mb-4"
                value={activeTab.title}
                onChange={(e) =>
                  updateNote(activeTab.id, 'title', e.target.value)
                }
              />

              <textarea
                className="w-full h-[80vh] border p-2"
                value={activeTab.content || ''}
                onChange={(e) =>
                  updateNote(activeTab.id, 'content', e.target.value)
                }
              />
            </>
          ) : (
            <p>Select a note</p>
          )}
        </div>

      </div>
    </div>
  )
}