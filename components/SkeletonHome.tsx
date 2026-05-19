export default function SkeletonHome() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="shimmer" style={{ height: '460px', borderRadius: 0, marginBottom: '8px' }} />

      {/* Section skeletons */}
      {[0, 1, 2].map((s) => (
        <div key={s} style={{ padding: '20px 16px 6px' }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div className="shimmer" style={{ width: 4, height: 18, borderRadius: '2px' }} />
            <div className="shimmer" style={{ width: 120, height: 18, borderRadius: '6px' }} />
          </div>
          {/* Cards */}
          <div style={{ display: 'flex', gap: '10px', overflow: 'hidden' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: '130px' }}>
                <div className="shimmer" style={{ width: '130px', height: '182px', borderRadius: '12px', marginBottom: '8px' }} />
                <div className="shimmer" style={{ width: '85%', height: '11px', borderRadius: '4px', marginBottom: '5px' }} />
                <div className="shimmer" style={{ width: '55%', height: '10px', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
