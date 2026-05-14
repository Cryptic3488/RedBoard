import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useFilmPosts } from '../../hooks/useFilmPosts'
import { FilmCard } from '../../components/FilmCard'
import type { Profile, LinkType, Visibility } from '../../types/database'
import { IconUpload } from '../../components/icons'

// ─── Form state ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  linkType: 'hudl' as LinkType,
  hudlUrl: '',
  file: null as File | null,
  note: '',
  visibility: 'team' as Visibility,
  recipientIds: [] as string[],
}

// ─── AdminFilm ────────────────────────────────────────────────────────────────

export default function AdminFilm() {
  const { user } = useAuth()
  const { posts, loading: postsLoading, refresh } = useFilmPosts()

  const [form, setForm] = useState(EMPTY_FORM)
  const [players, setPlayers] = useState<Profile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load player profiles once
  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'player')
      .order('name')
      .then(({ data }) => setPlayers((data ?? []) as Profile[]))
  }, [])

  // ─── Validation ───────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form.title.trim()) return 'Title is required.'
    if (form.title.length > 120) return 'Title must be 120 characters or fewer.'
    if (form.linkType === 'hudl') {
      if (!form.hudlUrl.trim()) return 'Hudl URL is required.'
      try { new URL(form.hudlUrl) } catch { return 'Enter a valid Hudl URL.' }
      if (!form.hudlUrl.includes('hudl.com')) return 'URL must be a hudl.com link.'
    }
    if (form.linkType === 'file' && !form.file) return 'Select a video or audio file to upload.'
    if (form.visibility === 'individual' && form.recipientIds.length === 0)
      return 'Select at least one player.'
    return null
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)

    const err = validate()
    if (err) { setBanner({ type: 'error', message: err }); return }
    if (!user) return

    setSubmitting(true)

    try {
      let url = form.hudlUrl.trim()

      // 1. Upload file if needed
      if (form.linkType === 'file' && form.file) {
        setUploadProgress(true)
        const ext = form.file.name.split('.').pop() ?? 'mp4'
        const path = `clips/${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('film-clips')
          .upload(path, form.file)
        setUploadProgress(false)
        if (uploadErr) throw uploadErr
        url = path
      }

      // 2. Insert film_post
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: postData, error: postErr } = await (supabase as any)
        .from('film_posts')
        .insert({
          created_by: user.id,
          title: form.title.trim(),
          note: form.note.trim(),
          link_type: form.linkType,
          url,
          visibility: form.visibility,
        })
        .select('id')
        .single() as { data: { id: string } | null; error: Error | null }

      if (postErr || !postData) throw postErr ?? new Error('Insert failed')

      // 3. Insert recipients if individual
      if (form.visibility === 'individual' && form.recipientIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: recErr } = await (supabase as any)
          .from('film_post_recipients')
          .insert(form.recipientIds.map((pid: string) => ({ post_id: postData.id, player_id: pid })))
        if (recErr) throw recErr
      }

      setBanner({ type: 'success', message: 'Film post published.' })
      setForm(EMPTY_FORM)
      if (fileInputRef.current) fileInputRef.current.value = ''
      refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setBanner({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
      setUploadProgress(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    const post = posts.find(p => p.id === id)
    if (!post) return

    if (post.link_type === 'file') {
      await supabase.storage.from('film-clips').remove([post.url])
    }

    await supabase.from('film_posts').delete().eq('id', id)
    refresh()
  }

  // ─── Recipient toggle ─────────────────────────────────────────────────────

  function toggleRecipient(id: string) {
    setForm(f => ({
      ...f,
      recipientIds: f.recipientIds.includes(id)
        ? f.recipientIds.filter(r => r !== id)
        : [...f.recipientIds, id],
    }))
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const inputCls = 'w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 font-ui text-sm text-near-black dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-brand transition-colors'
  const labelCls = 'font-ui text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-1.5'

  return (
    <div className="max-w-2xl pb-12">
      <h1 className="font-display text-2xl font-black text-near-black dark:text-white mb-0.5">Film</h1>
      <p className="font-ui text-sm text-gray-400 dark:text-gray-500 mb-7">Post Hudl clips or upload video to share with players.</p>

      {/* Form */}
      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-gray-800/60 rounded-2xl p-5 shadow-sm mb-8">
        <p className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-5">New Post</p>

        {banner && (
          <div className={`mb-5 px-4 py-3 rounded-xl font-ui text-sm ${
            banner.type === 'error'
              ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
              : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
          }`}>{banner.message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={120} placeholder="e.g. Defensive rotations — vs. Notre Dame" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Type</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 w-fit">
              {(['hudl', 'file'] as LinkType[]).map(type => (
                <button key={type} type="button"
                  onClick={() => setForm(f => ({ ...f, linkType: type, hudlUrl: '', file: null }))}
                  className={`px-4 py-2 font-ui text-xs font-semibold transition-colors
                    ${form.linkType === type ? 'bg-brand text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                  {type === 'hudl' ? 'Hudl link' : 'Upload file'}
                </button>
              ))}
            </div>
          </div>

          {form.linkType === 'hudl' && (
            <div>
              <label className={labelCls}>Hudl URL</label>
              <input type="url" value={form.hudlUrl} onChange={e => setForm(f => ({ ...f, hudlUrl: e.target.value }))}
                placeholder="https://www.hudl.com/video/..." className={inputCls} />
              <p className="font-ui text-[11px] text-gray-400 mt-1">Paste the share link from Hudl</p>
            </div>
          )}

          {form.linkType === 'file' && (
            <div>
              <label className={labelCls}>File</label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed
                                border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer
                                hover:border-brand/40 transition-colors bg-gray-50 dark:bg-white/5">
                <IconUpload size={20} className="text-gray-400 mb-2" />
                <span className="font-ui text-sm text-gray-500 dark:text-gray-400">
                  {form.file ? form.file.name : 'Click to select video or audio'}
                </span>
                {form.file && <span className="font-ui text-xs text-gray-400 mt-0.5">{(form.file.size / 1024 / 1024).toFixed(1)} MB</span>}
                <input ref={fileInputRef} type="file" accept="video/*,audio/*" className="hidden"
                  onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))} />
              </label>
            </div>
          )}

          <div>
            <label className={labelCls}>Coaching note <span className="normal-case font-normal text-gray-400">(optional)</span></label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={3} placeholder="Key takeaways, focus areas…"
              className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Audience</label>
            <div className="flex gap-5">
              {(['team', 'individual'] as Visibility[]).map(v => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="visibility" value={v} checked={form.visibility === v}
                    onChange={() => setForm(f => ({ ...f, visibility: v, recipientIds: [] }))} className="accent-brand" />
                  <span className="font-ui text-sm text-near-black dark:text-gray-100">
                    {v === 'team' ? 'Whole team' : 'Individual players'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {form.visibility === 'individual' && (
            <div>
              <label className={labelCls}>Select players</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl p-3">
                {players.map(p => (
                  <label key={p.id} className="flex items-center gap-2.5 cursor-pointer py-1">
                    <input type="checkbox" checked={form.recipientIds.includes(p.id)}
                      onChange={() => toggleRecipient(p.id)} className="accent-brand w-4 h-4 rounded" />
                    <span className="font-ui text-sm text-near-black dark:text-gray-100">{p.name}</span>
                  </label>
                ))}
                {players.length === 0 && <p className="font-ui text-xs text-gray-400">No players found.</p>}
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-brand hover:bg-brand/90 disabled:opacity-50 font-ui text-sm font-semibold
                       text-white rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {uploadProgress ? 'Uploading…' : 'Publishing…'}</>
            ) : 'Publish'}
          </button>
        </form>
      </div>

      {/* Published posts */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500">Published</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>
        {postsLoading && <div className="flex justify-center py-8"><span className="w-5 h-5 border-2 border-gray-200 border-t-brand rounded-full animate-spin" /></div>}
        {!postsLoading && posts.length === 0 && <p className="font-ui text-sm text-gray-400 text-center py-8">No posts yet.</p>}
        <div className="space-y-3">
          {posts.map(post => <FilmCard key={post.id} post={post} isPersonal={false} showDelete onDelete={handleDelete} />)}
        </div>
      </div>
    </div>
  )
}
