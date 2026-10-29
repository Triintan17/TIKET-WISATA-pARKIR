import React, { useState } from 'react';
import { TransactionTicket, ParkingCapacity } from '../types';
import { 
  BarChart3, Download, Search, Printer, Car, 
  Bike, Bus, Users, DollarSign, RotateCcw, Filter, Eye 
} from 'lucide-react';

interface AdminReportDashboardProps {
  tickets: TransactionTicket[];
  parkingCapacity: ParkingCapacity;
  onViewReceipt: (ticket: TransactionTicket) => void;
  onResetData: () => void;
}

export const AdminReportDashboard: React.FC<AdminReportDashboardProps> = ({
  tickets,
  parkingCapacity,
  onViewReceipt,
  onResetData,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'with_parking' | 'tourist_only'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used' | 'checked_out'>('all');

  // Calculations
  const totalRevenue = tickets.reduce((acc, t) => acc + t.totalAmount, 0);

  const tourismRevenue = tickets.reduce((acc, t) => {
    const itemsTotal = t.items.reduce((s, it) => s + it.price * it.qty, 0);
    return acc + itemsTotal;
  }, 0);

  const parkingRevenue = tickets.reduce((acc, t) => {
    return acc + (t.parking?.fee || 0);
  }, 0);

  const totalVisitors = tickets.reduce((acc, t) => acc + t.totalVisitors, 0);

  // Active parked count
  const activeParkedVehicles = tickets.filter(
    (t) => t.parking?.enabled && t.status !== 'checked_out'
  ).length;

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.parking?.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'with_parking'
        ? !!t.parking?.enabled
        : !t.parking?.enabled;

    const matchesStatus = filterStatus === 'all' ? true : t.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No Tiket',
      'Waktu',
      'Destinasi',
      'Total Wisatawan',
      'Jenis Kendaraan',
      'Plat Nomor',
      'Tarif Parkir',
      'Total Bayar',
      'Metode Bayar',
      'Status',
      'Perangkat',
    ];

    const rows = tickets.map((t) => [
      t.id,
      new Date(t.createdAt).toLocaleString('id-ID'),
      `"${t.destination}"`,
      t.totalVisitors,
      t.parking?.vehicleLabel || '-',
      t.parking?.licensePlate || '-',
      t.parking?.fee || 0,
      t.totalAmount,
      t.paymentMethod.toUpperCase(),
      t.status.toUpperCase(),
      t.deviceSource.toUpperCase(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_tiket_wisata_parkir_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Dashboard & Laporan Transaksi Terintegrasi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring rekonsiliasi pendapatan loket destinasi wisata dan sistem palang parkir MSM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan CSV</span>
          </button>

          <button
            type="button"
            onClick={onResetData}
            title="Reset Data Demo"
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Pendapatan Terpadu</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono-numbers text-white">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between font-mono-numbers border-t border-slate-700/50 pt-1.5">
            <span>Wisata: Rp {tourismRevenue.toLocaleString('id-ID')}</span>
            <span>Parkir: Rp {parkingRevenue.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Total Wisatawan */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Wisatawan Masuk</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono-numbers text-white">
            {totalVisitors.toLocaleString('id-ID')}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">Orang</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-2 border-t border-slate-700/50 pt-1.5">
            Dari {tickets.length} transaksi booking
          </p>
        </div>

        {/* Kendaraan Parkir Aktif */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Kendaraan Parkir Aktif</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono-numbers text-white">
            {activeParkedVehicles}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">Kendaraan</span>
          </p>
          <p className="text-[11px] text-emerald-400 mt-2 border-t border-slate-700/50 pt-1.5 flex items-center gap-1">
            <span>MSM Smart Gate Monitoring</span>
          </p>
        </div>

        {/* Okupansi Slot Parkir */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Status Slot Parkir Terisi</span>
            <Bike className="w-4 h-4 text-purple-400" />
          </div>
          <div className="space-y-1 mt-1 text-xs font-mono-numbers">
            <div className="flex justify-between">
              <span className="text-slate-400">Motor:</span>
              <span className="font-semibold text-white">
                {parkingCapacity.motorOccupied}/{parkingCapacity.motorTotal} Slot
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mobil:</span>
              <span className="font-semibold text-white">
                {parkingCapacity.mobilOccupied}/{parkingCapacity.mobilTotal} Slot
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTION DATA TABLE */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari ID Tiket, Plat Nomor Kendaraan..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterType('with_parking')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  filterType === 'with_parking' ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                + Parkir
              </button>
              <button
                type="button"
                onClick={() => setFilterType('tourist_only')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  filterType === 'tourist_only' ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                Wisata Saja
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-700 text-xs">
              {(['all', 'active', 'used', 'checked_out'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-1 rounded font-medium uppercase text-[10px] transition-colors cursor-pointer ${
                    filterStatus === st ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">No. Tiket</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pengunjung</th>
                <th className="py-3 px-4">Parkir Kendaraan</th>
                <th className="py-3 px-4 text-right">Total Bayar</th>
                <th className="py-3 px-4 text-center">Metode</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    Tidak ditemukan data transaksi tiket sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-750 transition-colors">
                    <td className="py-3 px-4 font-mono-numbers font-bold text-white">
                      {ticket.id}
                      <span className="block text-[10px] font-sans text-slate-500 font-normal">
                        Via {ticket.deviceSource}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono-numbers">
                      {new Date(ticket.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-semibold text-white">{ticket.totalVisitors} Orang</span>
                      <span className="block text-[10px] text-slate-400">
                        {ticket.items.map((i) => `${i.name} (${i.qty})`).join(', ') || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {ticket.parking && ticket.parking.enabled ? (
                        <div>
                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {ticket.parking.licensePlate}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {ticket.parking.vehicleLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Tanpa Kendaraan</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-white">
                      Rp {ticket.totalAmount.toLocaleString('id-ID')}
                      {ticket.discount > 0 && (
                        <span className="block text-[10px] text-emerald-400 font-normal">
                          Hemat Rp {ticket.discount.toLocaleString('id-ID')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {ticket.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ticket.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ticket.status === 'used'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}
                      >
                        {ticket.status === 'active'
                          ? 'Aktif'
                          : ticket.status === 'used'
                          ? 'Masuk'
                          : 'Selesai'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(ticket)}
                        className="p-1.5 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded transition-colors cursor-pointer"
                        title="Lihat / Cetak Struk"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
