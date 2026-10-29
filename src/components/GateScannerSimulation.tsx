import React, { useState, useEffect, useRef } from 'react';
import { TransactionTicket } from '../types';
import { sounds } from '../utils/audioHelper';
import { 
  ScanLine, CheckCircle2, XCircle, ArrowUpRight, 
  Car, Users, Camera, ShieldCheck, RefreshCw, KeyRound 
} from 'lucide-react';

interface GateScannerSimulationProps {
  tickets: TransactionTicket[];
  onUpdateTicketStatus: (ticketId: string, newStatus: 'used' | 'checked_out') => void;
  targetTicketId?: string | null;
}

export const GateScannerSimulation: React.FC<GateScannerSimulationProps> = ({
  tickets,
  onUpdateTicketStatus,
  targetTicketId,
}) => {
  const [selectedGate, setSelectedGate] = useState<'turnstile' | 'parking_in' | 'parking_out'>('turnstile');
  const [inputCode, setInputCode] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    ticket?: TransactionTicket;
    details?: string;
  } | null>(null);

  const [isGateOpen, setIsGateOpen] = useState<boolean>(false);
  const [useCamera, setUseCamera] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // If redirected with targetTicketId, pre-fill it!
  useEffect(() => {
    if (targetTicketId) {
      const match = tickets.find((t) => t.id === targetTicketId);
      if (match) {
        setInputCode(match.id);
      }
    }
  }, [targetTicketId, tickets]);

  // Handle Camera toggling
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useCamera) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          alert('Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan metode input manual.');
          setUseCamera(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useCamera]);

  const handleScan = (codeToScan?: string) => {
    const rawCode = (codeToScan || inputCode).trim().toUpperCase();
    if (!rawCode) return;

    sounds.playScanBeep();

    // Find ticket by ID or QR code payload match
    const matched = tickets.find(
      (t) =>
        t.id.toUpperCase() === rawCode ||
        t.qrPayload.toUpperCase().includes(rawCode) ||
        (t.parking && t.parking.licensePlate.replace(/\s+/g, '').toUpperCase() === rawCode.replace(/\s+/g, ''))
    );

    if (!matched) {
      sounds.playErrorBuzz();
      setScanResult({
        success: false,
        message: 'Tiket Tidak Dikenali!',
        details: 'Kode QR atau ID tiket tidak terdaftar dalam database sistem.',
      });
      return;
    }

    // Gate rules
    if (selectedGate === 'turnstile') {
      // Wisata Entrance
      if (matched.status === 'used') {
        sounds.playErrorBuzz();
        setScanResult({
          success: false,
          message: 'Akses Ditolak: Tiket Sudah Digunakan!',
          ticket: matched,
          details: `Tiket ini telah di-scan masuk pada ${matched.checkInTime ? new Date(matched.checkInTime).toLocaleTimeString('id-ID') : 'sebelumnya'}.`,
        });
        return;
      }

      // Valid Entrance
      sounds.playGateOpen();
      setIsGateOpen(true);
      onUpdateTicketStatus(matched.id, 'used');
      setScanResult({
        success: true,
        message: 'Akses Diberikan: Selamat Datang!',
        ticket: matched,
        details: `${matched.totalVisitors} Pengunjung diizinkan masuk ke area wisata.`,
      });

      // Auto close barrier after 3.5 seconds
      setTimeout(() => {
        setIsGateOpen(false);
      }, 3500);
    } else if (selectedGate === 'parking_in') {
      // Parking Entrance
      if (!matched.parking || !matched.parking.enabled) {
        sounds.playErrorBuzz();
        setScanResult({
          success: false,
          message: 'Tiket Ini Tidak Memiliki Izin Parkir Kendaraan!',
          ticket: matched,
          details: 'Hanya tiket pejalan kaki yang terdaftar.',
        });
        return;
      }

      sounds.playGateOpen();
      setIsGateOpen(true);
      setScanResult({
        success: true,
        message: 'Palang Parkir Terbuka: Kendaraan Masuk',
        ticket: matched,
        details: `Plat ${matched.parking.licensePlate} (${matched.parking.vehicleLabel}) valid. Silakan parkir di area yang tersedia.`,
      });

      setTimeout(() => {
        setIsGateOpen(false);
      }, 3500);
    } else {
      // Parking Exit
      if (!matched.parking || !matched.parking.enabled) {
        sounds.playErrorBuzz();
        setScanResult({
          success: false,
          message: 'Bukan Tiket Parkir!',
          ticket: matched,
        });
        return;
      }

      if (matched.status === 'checked_out') {
        sounds.playErrorBuzz();
        setScanResult({
          success: false,
          message: 'Kendaraan Sudah Checkout Sebelumnya!',
          ticket: matched,
        });
        return;
      }

      sounds.playGateOpen();
      setIsGateOpen(true);
      onUpdateTicketStatus(matched.id, 'checked_out');
      setScanResult({
        success: true,
        message: 'Akses Keluar Diberikan: Terima Kasih!',
        ticket: matched,
        details: `Plat ${matched.parking.licensePlate} telah menyelesaikan kunjungan wisata. Palang keluar terbuka.`,
      });

      setTimeout(() => {
        setIsGateOpen(false);
      }, 3500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Gate Hardware Simulation & Graphic (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        {/* Gate Selection Tabs */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedGate('turnstile');
              setScanResult(null);
            }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedGate === 'turnstile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pintu Masuk Wisata</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedGate('parking_in');
              setScanResult(null);
            }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedGate === 'parking_in'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Palang Parkir Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedGate('parking_out');
              setScanResult(null);
            }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedGate === 'parking_out'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Palang Parkir Keluar</span>
          </button>
        </div>

        {/* PHYSICAL BARRIER GATE / TURNSTILE DISPLAY CONTAINER */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-wider text-emerald-400">
                MSM AUTOMATIC BARRIER v3.0
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-mono text-slate-400">
                LOKASI: {selectedGate === 'turnstile' ? 'GATE-TURNSTILE-01' : 'BOOTH-BARRIER-PARK'}
              </span>
            </div>

            {/* LED Status Lamp */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isGateOpen ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                }`}
              />
              <span className="text-[11px] font-mono-numbers font-bold text-slate-300">
                {isGateOpen ? 'OPEN (TERBUKA)' : 'CLOSED (TERKUNCI)'}
              </span>
            </div>
          </div>

          {/* Graphical Barrier Arm & Pedestal Simulation */}
          <div className="h-48 w-full bg-radial from-slate-900 to-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-center relative overflow-hidden">
            {/* Road / Gate Lane Lines */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-slate-900/90 border-t border-slate-800 flex justify-around items-center">
              <span className="text-[10px] text-slate-600 tracking-widest font-mono">
                === JALUR MASUK / EXIT LANE ===
              </span>
            </div>

            {/* Pedestal Housing (Industrial Housing) */}
            <div className="absolute left-12 bottom-6 w-16 h-28 bg-gradient-to-b from-amber-500 to-amber-700 rounded-t-lg shadow-xl border border-amber-400/40 flex flex-col items-center justify-between p-1.5">
              <div className="w-10 h-3 bg-slate-900 rounded-xs flex items-center justify-center">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isGateOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`}
                />
              </div>
              <span className="text-[8px] font-black text-slate-900 tracking-tighter">MSM GATE</span>
              <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700" />
            </div>

            {/* Barrier Gate Arm (Animated pivot rotation!) */}
            <div
              className="absolute left-20 bottom-24 h-4 rounded-r-md origin-left transition-transform duration-700 ease-in-out shadow-lg"
              style={{
                width: '65%',
                transform: isGateOpen ? 'rotate(-75deg)' : 'rotate(0deg)',
                backgroundImage:
                  'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 20px, #1e293b 20px, #1e293b 40px, #ef4444 40px, #ef4444 60px)',
              }}
            >
              {/* LED Strip on Barrier Arm */}
              <div
                className={`h-1 w-full mt-1.5 ${
                  isGateOpen ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                }`}
              />
            </div>

            {/* Center LCD Info Screen */}
            <div className="absolute top-4 bg-slate-900/90 border border-slate-700/80 rounded-md px-4 py-2 text-center max-w-sm">
              <p className="text-[10px] text-emerald-400 font-mono tracking-wider">
                {isGateOpen ? '>>> AKSES DIIZINKAN - SILAKAN LEWAT <<<' : 'TEMPELKAN QR CODE / STRUK TIKET'}
              </p>
              <p className="text-xs font-bold text-white mt-0.5">
                {scanResult?.message || 'Menunggu Scan Tiket...'}
              </p>
            </div>
          </div>

          {/* Gate Feedback Alert */}
          {scanResult && (
            <div
              className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
                scanResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm text-white">{scanResult.message}</p>
                {scanResult.details && <p className="mt-1 text-slate-300">{scanResult.details}</p>}
                {scanResult.ticket && (
                  <div className="mt-2 text-[11px] font-mono-numbers text-slate-400 bg-slate-900/70 p-2 rounded border border-slate-800">
                    ID Tiket: {scanResult.ticket.id} · Total Pengunjung: {scanResult.ticket.totalVisitors}
                    {scanResult.ticket.parking && ` · Plat: ${scanResult.ticket.parking.licensePlate}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Scanner Control & Quick Ticket Testing (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {/* Scanner Control Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-emerald-400" />
              <span>Pemindai Tiket (Scanner)</span>
            </h3>
            <button
              type="button"
              onClick={() => setUseCamera(!useCamera)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{useCamera ? 'Tutup Kamera' : 'Buka Kamera'}</span>
            </button>
          </div>

          {/* Camera Viewport (if active) */}
          {useCamera && (
            <div className="relative h-44 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-emerald-500/50 m-6 rounded-md pointer-events-none flex items-center justify-center">
                <span className="text-[10px] text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded">
                  Arahkan QR Tiket ke Sini
                </span>
              </div>
            </div>
          )}

          {/* Manual Input Code / Barcode Scanner */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Input ID Tiket / Scan Barcode / Plat Nomor
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Misal: TIX-20261018-0001 atau B 1404 MSM"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleScan();
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleScan()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Scan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Testing: Active Tickets List */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/60">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulasi Uji: Pilih Tiket Tersedia ({tickets.length})</span>
            </h4>
          </div>

          {tickets.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center italic">
              Belum ada tiket yang diterbitkan. Buat tiket di tab "Beli Tiket Kiosk" terlebih dahulu.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isSelected = inputCode === t.id;
                return (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700/60 bg-slate-900/60 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-numbers font-bold text-white">{t.id}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            t.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : t.status === 'used'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t.totalVisitors} Orang
                        {t.parking && ` · Plat: ${t.parking.licensePlate}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setInputCode(t.id);
                        handleScan(t.id);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-emerald-600 text-white rounded transition-colors cursor-pointer shrink-0"
                    >
                      Uji Scan
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
