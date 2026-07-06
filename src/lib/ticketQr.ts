import QRCode from 'qrcode';

// The QR on a ticket just encodes a link to its own public, login-free detail
// page (src/app/(site)/account/ticket/[id]/page.tsx) — the booking id (a cuid)
// is unguessable, so it works like a normal bearer e-ticket link.
export function ticketUrl(bookingId: string, origin: string): string {
  return `${origin}/account/ticket/${bookingId}`;
}

export async function ticketQrDataUrl(bookingId: string, origin: string): Promise<string> {
  return QRCode.toDataURL(ticketUrl(bookingId, origin), { margin: 1, width: 240 });
}

// Raw PNG bytes — used when embedding the QR into a generated PDF (pdfkit wants
// a Buffer, not a data URL).
export async function ticketQrBuffer(bookingId: string, origin: string): Promise<Buffer> {
  return QRCode.toBuffer(ticketUrl(bookingId, origin), { margin: 1, width: 240 });
}
