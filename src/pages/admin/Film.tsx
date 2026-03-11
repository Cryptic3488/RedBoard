import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useFilmPosts } from '../../hooks/useFilmPosts'
import { FilmCard } from '../../components/FilmCard'
import type { Profile, LinkType, Visibility } from '../../types/database'

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

  return (
    <div className="px-4 pt-6 pb-10 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-near-black mb-1">Film</h1>
      <p className="font-ui text-sm text-gray-500 mb-8">Post Hudl clips or upload video to share with players.</p>

      {/* ── Upload form ── */}
      <section className="bg-white/80 border border-gray-200 rounded-xl p-5 mb-10">
        <h2 className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">
          New Post
        </h2>

        {banner && (
          <div className={`mb-4 px-4 py-3 rounded-lg font-ui text-sm ${
            banner.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-600'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {banner.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="font-ui text-xs text-gray-600 block mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={120}
              placeholder="e.g. Defensive rotations — vs. Notre Dame"
              className="w-full bg-gray-100/60 border border-gray-300 rounded-lg px-3 py-2
                         font-ui text-sm text-near-black placeholder-gray-400
                         focus:outline-none focus:border-brand/60 transition-colors"
            />
          </div>

          {/* Link type toggle */}
          <div>
            <label className="font-ui text-xs text-gray-600 block mb-1.5">Type</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 w-fit">
              {(['hudl', 'file'] as LinkType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, linkType: type, hudlUrl: '', file: null }))}
                  className={`px-4 py-1.5 font-ui text-xs font-medium transition-colors capitalize
                    ${form.linkType === type
                      ? 'bg-brand/20 text-brand'
                      : 'bg-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {type === 'hudl' ? 'Hudl link' : 'Upload file'}
                </button>
              ))}
            </div>
          </div>

          {/* Hudl URL */}
          {form.linkType === 'hudl' && (
            <div>
              <label className="font-ui text-xs text-gray-600 block mb-1.5">Hudl URL</label>
              <input
                type="url"
                value={form.hudlUrl}
                onChange={e => setForm(f => ({ ...f, hudlUrl: e.target.value }))}
                placeholder="https://www.hudl.com/video/..."
                className="w-full bg-gray-100/60 border border-gray-300 rounded-lg px-3 py-2
                           font-ui text-sm text-near-black placeholder-gray-400
                           focus:outline-none focus:border-brand/60 transition-colors"
              />
              <p className="font-ui text-[11px] text-gray-400 mt-1">
                Paste the share link from Hudl (hudl.com/video/…)
              </p>
            </div>
          )}

          {/* File upload */}
          {form.linkType === 'file' && (
            <div>
              <label className="font-ui text-xs text-gray-600 block mb-1.5">File</label>
              <label className="flex flex-col items-center justify-center w-full h-28
                                border-2 border-dashed border-gray-300 rounded-lg cursor-pointer
                                hover:border-brand/40 transition-colors bg-gray-100/60">
                <span className="font-ui text-sm text-gray-500">
                  {form.file ? form.file.name : 'Click to select video or audio'}
                </span>
                {form.file && (
                  <span className="font-ui text-xs text-gray-400 mt-1">
                    {(form.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))}
                />
              </label>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="font-ui text-xs text-gray-600 block mb-1.5">Coaching note (optional)</label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={3}
              placeholder="Key takeaways, focus areas…"
              className="w-full bg-gray-100/60 border border-gray-300 rounded-lg px-3 py-2
                         font-ui text-sm text-near-black placeholder-gray-400 resize-none
                         focus:outline-none focus:border-brand/60 transition-colors"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="font-ui text-xs text-gray-600 block mb-2">Audience</label>
            <div className="flex gap-4">
              {(['team', 'individual'] as Visibility[]).map(v => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={v}
                    checked={form.visibility === v}
                    onChange={() => setForm(f => ({ ...f, visibility: v, recipientIds: [] }))}
                    className="accent-brand"
                  />
                  <span className="font-ui text-sm text-gray-700 capitalize">
                    {v === 'team' ? 'Whole team' : 'Individual players'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Player checkboxes */}
          {form.visibility === 'individual' && (
            <div>
              <label className="font-ui text-xs text-gray-600 block mb-2">Select players</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {players.map(p => (
                  <label key={p.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.recipientIds.includes(p.id)}
                      onChange={() => toggleRecipient(p.id)}
                      className="accent-brand w-4 h-4 rounded"
                    />
                    <span className="font-ui text-sm text-gray-700 group-hover:text-near-black transition-colors">
                      {p.name}
                    </span>
                  </label>
                ))}
                {players.length === 0 && (
                  <p className="font-ui text-xs text-gray-400">No players found.</p>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-brand hover:bg-brand-light disabled:opacity-50
                       font-ui text-sm font-semibold text-white rounded-lg transition-colors
                       flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {uploadProgress ? 'Uploading…' : 'Publishing…'}
              </>
            ) : 'Publish'}
          </button>
        </form>
      </section>

      {/* ── Published posts ── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400">
            Published
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {postsLoading && (
          <div className="flex justify-center py-8">
            <span className="w-5 h-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
          </div>
        )}

        {!postsLoading && posts.length === 0 && (
          <p className="font-ui text-sm text-gray-400 text-center py-8">No posts yet.</p>
        )}

        <div className="space-y-4">
          {posts.map(post => (
            <FilmCard
              key={post.id}
              post={post}
              isPersonal={false}
              showDelete
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
