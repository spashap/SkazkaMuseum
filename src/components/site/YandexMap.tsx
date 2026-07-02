// Yandex Maps iframe (spec 2.3). No API key needed. Coords from CompanySettings.
export default function YandexMap({ lat, lon }: { lat: string; lon: string }) {
  const src = `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=17&pt=${lon}%2C${lat}%2Cpm2rdm`;
  return (
    <iframe
      src={src}
      width="100%"
      height="400"
      frameBorder={0}
      allowFullScreen
      style={{ border: 0, borderRadius: 'var(--radius)' }}
      title="Карта — Музей русской сказки"
    />
  );
}
