'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { getVideoData, getEpisodeList, VideoData, EpisodeItem } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SlotData {
  episodeNum: number;
  chapterId: string;
  videoData: VideoData | null;
  loading: boolean;
  error: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRELOAD_AHEAD = 2; // berapa episode ke depan di-prefetch

// ─── Single Video Slot ────────────────────────────────────────────────────────
function VideoSlot({
  slot,
  isActive,
  dramaTitle,
  coverImage,
  bookId,
  filteredTitle,
  totalEpisodes,
  isMuted,
  onMuteToggle,
}: {
  slot: SlotData;
  isActive: boolean;
  dramaTitle: string;
  coverImage: string;
  bookId: string;
  filteredTitle: string;
  totalEpisodes: number;
  isMuted: boolean;
  onMuteToggle: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTap, setShowTap] = useState(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sinkronisasi play/pause saat slot aktif / tidak aktif
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !slot.videoData?.video_url) return;
    if (isActive) {
      v.muted = isMuted;
      v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      v.pause();
      v.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, slot.videoData?.video_url, isMuted]);

  // Update mute state di video element
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Progress bar
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  // Tap to play/pause dengan animasi ikon
  const handleTap = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
    setShowTap(true);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => setShowTap(false), 700);
  }, []);

  const handleFullscreen = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;

    // Coba native video fullscreen dulu (mobile support terbaik)
    if ((v as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      if (isFullscreen) {
        (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
      } else {
        (v as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen!();
      }
      return;
    }

    // Fallback: standard Fullscreen API pada container
    const el = containerRef.current ?? document.documentElement;
    if (!document.fullscreenElement) {
      try { await el.requestFullscreen(); } catch (err) { console.warn('Fullscreen failed:', err); }
    } else {
      try { await document.exitFullscreen(); } catch {}
    }
  }, [isFullscreen]);

  // Sync fullscreen state on external exit (e.g. pressing Esc)
  useEffect(() => {
    const onChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        background: '#000',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        overflowY: 'hidden',
      }}
    >
      {/* ── Video ── */}
      {slot.loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          {coverImage && (
            <Image src={coverImage} alt={dramaTitle} fill style={{ objectFit: 'cover', opacity: 0.25 }} />
          )}
          <div className="tiktok-spinner" />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', position: 'relative' }}>
            Memuat Ep {slot.episodeNum}…
          </span>
        </div>
      )}

      {slot.error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {coverImage && (
            <Image src={coverImage} alt={dramaTitle} fill style={{ objectFit: 'cover', opacity: 0.15 }} />
          )}
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', position: 'relative' }}>
            Gagal memuat video
          </span>
        </div>
      )}

      {slot.videoData?.video_url && (
        <video
          ref={videoRef}
          src={slot.videoData.video_url}
          loop={false}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* ── Tap overlay ── */}
      <div
        onClick={handleTap}
        style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'pointer' }}
      />

      {/* ── Tap icon flash ── */}
      {showTap && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 20,
            pointerEvents: 'none',
            animation: 'tapFlash 0.7s ease forwards',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            {isPlaying ? (
              <Pause size={30} fill="white" color="white" />
            ) : (
              <Play size={30} fill="white" color="white" />
            )}
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      >
        <Link
          href={`/drama/${bookId}?filtered_title=${encodeURIComponent(filteredTitle)}&title=${encodeURIComponent(dramaTitle)}&cover=${encodeURIComponent(coverImage)}`}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronLeft size={18} />
        </Link>

        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fff',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            padding: '5px 12px',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {slot.episodeNum} / {totalEpisodes}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onMuteToggle(); }}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* ── Right action bar: Fullscreen ── */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 130,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover thumbnail */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '2px solid #e8332a',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 0 0 2px rgba(232,51,42,0.3)',
          }}
        >
          {coverImage && (
            <Image src={coverImage} alt={dramaTitle} fill style={{ objectFit: 'cover' }} />
          )}
        </div>

        {/* Fullscreen */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <button
            onClick={handleFullscreen}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232,51,42,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
          >
            {isFullscreen ? (
              <Minimize size={20} color="#fff" />
            ) : (
              <Maximize size={20} color="#fff" />
            )}
          </button>
          <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}>
            {isFullscreen ? 'Keluar' : 'Layar penuh'}
          </span>
        </div>
      </div>

      {/* ── Bottom info ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 60,
          zIndex: 30,
          padding: '0 16px 28px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            color: '#fff',
            marginBottom: 4,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            lineHeight: 1.3,
          }}
        >
          {dramaTitle}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
          Episode {slot.episodeNum}
        </p>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
          Geser ↑ untuk episode berikutnya
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'rgba(255,255,255,0.15)',
          zIndex: 35,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: '#e8332a',
            transition: 'width 0.25s linear',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Watch Content ───────────────────────────────────────────────────────
function WatchContent() {
  const { bookId, episodeNum } = useParams() as { bookId: string; episodeNum: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const filteredTitle = searchParams.get('filtered_title') ?? '';
  const chapterId = searchParams.get('chapter_id') ?? '';
  const dramaTitle = decodeURIComponent(searchParams.get('title') ?? 'Drama');
  const coverImage = decodeURIComponent(searchParams.get('cover') ?? '');

  const startEp = parseInt(episodeNum, 10);

  // Episode list (untuk navigasi)
  const [episodeList, setEpisodeList] = useState<EpisodeItem[]>([]);
  const [totalEpisodes, setTotalEpisodes] = useState(0);

  // Slot data: kita load beberapa episode sekaligus
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const loadedEpsRef = useRef<Set<number>>(new Set());

  // ── Fetch episode list ──
  useEffect(() => {
    if (!filteredTitle) return;
    getEpisodeList(bookId, filteredTitle).then((list) => {
      setEpisodeList(list);
      setTotalEpisodes(list.length);
    });
  }, [bookId, filteredTitle]);

  // ── Init: load starting episode + preload ahead ──
  useEffect(() => {
    if (!chapterId || !filteredTitle) return;

    // Build initial slots starting from startEp
    const initialSlots: SlotData[] = [
      { episodeNum: startEp, chapterId, videoData: null, loading: true, error: false },
    ];
    setSlots(initialSlots);
    loadEpisodeIntoSlot(startEp, chapterId, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startEp, chapterId, filteredTitle]);

  // ── Load episode video data into a slot ──
  const loadEpisodeIntoSlot = useCallback(
    async (epNum: number, chapId: string, slotIndex: number) => {
      if (loadedEpsRef.current.has(epNum)) return;
      loadedEpsRef.current.add(epNum);
      try {
        const data = await getVideoData(bookId, epNum, filteredTitle, chapId);
        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIndex]) {
            next[slotIndex] = { ...next[slotIndex], videoData: data, loading: false, error: false };
          }
          return next;
        });

        // Preload ahead: setelah episode ini loaded, load yang berikutnya
        if (data.next_episode) {
          preloadAhead(epNum, data.next_episode, slotIndex);
        }
      } catch {
        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIndex]) {
            next[slotIndex] = { ...next[slotIndex], loading: false, error: true };
          }
          return next;
        });
      }
    },
    [bookId, filteredTitle]
  );

  // ── Preload following episodes ──
  const preloadAhead = useCallback(
    (currentEp: number, nextEpItem: EpisodeItem, currentSlotIndex: number) => {
      setSlots((prev) => {
        // Cek apakah slot untuk next episode sudah ada
        const exists = prev.some((s) => s.episodeNum === nextEpItem.episode);
        if (exists) return prev;

        const nextSlotIndex = currentSlotIndex + 1;
        const newSlot: SlotData = {
          episodeNum: nextEpItem.episode,
          chapterId: nextEpItem.chapter_id,
          videoData: null,
          loading: true,
          error: false,
        };
        const updated = [...prev, newSlot];

        // Load async (non-blocking)
        setTimeout(() => loadEpisodeIntoSlot(nextEpItem.episode, nextEpItem.chapter_id, nextSlotIndex), 300);

        return updated;
      });
    },
    [loadEpisodeIntoSlot]
  );

  // ── Keyboard navigation (desktop) ──
  const navigateSlotRef = useRef<(dir: 1 | -1) => void>(() => {});
  useEffect(() => { navigateSlotRef.current = navigateSlot; }, [navigateSlot]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSlotRef.current(e.key === 'ArrowDown' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []); // ← [] penting: register sekali saja

  // ── Scroll detection: update activeIndex ──
  const activeIndexRef = useRef(0);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  const slotsRef = useRef<SlotData[]>([]);
  useEffect(() => { slotsRef.current = slots; }, [slots]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      const idx = Math.round(container.scrollTop / window.innerHeight);
      if (idx !== activeIndexRef.current) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
        const slot = slotsRef.current[idx];
        if (slot) {
          const url = `/watch/${bookId}/${slot.episodeNum}?filtered_title=${encodeURIComponent(filteredTitle)}&chapter_id=${encodeURIComponent(slot.chapterId)}&title=${encodeURIComponent(dramaTitle)}&cover=${encodeURIComponent(coverImage)}`;
          window.history.replaceState(null, '', url);
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [bookId, filteredTitle, dramaTitle, coverImage]); // ← tidak include activeIndex/slots

  // ── Programmatic scroll to slot ──
  const navigateSlot = useCallback(
    (direction: 1 | -1) => {
      const nextIdx = activeIndexRef.current + direction;
      if (nextIdx < 0 || nextIdx >= slotsRef.current.length) return;
      const container = scrollContainerRef.current;
      if (!container) return;

      isScrollingRef.current = true;
      container.scrollTo({ top: nextIdx * window.innerHeight, behavior: 'smooth' });
      setActiveIndex(nextIdx);
      activeIndexRef.current = nextIdx;
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    },
    []
  );

  // ── Touch swipe (mobile fallback) ──
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) navigateSlot(diff > 0 ? 1 : -1);
  };

  if (slots.length === 0) {
    return (
      <div
        style={{
          height: '100dvh',
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        {coverImage && (
          <Image src={coverImage} alt={dramaTitle} fill style={{ objectFit: 'cover', opacity: 0.2 }} />
        )}
        <div className="tiktok-spinner" style={{ position: 'relative' }} />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', position: 'relative' }}>
          Memuat…
        </span>
      </div>
    );
  }

  return (
    <>
      {/* ── Navigation arrows (desktop) ── */}
      <div
        style={{
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <button
          onClick={() => navigateSlot(-1)}
          disabled={activeIndex === 0}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: activeIndex === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: activeIndex === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: activeIndex === 0 ? 'default' : 'pointer',
          }}
        >
          <ChevronUp size={18} />
        </button>
        <button
          onClick={() => navigateSlot(1)}
          disabled={activeIndex >= slots.length - 1}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background:
              activeIndex >= slots.length - 1 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: activeIndex >= slots.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: activeIndex >= slots.length - 1 ? 'default' : 'pointer',
          }}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* ── Scroll container ── */}
      <div
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          height: '100dvh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {slots.map((slot, idx) => (
          <VideoSlot
            key={slot.episodeNum}
            slot={slot}
            isActive={idx === activeIndex}
            dramaTitle={dramaTitle}
            coverImage={coverImage}
            bookId={bookId}
            filteredTitle={filteredTitle}
            totalEpisodes={totalEpisodes || slots.length}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted((m) => !m)}
          />
        ))}
      </div>

      {/* ── Global styles ── */}
      <style>{`
        @keyframes tapFlash {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(0.8); }
          50%  { opacity: 1; transform: translate(-50%,-50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(1.2); }
        }
        .tiktok-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: #e8332a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        /* hide scrollbar on webkit */
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: '100dvh',
            background: '#0a0a0f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="tiktok-spinner" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
