import React, { useState, useEffect } from 'react';
import { TransactionTicket, ParkingCapacity, Voucher } from './types';
import { KioskPosTerminal } from './components/KioskPosTerminal';
import { GateScannerSimulation } from './components/GateScannerSimulation';
import { HandheldPosView } from './components/HandheldPosView';
import { AdminReportDashboard } from './components/AdminReportDashboard';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { 
  Ticket as TicketIcon, ScanLine, Smartphone, 
  BarChart3, Bell, Check, Sparkles, ShieldCheck, 
  ExternalLink, Printer 
} from 'lucide-react';

const INITIAL_VOUCHERS: Voucher[] = [
  {
    code: 'VOUCHERWISATA10',
    title: 'Diskon Kunjungan Wisata Rp 10.000',
    discountAmount: 10000,
    minSpend: 50000,
    pointCost: 100,
  },
  {
    code: 'PARKIRGRATIS',
    title: 'Voucher Parkir Kendaraan Gratis',
    discountAmount: 10000,
    minSpend: 20000,
    pointCost: 80,
  },
  {
    code: 'FAMILYPROMO',
    title: 'Promo Paket Liburan Rombongan',
    discountAmount: 25000,
    minSpend: 150000,
    pointCost: 200,
  },
];

const INITIAL_TICKETS: TransactionTicket[] = [
  {
    id: 'TIX-20261018-9104',
    qrPayload: 'TIXBOOTH:TIX-20261018-9104:TW2:B1404MSM',
    destination: 'Taman Wisata Alam Telaga Lestari',
    createdAt: Date.now() - 1000 * 60 * 25,
    items: [
      { id: 'dewasa', name: 'Taman Wisata Dewasa', price: 50000, qty: 2 },
    ],
    totalVisitors: 2,
    parking: {
      enabled: true,
      vehicleType: 'mobil',
      vehicleLabel: 'Mobil Pribadi',
      licensePlate: 'B 1404 MSM',
      fee: 10000,
      entryTime: Date.now() - 1000 * 60 * 25,
    },
    subtotal: 110000,
    discount: 0,
    totalAmount: 110000,
    paymentMethod: 'qris',
    loyaltyEarned: 22,
    status: 'active',
    deviceSource: 'kiosk',
  },
  {
    id: 'TIX-20261018-8422',
    qrPayload: 'TIXBOOTH:TIX-20261018-8422:TW4:D9981KA',
    destination: 'Taman Wisata Alam Telaga Lestari',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    items: [
      { id: 'dewasa', name: 'Taman Wisata Dewasa', price: 50000, qty: 2 },
      { id: 'anak', name: 'Taman Wisata Anak', price: 25000, qty: 2 },
    ],
    totalVisitors: 4,
    parking: {
      enabled: true,
      vehicleType: 'mobil',
      vehicleLabel: 'Mobil Pribadi',
      licensePlate: 'D 9981 KA',
      fee: 10000,
      entryTime: Date.now() - 1000 * 60 * 60 * 2,
    },
    subtotal: 160000,
    discount: 10000,
    voucherCode: 'VOUCHERWISATA10',
    totalAmount: 150000,
    paymentMethod: 'cash',
    cashPaid: 150000,
    change: 0,
    loyaltyEarned: 30,
    status: 'used',
    checkInTime: Date.now() - 1000 * 60 * 45,
    deviceSource: 'loket',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'kiosk' | 'scanner' | 'handheld' | 'admin'>('kiosk');

  // Stored state
  const [tickets, setTickets] = useState<TransactionTicket[]>(() => {
    try {
      const saved = localStorage.getItem('tixbooth_tickets');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TICKETS;
  });

  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tixbooth_loyalty');
      if (saved) return Number(saved);
    } catch {
      // ignore
    }
    return 200; // Matches 200 in the user's uploaded photo!
  });

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<TransactionTicket | null>(null);
  const [prefilledGateTicketId, setPrefilledGateTicketId] = useState<string | null>(null);

  // Notification bar state (matching the notification prompt from the user image)
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  // Parking capacity tracking
  const parkingCapacity: ParkingCapacity = {
    motorTotal: 60,
    motorOccupied: tickets.filter(
      (t) => t.parking?.enabled && t.parking.vehicleType === 'motor' && t.status !== 'checked_out'
    ).length + 8,
    mobilTotal: 40,
    mobilOccupied: tickets.filter(
      (t) => t.parking?.enabled && t.parking.vehicleType === 'mobil' && t.status !== 'checked_out'
    ).length + 14,
    busTotal: 10,
    busOccupied: tickets.filter(
      (t) => t.parking?.enabled && t.parking.vehicleType === 'bus' && t.status !== 'checked_out'
    ).length + 2,
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('tixbooth_tickets', JSON.stringify(tickets));
    } catch {
      // ignore
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem('tixbooth_loyalty', String(loyaltyPoints));
    } catch {
      // ignore
    }
  }, [loyaltyPoints]);

  const handleIssueTicket = (newTicket: TransactionTicket) => {
    setTickets((prev) => [newTicket, ...prev]);

    // Deduct voucher points if used
    if (appliedVoucher) {
      setLoyaltyPoints((prev) => Math.max(0, prev - appliedVoucher.pointCost));
      setAppliedVoucher(null);
    }

    // Add earned points
    setLoyaltyPoints((prev) => prev + newTicket.loyaltyEarned);

    // Show thermal slip modal
    setActiveReceipt(newTicket);
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: 'used' | 'checked_out') => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: newStatus,
            checkInTime: newStatus === 'used' ? Date.now() : t.checkInTime,
            checkOutTime: newStatus === 'checked_out' ? Date.now() : t.checkOutTime,
          };
        }
        return t;
      })
    );
  };

  const handleResetData = () => {
    if (confirm('Reset ulang data tiket ke pengaturan awal demo?')) {
      setTickets(INITIAL_TICKETS);
      setLoyaltyPoints(200);
      setAppliedVoucher(null);
    }
  };

  const handleNavigateToGate = (ticketId: string) => {
    setPrefilledGateTicketId(ticketId);
    setActiveTab('scanner');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. TOP BAR (Strict 3-Zone Contract: Brand — 4 Nav links — 1 Action) */}
      <header className="no-print bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8 sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-sm shadow-md">
            T
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0">
            TIXBOOTH <span className="text-amber-400 font-medium">×</span> MSM PARKING
          </span>
        </div>

        {/* Zone 2: 4 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('kiosk')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'kiosk' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            Beli Tiket Kiosk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'scanner' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            Palang & Gate Scanner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('handheld')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'handheld' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            POS Genggam (Portable)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'admin' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            Laporan & Rekap
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (tickets.length > 0) {
                setActiveReceipt(tickets[0]);
              } else {
                setActiveTab('kiosk');
              }
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk Terakhir</span>
          </button>
        </div>
      </header>

      {/* 2. NOTIFICATION BANNER (Directly inspired by bottom prompt in uploaded image: "Aktifkan notifikasi MSM Parking?") */}
      {showNotificationBanner && (
        <div className="no-print bg-gradient-to-r from-red-600 via-rose-700 to-amber-700 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-900/90 flex items-center justify-center text-amber-400 shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white">Aktifkan notifikasi MSM Parking & Destinasi Wisata?</span>
              <span className="hidden sm:inline text-rose-100 ml-1.5">
                Dapatkan pemberitahuan ketersediaan slot parkir real-time dan voucher promo tiket masuk.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setNotificationsEnabled(true);
                setShowNotificationBanner(false);
              }}
              className="px-2.5 py-1 bg-white text-rose-900 font-bold text-[11px] rounded shadow-xs hover:bg-rose-50 cursor-pointer transition-colors"
            >
              {notificationsEnabled ? 'Aktif' : 'Izinkan Notifikasi'}
            </button>
            <button
              type="button"
              onClick={() => setShowNotificationBanner(false)}
              className="text-rose-200 hover:text-white text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. MOBILE NAVIGATION TABS (Visible on smaller viewports) */}
      <div className="no-print md:hidden bg-slate-900 border-b border-slate-800 p-2 flex overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('kiosk')}
          className={`flex-1 min-w-[85px] py-1.5 px-2 text-center text-xs font-semibold rounded ${
            activeTab === 'kiosk' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          Kiosk Wisata
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 min-w-[85px] py-1.5 px-2 text-center text-xs font-semibold rounded ${
            activeTab === 'scanner' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          Gate Scanner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('handheld')}
          className={`flex-1 min-w-[85px] py-1.5 px-2 text-center text-xs font-semibold rounded ${
            activeTab === 'handheld' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          POS Handheld
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex-1 min-w-[85px] py-1.5 px-2 text-center text-xs font-semibold rounded ${
            activeTab === 'admin' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          Laporan Rekap
        </button>
      </div>

      {/* 4. MAIN CONTENT VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'kiosk' && (
          <KioskPosTerminal
            onIssueTicket={handleIssueTicket}
            loyaltyPoints={loyaltyPoints}
            activeVouchers={INITIAL_VOUCHERS}
            appliedVoucher={appliedVoucher}
            onApplyVoucher={setAppliedVoucher}
            onRedeemVoucher={(v) => {
              setAppliedVoucher(v);
            }}
          />
        )}

        {activeTab === 'scanner' && (
          <GateScannerSimulation
            tickets={tickets}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            targetTicketId={prefilledGateTicketId}
          />
        )}

        {activeTab === 'handheld' && (
          <HandheldPosView
            onIssueTicket={handleIssueTicket}
            recentTickets={tickets}
          />
        )}

        {activeTab === 'admin' && (
          <AdminReportDashboard
            tickets={tickets}
            parkingCapacity={parkingCapacity}
            onViewReceipt={(ticket) => setActiveReceipt(ticket)}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* 5. THERMAL PRINTER RECEIPT MODAL */}
      {activeReceipt && (
        <ThermalReceiptModal
          ticket={activeReceipt}
          onClose={() => setActiveReceipt(null)}
          onNavigateToGate={handleNavigateToGate}
        />
      )}

      {/* 6. CLEAN FOOTER */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          TixBooth Smart Integrated Ticketing & MSM Parking Barrier Management · Solusi Terintegrasi Wisata & Parkir Digital
        </p>
      </footer>
    </div>
  );
}
