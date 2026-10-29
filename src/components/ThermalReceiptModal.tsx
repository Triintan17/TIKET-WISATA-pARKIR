import React, { useEffect } from 'react';
import { TransactionTicket } from '../types';
import { QrCodeDisplay } from '../utils/qrGenerator';
import { sounds } from '../utils/audioHelper';
import { Printer, CheckCircle2, X, ArrowRight, Car, Users, Ticket as TicketIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ThermalReceiptModalProps {
  ticket: TransactionTicket;
  onClose: () => void;
  onNavigateToGate?: (ticketId: string) => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  ticket,
  onClose,
  onNavigateToGate,
}) => {
  useEffect(() => {
    // Play celebratory sound and confetti on ticket print
    sounds.playPrinterSound();
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  const handlePrint = () => {
    sounds.playPrinterSound();
    window.print();
  };

  const formattedDate = new Date(ticket.createdAt).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(ticket.createdAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md my-8 flex flex-col items-center">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <X className="w-4 h-4" />
          Tutup
        </button>

        {/* Paper Receipt Container with Serrated Zigzag Edge */}
        <div
          id="printable-receipt"
          className="w-full bg-[#fbfbf9] text-slate-900 rounded-sm shadow-2xl p-6 border-t-8 border-emerald-600 relative overflow-hidden"
          style={{
            boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
          }}
        >
          {/* Top Notch Decorative Lines */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="font-extrabold text-base tracking-tight text-emerald-800">TIXBOOTH</span>
              <span className="text-xs text-slate-400">×</span>
              <span className="font-extrabold text-base tracking-tight text-amber-700">MSM PARKING</span>
            </div>
            <h3 className="font-bold text-sm tracking-wide text-slate-800 uppercase">
              {ticket.destination}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Integrated Visitor & Smart Barrier Parking Gate
            </p>
            <div className="text-[10px] text-slate-500 font-mono-numbers mt-1.5">
              <span>{formattedDate}</span> · <span>{formattedTime}</span> · <span>KASIR: POS-01</span>
            </div>
          </div>

          {/* Ticket Barcode / Number Identifier */}
          <div className="py-3 text-center border-b border-dashed border-slate-300">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Kode Booking / No. Tiket
            </p>
            <p className="text-base font-extrabold font-mono-numbers tracking-widest text-slate-900 mt-0.5">
              {ticket.id}
            </p>
            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>STATUS: {ticket.status === 'active' ? 'TIKET AKTIF (SIAP SCAN)' : 'SELESAI'}</span>
            </div>
          </div>

          {/* Itemized Detail */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-2 text-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <TicketIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tiket Masuk Pengunjung ({ticket.totalVisitors} Orang)</span>
            </div>
            {ticket.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-slate-700">
                <span>
                  {item.name} <span className="text-slate-500 font-mono-numbers">×{item.qty}</span>
                </span>
                <span className="font-mono-numbers font-medium">
                  Rp {(item.price * item.qty).toLocaleString('id-ID')}
                </span>
              </div>
            ))}

            {/* Parking Integration Section */}
            {ticket.parking && ticket.parking.enabled && (
              <div className="pt-2 mt-2 border-t border-slate-200">
                <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-amber-600" />
                    <span>Parkir Terintegrasi ({ticket.parking.vehicleLabel})</span>
                  </span>
                  <span className="font-mono-numbers font-semibold text-slate-800">
                    Rp {ticket.parking.fee.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 bg-amber-50/70 p-1.5 rounded border border-amber-200/50">
                  <span>No. Plat Kendaraan:</span>
                  <span className="font-mono font-bold tracking-wider text-slate-900">
                    {ticket.parking.licensePlate}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment & Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs font-mono-numbers">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>Rp {ticket.subtotal.toLocaleString('id-ID')}</span>
            </div>

            {ticket.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Voucher Diskon ({ticket.voucherCode}):</span>
                <span>-Rp {ticket.discount.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>TOTAL BAYAR:</span>
              <span>Rp {ticket.totalAmount.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Metode Pembayaran:</span>
              <span className="font-semibold uppercase text-slate-700">
                {ticket.paymentMethod === 'qris'
                  ? 'QRIS Dinamis'
                  : ticket.paymentMethod === 'cash'
                  ? 'Tunai (Cash)'
                  : 'E-Money / Tap'}
              </span>
            </div>

            {ticket.cashPaid && (
              <>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Uang Diterima:</span>
                  <span>Rp {ticket.cashPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Kembalian:</span>
                  <span>Rp {(ticket.change || 0).toLocaleString('id-ID')}</span>
                </div>
              </>
            )}

            {ticket.loyaltyEarned > 0 && (
              <div className="text-[11px] text-amber-800 font-sans bg-amber-100/60 p-1.5 rounded text-center mt-2">
                🎉 Selamat! Anda mendapatkan <strong>+{ticket.loyaltyEarned} Loyalty Points</strong>
              </div>
            )}
          </div>

          {/* QR Code Section for Gate Scanner */}
          <div className="pt-4 text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 mb-2">
              Scan Barcode / QR di Pintu Masuk & Barrier Gate
            </p>
            <div className="flex justify-center">
              <QrCodeDisplay value={ticket.qrPayload} size={150} />
            </div>
            <p className="text-[10px] text-slate-500 font-mono-numbers mt-1.5">
              Ref: {ticket.qrPayload}
            </p>
            <p className="text-[9px] text-slate-400 mt-2 italic leading-tight">
              Simpan struk fisik / digital ini hingga selesai berkunjung. Tiket berlaku untuk 1x akses turnstile dan validasi palang parkir.
            </p>
          </div>

          {/* Bottom Jagged Teeth Graphic */}
          <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-50" />
        </div>

        {/* Modal Action Controls (Hidden when printed) */}
        <div className="no-print w-full mt-4 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk Thermal
          </button>

          {onNavigateToGate && (
            <button
              onClick={() => {
                onNavigateToGate(ticket.id);
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <span>Uji Scan di Gerbang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
