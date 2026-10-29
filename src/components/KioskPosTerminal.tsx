import React, { useState } from 'react';
import { TicketCategory, VehicleType, PaymentMethod, TransactionTicket, Voucher } from '../types';
import { QrCodeDisplay } from '../utils/qrGenerator';
import { sounds } from '../utils/audioHelper';
import { 
  Plus, Minus, Car, Bike, Bus, Ticket as TicketIcon, 
  CreditCard, Banknote, QrCode, Sparkles, AlertCircle, 
  ChevronRight, Check, ShieldCheck 
} from 'lucide-react';

interface KioskPosTerminalProps {
  onIssueTicket: (ticket: TransactionTicket) => void;
  loyaltyPoints: number;
  onRedeemVoucher: (voucher: Voucher) => void;
  activeVouchers: Voucher[];
  appliedVoucher: Voucher | null;
  onApplyVoucher: (v: Voucher | null) => void;
}

const TICKET_PRODUCTS = [
  {
    id: 'dewasa' as TicketCategory,
    name: 'Tiket Masuk Reguler (Dewasa)',
    shortName: 'Taman Wisata Dewasa',
    price: 50000,
    description: 'Akses penuh seluruh area wisata alam, spot foto danau & jembatan kanopi',
    badge: 'Paling Populer',
    image: '/src/assets/images/taman_wisata_nature_1792307199289.jpg',
  },
  {
    id: 'anak' as TicketCategory,
    name: 'Tiket Masuk Anak-anak',
    shortName: 'Taman Wisata Anak',
    price: 25000,
    description: 'Usia 3 - 10 tahun (gratis di bawah usia 3 tahun), wahana bermain ramah anak',
    badge: 'Diskon 50%',
    image: '/src/assets/images/taman_wisata_nature_1792307199289.jpg',
  },
  {
    id: 'terusan' as TicketCategory,
    name: 'Paket Terusan Wisata & Wahana Danau',
    shortName: 'Paket Terusan All-in',
    price: 75000,
    description: 'Termasuk tiket masuk + 1x wahana perahu kano & jembatan gantung pinus',
    badge: 'Hemat Rp 20.000',
    image: '/src/assets/images/taman_wisata_nature_1792307199289.jpg',
  },
  {
    id: 'mancanegara' as TicketCategory,
    name: 'Tiket Wisatawan Mancanegara',
    shortName: 'Foreign Tourist Pass',
    price: 100000,
    description: 'Akses wisata lengkap termasuk welcome drink & peta panduan bahasa Inggris',
    badge: 'International',
    image: '/src/assets/images/taman_wisata_nature_1792307199289.jpg',
  },
];

const PARKING_OPTIONS = [
  {
    type: 'motor' as VehicleType,
    label: 'Sepeda Motor',
    price: 5000,
    icon: Bike,
    desc: 'Tarif flat kunjungan wisata',
  },
  {
    type: 'mobil' as VehicleType,
    label: 'Mobil Pribadi',
    price: 10000,
    icon: Car,
    desc: 'Tarif flat kunjungan wisata',
  },
  {
    type: 'bus' as VehicleType,
    label: 'Bus / Pariwisata',
    price: 25000,
    icon: Bus,
    desc: 'Termasuk akses dropping zone',
  },
];

export const KioskPosTerminal: React.FC<KioskPosTerminalProps> = ({
  onIssueTicket,
  loyaltyPoints,
  activeVouchers,
  appliedVoucher,
  onApplyVoucher,
}) => {
  // State for quantities
  const [ticketQtys, setTicketQtys] = useState<Record<TicketCategory, number>>({
    dewasa: 1, // default 1 as seen in photo
    anak: 0,
    terusan: 0,
    mancanegara: 0,
  });

  // Parking Integration state
  const [includeParking, setIncludeParking] = useState<boolean>(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('mobil');
  const [licensePlate, setLicensePlate] = useState<string>('B 1404 MSM');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [cashAmount, setCashAmount] = useState<number>(100000);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);
  const [showQrisPrompt, setShowQrisPrompt] = useState<boolean>(false);

  // Calculate totals
  const totalVisitors = Object.values(ticketQtys).reduce((a, b) => a + b, 0);

  const visitorSubtotal = TICKET_PRODUCTS.reduce((sum, item) => {
    return sum + (ticketQtys[item.id] || 0) * item.price;
  }, 0);

  const parkingItem = PARKING_OPTIONS.find((p) => p.type === selectedVehicle);
  const parkingFee = includeParking && parkingItem ? parkingItem.price : 0;

  const rawSubtotal = visitorSubtotal + parkingFee;
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  const updateQty = (id: TicketCategory, delta: number) => {
    setTicketQtys((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleCheckout = () => {
    if (totalVisitors === 0 && !includeParking) {
      alert('Silakan pilih minimal 1 tiket wisata atau tiket parkir');
      return;
    }

    if (includeParking && (!licensePlate || licensePlate.trim().length < 3)) {
      alert('Silakan masukkan nomor plat kendaraan untuk tiket parkir');
      return;
    }

    if (paymentMethod === 'cash' && cashAmount < finalTotal) {
      alert('Nominal uang tunai kurang dari total tagihan');
      return;
    }

    setIsProcessing(true);
    sounds.playScanBeep();

    setTimeout(() => {
      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `TIX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;
      
      // QR Payload structured for gate scanning
      const qrPayload = `TIXBOOTH:${ticketId}:TW${totalVisitors}:${includeParking ? licensePlate.replace(/\s+/g, '') : 'NOPK'}`;

      const purchasedItems = TICKET_PRODUCTS.filter((item) => (ticketQtys[item.id] || 0) > 0).map(
        (item) => ({
          id: item.id,
          name: item.shortName,
          price: item.price,
          qty: ticketQtys[item.id],
        })
      );

      const newTicket: TransactionTicket = {
        id: ticketId,
        qrPayload,
        destination: 'Taman Wisata Alam Telaga Lestari',
        createdAt: timestamp,
        items: purchasedItems,
        totalVisitors,
        parking: includeParking && parkingItem
          ? {
              enabled: true,
              vehicleType: selectedVehicle,
              vehicleLabel: parkingItem.label,
              licensePlate: licensePlate.toUpperCase().trim(),
              fee: parkingItem.price,
              entryTime: timestamp,
            }
          : null,
        subtotal: rawSubtotal,
        discount: discountAmount,
        voucherCode: appliedVoucher?.code,
        totalAmount: finalTotal,
        paymentMethod,
        cashPaid: paymentMethod === 'cash' ? cashAmount : undefined,
        change: paymentMethod === 'cash' ? Math.max(0, cashAmount - finalTotal) : undefined,
        loyaltyEarned: Math.round(finalTotal / 5000), // e.g. 20 points
        status: 'active',
        deviceSource: 'kiosk',
      };

      onIssueTicket(newTicket);
      setIsProcessing(false);
      setShowQrisPrompt(false);
    }, 700);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Main Ticket Products & Parking Options (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Destination Header Banner (Inspired by Totem Display & Kiosk) */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  TIXBOOTH KIOSK v2.4
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400 font-mono-numbers">LOKET MANDIRI 01</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Beli Tiket Masuk Destinasi Wisata
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih jumlah tiket pengunjung & tiket parkir terpadu dalam satu struk QR.
              </p>
            </div>

            {/* Loyalty Point Quick Widget (From uploaded image) */}
            <div className="w-full sm:w-auto bg-slate-900/90 border border-slate-700 rounded-lg p-3 flex items-center justify-between gap-4 shrink-0">
              <div>
                <p className="text-[11px] uppercase font-semibold text-slate-400">Loyalty Point</p>
                <p className="text-xl font-extrabold font-mono-numbers text-amber-400">
                  {loyaltyPoints}
                </p>
                <p className="text-[10px] text-slate-400">Member: #MSM-994</p>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{appliedVoucher ? 'Voucher Aktif' : 'Tukar Voucher'}</span>
                </button>
                {appliedVoucher && (
                  <span className="text-[10px] text-emerald-400 font-mono-numbers">
                    Hemat Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: WISATA ENTRANCE TICKETS (Prominent cards like in the photo) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-emerald-400" />
              <span>1. Kategori Tiket Pengunjung</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono-numbers">
              Terpilih: {totalVisitors} tiket
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TICKET_PRODUCTS.map((ticket) => {
              const qty = ticketQtys[ticket.id] || 0;
              const isSelected = qty > 0;

              return (
                <div
                  key={ticket.id}
                  className={`bg-slate-800/80 rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500/70 ring-1 ring-emerald-500/30 bg-slate-800'
                      : 'border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  {/* Top Image & Badge */}
                  <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={ticket.image}
                      alt={ticket.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {ticket.badge}
                    </span>
                    <div className="absolute bottom-2 left-3 right-3 flex items-baseline justify-between">
                      <span className="text-xs text-slate-300 font-medium">{ticket.shortName}</span>
                      <span className="text-base font-extrabold font-mono-numbers text-white">
                        Rp {ticket.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {ticket.description}
                    </p>

                    {/* Quantity Selector Stepper */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                      <span className="text-xs text-slate-400">Jumlah:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(ticket.id, -1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono-numbers font-bold text-sm text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(ticket.id, 1)}
                          className="w-7 h-7 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: INTEGRATED PARKING (MSM PARKING) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>2. Integrasi MSM Parking (Palang Gerbang)</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                    Otomatis
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Satukan tiket kendaraan ke dalam kode QR tiket wisata untuk akses keluar masuk palang otomatis.
                </p>
              </div>
            </div>

            {/* Toggle parking inclusion */}
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={includeParking}
                onChange={(e) => setIncludeParking(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-600 focus:ring-emerald-500"
              />
              <span className={includeParking ? 'text-emerald-400' : 'text-slate-400'}>
                {includeParking ? 'Parkir Disertakan' : 'Tanpa Parkir (Pejalan Kaki)'}
              </span>
            </label>
          </div>

          {includeParking && (
            <div className="space-y-4">
              {/* Vehicle Type Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PARKING_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const isCur = selectedVehicle === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedVehicle(item.type)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isCur
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                          : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isCur ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-mono-numbers font-bold text-white">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-200">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* License Plate Input */}
              <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-700/80 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nomor Plat Kendaraan (Untuk Sensor Palang Gerbang)
                  </label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="Contoh: B 1234 XYZ / D 5678 KL"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono font-bold tracking-wider text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div className="text-[11px] text-slate-400 sm:max-w-xs leading-relaxed">
                  <span className="text-amber-400 font-semibold">Sensor ANPR & Barcode:</span> Tiket akan
                  dicetak dengan nomor plat untuk pencocokan barrier gate saat tap keluar.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Order Summary, Payment & Print Slip (4 cols) */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-slate-800/90 border border-slate-700/90 rounded-xl p-5 sticky top-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Ringkasan Pembayaran
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono-numbers bg-emerald-500/10 px-2 py-0.5 rounded">
              LOKET AKTIF
            </span>
          </div>

          {/* Item Breakdown */}
          <div className="py-3.5 space-y-2 border-b border-slate-700/60 text-xs">
            {TICKET_PRODUCTS.filter((t) => (ticketQtys[t.id] || 0) > 0).map((t) => (
              <div key={t.id} className="flex justify-between items-center text-slate-300">
                <span className="truncate pr-2">
                  {t.shortName} <span className="text-slate-500 font-mono">×{ticketQtys[t.id]}</span>
                </span>
                <span className="font-mono-numbers font-medium shrink-0">
                  Rp {((ticketQtys[t.id] || 0) * t.price).toLocaleString('id-ID')}
                </span>
              </div>
            ))}

            {totalVisitors === 0 && (
              <p className="text-xs text-slate-500 italic py-1">Belum ada tiket wisata dipilih</p>
            )}

            {includeParking && parkingItem && (
              <div className="flex justify-between items-center text-amber-300 pt-1 border-t border-slate-700/40">
                <span className="truncate pr-2">
                  Parkir {parkingItem.label} ({licensePlate || '-'})
                </span>
                <span className="font-mono-numbers font-medium shrink-0">
                  Rp {parkingItem.price.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {appliedVoucher && (
              <div className="flex justify-between items-center text-emerald-400 pt-1">
                <span>Diskon ({appliedVoucher.code})</span>
                <span className="font-mono-numbers font-semibold">
                  -Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {/* Subtotal & Total */}
          <div className="py-3 space-y-1.5 border-b border-slate-700/60 font-mono-numbers">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal:</span>
              <span>Rp {rawSubtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-white pt-1">
              <span>TOTAL TAGIHAN:</span>
              <span className="text-emerald-400">Rp {finalTotal.toLocaleString('id-ID')}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Termasuk asuransi Jasa Raharja wisata & pajak daerah 10%.
            </p>
          </div>

          {/* Payment Method Selector */}
          <div className="py-3.5 space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                  paymentMethod === 'qris'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('emoney')}
                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                  paymentMethod === 'emoney'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Tap Card</span>
              </button>
            </div>

            {/* If Cash: Quick denomination inputs */}
            {paymentMethod === 'cash' && (
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Nominal Diterima:</span>
                  <input
                    type="number"
                    step="5000"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono font-bold text-white text-xs"
                  />
                </div>
                <div className="flex gap-1.5 justify-end">
                  {[50000, 100000, 150000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashAmount(amt)}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono"
                    >
                      {amt / 1000}k
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashAmount(finalTotal)}
                    className="px-1.5 py-0.5 text-[10px] bg-emerald-800/60 hover:bg-emerald-700 rounded text-emerald-200 font-medium"
                  >
                    Pas
                  </button>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-800 font-mono-numbers">
                  <span className="text-slate-400">Kembalian:</span>
                  <span className={`font-bold ${cashAmount >= finalTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Rp {Math.max(0, cashAmount - finalTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* If QRIS: Prompt with Simulated Scan */}
            {paymentMethod === 'qris' && (
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/80 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>QRIS Terintegrasi (BCA, Mandiri, GoPay, Dana)</span>
                </div>
                <div className="flex justify-center my-1">
                  <QrCodeDisplay value={`QRIS:TIXBOOTH:TOTAL:${finalTotal}`} size={100} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Arahkan kamera e-wallet / mobile banking untuk membayar
                </p>
              </div>
            )}
          </div>

          {/* Checkout & Print Button */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isProcessing || (totalVisitors === 0 && !includeParking)}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <span>Memproses & Mencetak Struk...</span>
            ) : (
              <>
                <TicketIcon className="w-4 h-4" />
                <span>Bayar & Terbitkan Tiket</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Tukar Voucher Loyalty Point</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="py-3">
              <p className="text-xs text-slate-300 mb-3">
                Poin Anda: <span className="font-bold text-amber-400">{loyaltyPoints} Poin</span>.
                Gunakan untuk klaim potongan harga tiket wisata atau parkir gratis:
              </p>

              <div className="space-y-2.5">
                {activeVouchers.map((voucher) => {
                  const isApplied = appliedVoucher?.code === voucher.code;
                  const canRedeem = loyaltyPoints >= voucher.pointCost;

                  return (
                    <div
                      key={voucher.code}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                        isApplied
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-900/70'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{voucher.title}</p>
                        <p className="text-[11px] text-emerald-400 font-mono-numbers">
                          Potongan Rp {voucher.discountAmount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400">Biaya: {voucher.pointCost} Poin</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isApplied) {
                            onApplyVoucher(null);
                          } else {
                            onApplyVoucher(voucher);
                          }
                          setShowVoucherModal(false);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                          isApplied
                            ? 'bg-rose-900/40 text-rose-300 hover:bg-rose-900/60'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isApplied ? 'Lepas' : 'Pakai'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
