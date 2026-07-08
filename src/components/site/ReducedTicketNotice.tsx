import { REDUCED_TICKET_NOTICE } from '@/lib/reducedTickets';

// Shown wherever a reduced ("льготный") ticket is being bought or reviewed: cart,
// checkout, account ticket views. Text comes from one place (src/lib/reducedTickets.ts)
// so it can't drift between screens.
export default function ReducedTicketNotice({ style }: { style?: React.CSSProperties }) {
  return (
    <p
      className="small"
      style={{
        padding: '0.85rem 1rem',
        background: 'rgba(139,26,47,0.06)',
        border: '1px solid rgba(139,26,47,0.2)',
        borderRadius: 'var(--radius)',
        color: 'var(--text)',
        ...style,
      }}
    >
      ⚠ {REDUCED_TICKET_NOTICE}
    </p>
  );
}
