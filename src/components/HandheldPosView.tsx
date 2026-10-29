import React, { useState } from 'react';
import { TransactionTicket, VehicleType, PaymentMethod } from '../types';
import { sounds } from '../utils/audioHelper';
import { Bike, Car, Bus, Printer, Ticket, Check, RefreshCw } from 'lucide-react';

interface HandheldPosViewProps {
  onIssueTicket: (ticket: TransactionTicket) => void;
  recentTickets: TransactionTicket[];
}

export const HandheldPosView: React.FC<HandheldPosViewProps> = ({
  onIssueTicket,
  recentTickets,
}) => {
  const [vehicle, setVehicle] = useState<VehicleType>('mobil');
  const [plateNumber, setPlateNumber] = useState<string>('D 8892 KIO');
  const [visitorAdultQty, setVisitorAdultQty] = useState<number>(2);
  const [visitorChildQty, setVisitorChildQty] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const vehicleRates: Record<VehicleType, { label: string; fee: number }> = {
    motor: { label: 'Motor', fee: 5000 },
    mobil: { label: 'Mobil', fee: 10000 },
    bus: { label: 'Bus', fee: 25000 },
    none: { label: 'Pejalan', fee: 0 },
  };

  const visitorSubtotal = visitorAdultQty * 50000 + visitorChildQty * 25000;
  const parkingFee = vehicleRates[vehicle].fee;
  const grandTotal = visitorSubtotal + parkingFee;

  const handlePrintSlip = () => {
    if (vehicle !== 'none' && !plateNumber.trim()) {
      alert('Masukkan nomor plat kendaraan');
      return;
    }

    setIsPrinting(true);
    sounds.playPrinterSound();

    setTimeout(() => {
      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;
      const qrPayload = `TIXBOOTH:${ticketId}:TW${visitorAdultQty + visitorChildQty}:${vehicle !== 'none' ? plateNumber.replace(/\s+/g, '') : 'NOPK'}`;

      const items = [];
      if (visitorAdultQty > 0) {
        items.push({
          id: 'dewasa' as const,
          name: 'Taman Wisata Dewasa',
          price: 50000,
          qty: visitorAdultQty,
        });
      }
      if (visitorChildQty > 0) {
        items.push({
          id: 'anak' as const,
          name: 'Taman Wisata Anak',
          price: 25000,
          qty: visitorChildQty,
        });
      }

      const newTicket: TransactionTicket = {
        id: ticketId,
        qrPayload,
        destination: 'Taman Wisata Alam Telaga Lestari',
        createdAt: timestamp,
        items,
        totalVisitors: visitorAdultQty + visitorChildQty,
        parking:
          vehicle !== 'none'
            ? {
                enabled: true,
                vehicleType: vehicle,
                vehicleLabel: vehicleRates[vehicle].label,
                licensePlate: plateNumber.toUpperCase().trim(),
                fee: parkingFee,
                entryTime: timestamp,
              }
            : null,
        subtotal: grandTotal,
        discount: 0,
        totalAmount: grandTotal,
        paymentMethod,
        loyaltyEarned: Math.round(grandTotal / 5000),
        status: 'active',
        deviceSource: 'handheld_pos',
      };

      onIssueTicket(newTicket);
      setIsPrinting(false);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="text-center mb-4">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
          MODE TERMINAL GENGGAM POS (SUNMI / SMART POS)
        </span>
        <h2 className="text-xl font-bold text-white mt-1">Cetak Cepat Juru Parkir & Loket Lapangan</h2>
        <p className="text-xs text-slate-400">
          Simulasi perangkat mobile POS oranye seperti di gambar untuk penerbitan tiket kilat di gerbang masuk.
        </p>
      </div>

      {/* POS Device Body Shell (Orange Industrial Casing matching user image!) */}
      <div className="w-full max-w-sm bg-gradient-to-b from-[#f97316] via-[#ea580c] to-[#c2410c] rounded-3xl p-3 shadow-2xl border-4 border-neutral-900 relative">
        {/* Thermal Printer Paper Roll Compartment at Top */}
        <div className="w-full h-14 bg-neutral-900 rounded-2xl mb-2 p-2 flex items-center justify-between border-b-2 border-neutral-700 shadow-inner">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-300">
              THERMAL ROLL: 58MM READY
            </span>
          </div>
          <span className="text-[9px] text-amber-400 font-bold px-1.5 py-0.5 bg-neutral-800 rounded">
            TIXBOOTH OS
          </span>
        </div>

        {/* Paper Slot Mouth */}
        <div className="w-3/4 mx-auto h-1.5 bg-black rounded-full mb-2 shadow-inner" />

        {/* High-Resolution Screen Glass */}
        <div className="w-full bg-slate-900 rounded-2xl p-4 text-white shadow-inner border border-slate-700 space-y-3.5">
          {/* Top Bar of Handheld OS */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-emerald-400">TIXBOOTH PORTABLE</span>
            <span className="font-mono">BATTERY: 98% ⚡</span>
          </div>

          {/* Quick Vehicle Select */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Pilih Jenis Kendaraan
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { type: 'motor' as VehicleType, icon: Bike, label: 'Motor' },
                { type: 'mobil' as VehicleType, icon: Car, label: 'Mobil' },
                { type: 'bus' as VehicleType, icon: Bus, label: 'Bus' },
                { type: 'none' as VehicleType, icon: Ticket, label: 'Pejalan' },
              ].map((item) => {
                const Icon = item.icon;
                const isCur = vehicle === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setVehicle(item.type)}
                    className={`py-2 px-1 rounded-lg text-center flex flex-col items-center gap-1 transition-colors cursor-pointer border ${
                      isCur
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* License Plate Input */}
          {vehicle !== 'none' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Plat Nomor Kendaraan
              </label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="Contoh: B 1234 ABC"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-center tracking-wider text-sm focus:outline-hidden focus:border-amber-400"
              />
            </div>
          )}

          {/* Stepper for Tourist Visitors */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">Pengunjung Dewasa (Rp 50k):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisitorAdultQty(Math.max(0, visitorAdultQty - 1))}
                  className="w-6 h-6 bg-slate-800 rounded text-slate-300 text-xs font-bold"
                >
                  -
                </button>
                <span className="font-mono font-bold w-4 text-center">{visitorAdultQty}</span>
                <button
                  type="button"
                  onClick={() => setVisitorAdultQty(visitorAdultQty + 1)}
                  className="w-6 h-6 bg-emerald-600 rounded text-white text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">Pengunjung Anak (Rp 25k):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisitorChildQty(Math.max(0, visitorChildQty - 1))}
                  className="w-6 h-6 bg-slate-800 rounded text-slate-300 text-xs font-bold"
                >
                  -
                </button>
                <span className="font-mono font-bold w-4 text-center">{visitorChildQty}</span>
                <button
                  type="button"
                  onClick={() => setVisitorChildQty(visitorChildQty + 1)}
                  className="w-6 h-6 bg-emerald-600 rounded text-white text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Payment Toggle */}
          <div className="flex gap-2 text-xs">
            {(['cash', 'qris', 'emoney'] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 py-1.5 rounded uppercase font-bold text-[10px] border transition-colors cursor-pointer ${
                  paymentMethod === m
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Total Display */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-mono-numbers">
            <span className="text-xs text-slate-400">Total Tagihan:</span>
            <span className="text-base font-extrabold text-emerald-400">
              Rp {grandTotal.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Big Print Ticket Button */}
          <button
            type="button"
            onClick={handlePrintSlip}
            disabled={isPrinting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{isPrinting ? 'Mencetak Slip Thermal...' : 'Cetak Tiket Langsung (Print)'}</span>
          </button>
        </div>

        {/* Bottom Hardware Bezel Button */}
        <div className="w-10 h-3 bg-neutral-900 rounded-full mx-auto mt-2 shadow-xs" />
      </div>
    </div>
  );
};
