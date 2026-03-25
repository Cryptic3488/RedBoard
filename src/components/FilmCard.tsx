import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { FilmPostWithCreator } from '../types/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHudlEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('hudl.com')) return null
    // Convert share URL to embed URL: /video/... → /embed/video/...
    const path = u.pathname.replace(/^\/video\//, '/embed/video/')
    if (path === u.pathname && !u.pathname.startsWith('/embed/')) return null
    return `https://www.hudl.com${path.startsWith('/embed/') ? path : `/embed${path}`}`
  } catch {
    return null
  }
}

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── FilmCard ─────────────────────────────────────────────────────────────────

interface FilmCardProps {
  post: FilmPostWithCreator
  isPersonal: boolean
  showDelete?: boolean
  onDelete?: (id: string) => void
}

export function FilmCard({ post, isPersonal, showDelete, onDelete }: FilmCardProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (post.link_type !== 'file') return
    supabase.storage
      .from('film-clips')
      .createSignedUrl(post.url, 3600)
      .then(({ data }) => { if (data?.signedUrl) setSignedUrl(data.signedUrl) })
  }, [post.link_type, post.url])

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    onDelete(post.id)
  }

  const embedUrl = post.link_type === 'hudl' ? getHudlEmbedUrl(post.url) : null

  return (
    <div className="bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700/50 border-l-2 border-l-brand rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-display font-semibold text-near-black dark:text-gray-100 text-base leading-snug">
                {post.title}
              </h3>
              {isPersonal && (
                <span className="inline-flex text-[10px] uppercase tracking-widest text-brand border border-brand/30 bg-brand/10 rounded-full px-2 py-0.5 shrink-0">
                  Just for you
                </span>
              )}
            </div>
            <p className="font-ui text-xs text-gray-500">
              {post.creator?.name ?? 'Coach'} · {relativeTime(post.created_at)}
            </p>
          </div>
          {showDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="shrink-0 font-ui text-xs text-gray-400 hover:text-red-600 transition-colors px-2 py-1"
              aria-label="Delete post"
            >
              {deleting ? '…' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="w-full">
        {post.link_type === 'hudl' && (
          embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                title={post.title}
              />
            </div>
          ) : (
            <div className="px-4 pb-3">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-ui text-sm text-brand hover:text-brand-light underline underline-offset-2 transition-colors"
              >
                Open in Hudl →
              </a>
            </div>
          )
        )}
        {post.link_type === 'file' && signedUrl && (
          <video
            controls
            className="w-full max-h-72 bg-black"
            src={signedUrl}
          />
        )}
        {post.link_type === 'file' && !signedUrl && (
          <div className="px-4 pb-3">
            <span className="font-ui text-xs text-gray-400">Loading video…</span>
          </div>
        )}
      </div>

      {/* Note */}
      {post.note && (
        <div className="px-4 pb-4 pt-2">
          <p className="font-ui text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{post.note}</p>
        </div>
      )}
    </div>
  )
}
