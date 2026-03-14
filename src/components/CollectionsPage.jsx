import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Search, Loader, Edit2, Trash2, ChevronUp, ChevronDown, Check, BookMarked } from 'lucide-react'
import { searchPosters } from './posterSearch'

const SOURCE_LABELS = {
  TMDB:        { color: '#01b4e4' },
  AniList:     { color: '#02a9ff' },
  MyAnimeList: { color: '#2e51a2' },
}

const STATUS_COLORS = {
  completed:     '#4361ee',
  watching:      '#2ec4b6',
  plan_to_watch: '#f4a261',
  dropped:       '#e63946',
}

const STATUS_LABELS = {
  completed:     'Completed',
  watching:      'Watching',
  plan_to_watch: 'Plan to Watch',
  dropped:       'Dropped',
}

function CollectionModal({ collection, userId, onClose, onSaved }) {
  const [name, setName] = useState(collection?.name || '')
  const [notes, setNotes] = useState(collection?.notes || '')
  const [imageUrl, setImageUrl] = useState(collection?.image_url || '')
  const [selectedPoster, setSelectedPoster] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const searchTimer = useRef(null)

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); return }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      const [tmdbResults, animeResults] = await Promise.all([
        searchPosters(searchQuery, 'movie'),
        searchPosters(searchQuery, 'anime'),
      ])
      const seen = new Set()
      const merged = []
      for (const r of [...tmdbResults, ...animeResults]) {
        if (merged.length >= 6) break
        const key = r.title?.toLowerCase().trim()
        if (key && !seen.has(key)) { seen.add(key); merged.push(r) }
      }
      setSearchResults(merged)
      setSearching(false)
    }, 600)
    return () => clearTimeout(searchTimer.current)
  }, [searchQuery])

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    const payload = { user_id: userId, name: name.trim(), image_url: imageUrl || null, notes: notes || null }
    if (collection) {
      await supabase.from('collections').update(payload).eq('id', collection.id)
    } else {
      await supabase.from('collections').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{collection ? 'Edit Collection' : 'New Collection'}</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Collection Name *</label>
              <input className="input" placeholder="e.g. MCU, Steins;Gate Universe..." value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cover Image</label>
              {selectedPoster ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <img src={selectedPoster.poster} alt={selectedPoster.title} style={{ width: '48px', borderRadius: '6px', aspectRatio: '2/3', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedPoster.title}</div>
                    <button onClick={() => { setSelectedPoster(null); setImageUrl(''); setSearchQuery('') }}
                      style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>Remove</button>
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <input className="input" placeholder="Search for a cover image..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingRight: '36px' }} />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      {searching ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                    </div>
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', marginTop: '6px', padding: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {searchResults.map(result => (
                          <button key={result.id} onClick={() => { setSelectedPoster(result); setImageUrl(result.poster); setSearchResults([]); setSearchQuery(result.title) }}
                            style={{ background: 'none', border: '2px solid transparent', borderRadius: '8px', cursor: 'pointer', padding: 0, overflow: 'hidden', position: 'relative' }}>
                            <img src={result.poster} alt={result.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', top: '4px', left: '4px', background: SOURCE_LABELS[result.source]?.color || '#333', borderRadius: '3px', padding: '1px 4px', fontSize: '8px', fontWeight: 700, color: 'white' }}>{result.source}</div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '14px 5px 5px' }}>
                              <div style={{ fontSize: '9px', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>{result.title}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <input className="input" placeholder="Or paste image URL directly..."
                      value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ fontSize: '13px' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="input" rows={2} placeholder="e.g. Watch order info, universe notes..."
                value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            {error && <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', color: 'var(--accent)', fontSize: '13px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : collection ? 'Save Changes' : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddEntryModal({ collection, userId, existingIds, onClose, onSaved }) {
  const [allMedia, setAllMedia] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const CATEGORIES = [
    { value: 'all',       label: 'All' },
    { value: 'movie',     label: 'Movie' },
    { value: 'series',    label: 'Series' },
    { value: 'anime',     label: 'Anime' },
    { value: 'animation', label: 'Animation' },
    { value: 'donghua',   label: 'Donghua' },
    { value: 'manhwa',    label: 'Manhwa' },
  ]

  useEffect(() => {
    supabase.from('media').select('*').eq('user_id', userId)
      .order('name').then(({ data }) => setAllMedia(data || []))
  }, [])

  const filtered = allMedia.filter(m =>
    !existingIds.has(m.id) &&
    m.name.toLowerCase().includes(search.toLowerCase()) &&
    (categoryFilter === 'all' || m.category === categoryFilter)
  ).sort((a, b) => (a.release_year || 9999) - (b.release_year || 9999) || a.name.localeCompare(b.name))

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const handleAdd = async () => {
    if (!selected.length) return
    setSaving(true)
    const { data: existing } = await supabase
      .from('collection_items').select('watch_order').eq('collection_id', collection.id)
      .order('watch_order', { ascending: false }).limit(1)
    let nextOrder = (existing?.[0]?.watch_order || 0) + 1
    const items = selected.map((mediaId, i) => ({
      collection_id: collection.id, media_id: mediaId, watch_order: nextOrder + i,
    }))
    await supabase.from('collection_items').insert(items)
    setSaving(false)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add to "{collection.name}"</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" placeholder="Search your vault..." value={search}
                onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '34px' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
                  style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                    borderColor: categoryFilter === cat.value ? 'var(--accent)' : 'var(--border)',
                    background: categoryFilter === cat.value ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                    color: categoryFilter === cat.value ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {cat.label}
                </button>
              ))}
            </div>
            {selected.length > 0 && (
              <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>{selected.length} selected</div>
            )}
            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {allMedia.length === 0 ? 'No entries in vault' : 'All entries already added or no matches'}
                </div>
              ) : filtered.map(item => (
                <button key={item.id} onClick={() => toggle(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: selected.includes(item.id) ? 'var(--accent-dim)' : 'var(--bg-secondary)', border: `1px solid ${selected.includes(item.id) ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                    : <div style={{ width: '36px', height: '52px', background: 'var(--bg-card)', borderRadius: '4px', flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.category}{item.subcategory ? ` · ${item.subcategory}` : ''}{item.release_year ? ` · ${item.release_year}` : ''}</div>
                  </div>
                  {selected.includes(item.id) && <Check size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !selected.length}>
                {saving ? 'Adding...' : `Add ${selected.length || ''} ${selected.length === 1 ? 'Entry' : 'Entries'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CollectionDetail({ collection, userId, onBack, onRefresh }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [sortingByYear, setSortingByYear] = useState(false)

  useEffect(() => { loadItems() }, [collection.id])

  const loadItems = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('collection_items').select('*, media(*)')
      .eq('collection_id', collection.id).order('watch_order')
    setItems(data || [])
    setLoading(false)
  }

  const handleSortByYear = async () => {
    const withDate = items.filter(i => i.media?.release_date || i.media?.release_year)
    if (!withDate.length) { alert('No entries have a release date. Use Fix Years in category pages first.'); return }
    setSortingByYear(true)
    const sorted = [...items].sort((a, b) => {
      const da = a.media?.release_date || (a.media?.release_year ? `${a.media.release_year}-01-01` : null)
      const db = b.media?.release_date || (b.media?.release_year ? `${b.media.release_year}-01-01` : null)
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return new Date(da) - new Date(db)
    })
    await Promise.all(sorted.map((item, index) =>
      supabase.from('collection_items').update({ watch_order: index + 1 }).eq('id', item.id)
    ))
    setSortingByYear(false)
    loadItems()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${collection.name}" collection?`)) return
    await supabase.from('collections').delete().eq('id', collection.id)
    onRefresh()
    onBack()
  }

  const handleRemoveItem = async (itemId) => {
    await supabase.from('collection_items').delete().eq('id', itemId)
    loadItems()
  }

  const handleMoveItem = async (index, direction) => {
    const newItems = [...items]
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= newItems.length) return
    const a = newItems[index]
    const b = newItems[swapIndex]
    await supabase.from('collection_items').update({ watch_order: b.watch_order }).eq('id', a.id)
    await supabase.from('collection_items').update({ watch_order: a.watch_order }).eq('id', b.id)
    loadItems()
  }

  const existingIds = new Set(items.map(i => i.media_id))

  return (
    <div className="fade-in">
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
        Back to Collections
      </button>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', alignItems: 'flex-start' }}>
        {collection.image_url
          ? <img src={collection.image_url} alt={collection.name} style={{ width: '100px', borderRadius: '10px', aspectRatio: '2/3', objectFit: 'cover', flexShrink: 0, boxShadow: 'var(--shadow)' }} />
          : <div style={{ width: '100px', aspectRatio: '2/3', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookMarked size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>{collection.name}</h2>
          {collection.notes && <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>{collection.notes}</p>}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>{items.length} {items.length === 1 ? 'entry' : 'entries'}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowAddEntry(true)} style={{ padding: '8px 14px', fontSize: '13px' }}>
              <Plus size={14} /> Add Entry
            </button>
            <button className="btn btn-secondary" onClick={() => setShowEdit(true)} style={{ padding: '8px 14px', fontSize: '13px' }}>
              <Edit2 size={13} /> Edit
            </button>
            <button onClick={handleSortByYear} disabled={sortingByYear}
              style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '8px', border: '1px solid #4361ee', background: 'rgba(67,97,238,0.1)', color: '#4361ee', cursor: sortingByYear ? 'default' : 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {sortingByYear ? 'Sorting...' : 'Sort by Year'}
            </button>
            <button onClick={handleDelete}
              style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '8px', border: '1px solid rgba(230,57,70,0.3)', background: 'rgba(230,57,70,0.1)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
          <BookMarked size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ marginBottom: '8px' }}>No entries yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Add entries from your vault to build the watch order</p>
          <button className="btn btn-primary" onClick={() => setShowAddEntry(true)}><Plus size={15} /> Add Entry</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item, index) => {
            const media = item.media
            if (!media) return null
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {index + 1}
                </div>
                {media.image_url
                  ? <img src={media.image_url} alt={media.name} style={{ width: '44px', height: '64px', objectFit: 'cover', objectPosition: 'center top', borderRadius: '6px', flexShrink: 0 }} />
                  : <div style={{ width: '44px', height: '64px', background: 'var(--bg-secondary)', borderRadius: '6px', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{media.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {media.category}{media.subcategory ? ` · ${media.subcategory}` : ''}
                    {media.release_year ? ` · ${media.release_year}` : ''}
                    {media.seasons ? ` · ${media.seasons} Season${media.seasons > 1 ? 's' : ''}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', background: `${STATUS_COLORS[media.status]}22`, color: STATUS_COLORS[media.status] }}>
                      {STATUS_LABELS[media.status]}
                    </span>
                    {media.rating && <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>★ {media.rating}/10</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                  <button onClick={() => handleMoveItem(index, -1)} disabled={index === 0}
                    style={{ padding: '4px', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? 'var(--border)' : 'var(--text-secondary)', display: 'flex' }}>
                    <ChevronUp size={13} />
                  </button>
                  <button onClick={() => handleMoveItem(index, 1)} disabled={index === items.length - 1}
                    style={{ padding: '4px', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', cursor: index === items.length - 1 ? 'default' : 'pointer', color: index === items.length - 1 ? 'var(--border)' : 'var(--text-secondary)', display: 'flex' }}>
                    <ChevronDown size={13} />
                  </button>
                </div>
                <button onClick={() => handleRemoveItem(item.id)}
                  style={{ padding: '6px', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: '6px', color: 'var(--accent)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showAddEntry && (
        <AddEntryModal collection={collection} userId={userId} existingIds={existingIds}
          onClose={() => setShowAddEntry(false)} onSaved={() => { setShowAddEntry(false); loadItems() }} />
      )}
      {showEdit && (
        <CollectionModal collection={collection} userId={userId}
          onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh() }} />
      )}
    </div>
  )
}

export default function CollectionsPage({ userId }) {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeCollection, setActiveCollection] = useState(null)

  useEffect(() => { loadCollections() }, [])

  const loadCollections = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('collections').select('*, collection_items(count)')
      .eq('user_id', userId).order('created_at', { ascending: false })
    setCollections(data || [])
    setLoading(false)
  }

  if (activeCollection) {
    return (
      <CollectionDetail collection={activeCollection} userId={userId}
        onBack={() => setActiveCollection(null)} onRefresh={loadCollections} />
    )
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>Collections</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Group related entries with custom watch order</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Collection
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="card" style={{ height: '280px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : collections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
          <BookMarked size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>No collections yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Create your first collection — MCU, Steins;Gate, John Wick...</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> New Collection</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {collections.map(col => {
            const count = col.collection_items?.[0]?.count || 0
            return (
              <button key={col.id} onClick={() => setActiveCollection(col)} className="card"
                style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', background: 'none', border: 'none', padding: 0 }}>
                <div style={{ height: '240px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden', flexShrink: 0, borderRadius: '12px 12px 0 0' }}>
                  {col.image_url
                    ? <img src={col.image_url} alt={col.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', transition: 'transform 0.3s' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookMarked size={40} style={{ color: 'var(--text-muted)' }} />
                      </div>
                  }
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 12px 12px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{count} {count === 1 ? 'entry' : 'entries'}</div>
                  </div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: '0 0 12px 12px', border: '1px solid var(--border)', borderTop: 'none' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{col.name}</div>
                  {col.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.notes}</div>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CollectionModal userId={userId}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); loadCollections() }} />
      )}
    </div>
  )
}
