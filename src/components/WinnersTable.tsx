/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Download, Trash2, Phone, MapPin, Calendar, Award, UserCheck, CheckCircle2 } from 'lucide-react';
import { Winner } from '../types';
import { storage } from '../lib/storage';

interface WinnersTableProps {
  winners: Winner[];
  onDataChanged: () => void;
}

export default function WinnersTable({ winners, onDataChanged }: WinnersTableProps) {
  const [showFullPhones, setShowFullPhones] = useState(false);

  // Status mapping
  const statusOptions: { value: Winner['status']; label: string; color: string }[] = [
    { value: 'not_contacted', label: 'Chưa liên hệ ⏳', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
    { value: 'contacted', label: 'Đã liên hệ 📞', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
    { value: 'sent', label: 'Đã gửi quà 🎁', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  ];

  const handleStatusChange = (id: string, newStatus: Winner['status']) => {
    storage.updateWinnerStatus(id, newStatus);
    onDataChanged();
  };

  const handleDeleteWinner = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi danh sách trúng thưởng? Thao tác này cũng sẽ reset trạng thái của họ thành "Chưa trúng" trong danh sách tham gia.`)) {
      storage.deleteWinner(id);
      onDataChanged();
    }
  };

  const maskPhone = (phoneStr: string) => {
    if (showFullPhones) return phoneStr;
    const cleaned = phoneStr.replace(/\s+/g, '');
    if (cleaned.length < 6) return 'xxxxxx';
    const start = cleaned.substring(0, 3);
    const end = cleaned.substring(cleaned.length - 3);
    return `${start}xx xxx ${end}`;
  };

  // EXCEL COMPATIBLE UTF-8 CSV EXPORT
  const handleExportWinnersCSV = () => {
    const headers = ['STT', 'Họ và tên', 'Số điện thoại', 'Địa chỉ giao hàng', 'Người giới thiệu', 'Giải thưởng', 'Thời gian trúng', 'Trạng thái xử lý'];
    
    const rows = winners.map((w, index) => {
      const statusLabel = w.status === 'sent' ? 'Đã gửi quà' : w.status === 'contacted' ? 'Đã liên hệ' : 'Chưa liên hệ';
      return [
        index + 1,
        `"${w.fullName.replace(/"/g, '""')}"`,
        `'${w.phone}`,
        `"${w.address.replace(/"/g, '""')}"`,
        `"${w.referrer.replace(/"/g, '""')}"`,
        `"${w.prizeName.replace(/"/g, '""')}"`,
        new Date(w.wonTime).toLocaleString('vi-VN'),
        statusLabel,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DS_TrungThuong_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Table header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/15 rounded-lg text-amber-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase">Danh Sách Người Trúng Thưởng</h4>
            <p className="text-xs text-gray-400">Tổng cộng {winners.length} giải thưởng đã được trao</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-winners-phones"
            onClick={() => setShowFullPhones(!showFullPhones)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {showFullPhones ? 'Ẩn số điện thoại' : 'Hiện số đầy đủ'}
          </button>

          <button
            id="export-winners-csv"
            disabled={winners.length === 0}
            onClick={handleExportWinnersCSV}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Danh Sách Trúng</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-3.5 text-center w-12">STT</th>
              <th className="px-4 py-3.5">Họ và tên</th>
              <th className="px-4 py-3.5">Giải thưởng</th>
              <th className="px-4 py-3.5">Số điện thoại</th>
              <th className="px-4 py-3.5">Người giới thiệu</th>
              <th className="px-4 py-3.5">Thời gian trúng</th>
              <th className="px-4 py-3.5">Địa chỉ nhận quà</th>
              <th className="px-4 py-3.5 text-center w-40">Xử lý giải</th>
              <th className="px-4 py-3.5 text-center w-16">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-gray-300">
            {winners.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-500 font-medium">
                  Chưa có người trúng giải nào. Hãy bắt đầu quay số!
                </td>
              </tr>
            ) : (
              winners.map((w, idx) => {
                const currentOpt = statusOptions.find(o => o.value === w.status) || statusOptions[0];
                return (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-center text-xs font-mono text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white uppercase">{w.fullName}</td>
                    <td className="px-4 py-3 font-semibold text-amber-300 flex items-center gap-1.5 mt-0.5">
                      <Award className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{w.prizeName}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{maskPhone(w.phone)}</td>
                    <td className="px-4 py-3 text-xs text-indigo-200 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{w.referrer}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(w.wonTime).toLocaleString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[150px] truncate" title={w.address}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{w.address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        id={`winner-status-select-${w.id}`}
                        value={w.status}
                        onChange={(e) => handleStatusChange(w.id, e.target.value as Winner['status'])}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-950 w-full cursor-pointer ${currentOpt.color}`}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white font-medium">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        id={`delete-winner-${w.id}`}
                        onClick={() => handleDeleteWinner(w.id, w.fullName)}
                        className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600/30 rounded transition-colors cursor-pointer"
                        title="Hủy giải thưởng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
