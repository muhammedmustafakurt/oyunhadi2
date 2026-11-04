import { notFound } from 'next/navigation';
import { findCafe } from '@/lib/rooms';
import type { Venue } from '@/lib/venue-types';
import { onColor } from '@/components/oyun/on-color';

// Mekânın renkleri bütün oyuncu sayfalarına buradan yayılır; oyunlar --blue değişkeniyle mekân rengini alır.
// --on-brand / --on-accent: o renklerin üstündeki yazı rengi (açık sarı mekânda beyaz yazı okunmaz).
export default async function VenueLayout({ children, params }: LayoutProps<'/[mekan]'>) {
  const { mekan } = await params;
  const venue: Venue | null = await findCafe(mekan);
  if (!venue) notFound();
  return (
    <div
      className="oh"
      style={
        {
          '--brand': venue.color,
          '--accent': venue.accent,
          '--on-brand': onColor(venue.color),
          '--on-accent': onColor(venue.accent),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
