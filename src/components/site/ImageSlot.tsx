import { db } from '@/lib/db';

// Renders a named image slot. If a photo has been uploaded in admin, serves the
// optimized WebP (with JPG fallback) lazily. If empty, shows a labeled placeholder
// with the recommended size — so the layout NEVER looks broken. "Hard to destroy".
export default async function ImageSlot({
  id,
  className,
  rounded = true,
}: {
  id: string;
  className?: string;
  rounded?: boolean;
}) {
  const slot = await db.imageSlot.findUnique({ where: { id } });
  const style: React.CSSProperties = {
    width: '100%',
    aspectRatio: slot ? `${slot.recW} / ${slot.recH}` : '16 / 9',
    borderRadius: rounded ? 'var(--radius)' : 0,
    objectFit: 'cover',
  };

  if (!slot || !slot.webpPath) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--cream)', border: '2px dashed var(--gold)', color: 'var(--text-light)',
          textAlign: 'center', padding: '1rem', fontSize: 'var(--fs-small)',
        }}
      >
        <span>
          🖼 {slot?.label || id}
          <br />
          <span className="caption">
            {slot ? `Рекомендуемый размер ${slot.recW}×${slot.recH}px` : 'Слот не найден'}
          </span>
        </span>
      </div>
    );
  }

  return (
    <picture>
      <source srcSet={slot.webpPath} type="image/webp" />
      <img
        src={slot.fallbackPath || slot.webpPath}
        alt={slot.alt}
        loading="lazy"
        decoding="async"
        className={className}
        style={{
          ...style,
          backgroundImage: slot.blurData ? `url(${slot.blurData})` : undefined,
          backgroundSize: 'cover',
        }}
      />
    </picture>
  );
}
