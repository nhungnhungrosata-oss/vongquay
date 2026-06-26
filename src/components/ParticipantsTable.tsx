/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Edit, Trash2, Download, Filter, X, Save, Eye, EyeOff } from 'lucide-react';
import { Participant } from '../types';
import { storage } from '../lib/storage';

interface ParticipantsTableProps {
  participants: Participant[];
  onDataChanged: () => void | Promise<void>;
}

export default function ParticipantsTable({ participants, onDataChanged }: ParticipantsTableProps) {
  const [search, setSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won'>('all');
  const [referrerFilter, setReferrerFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [showFullPhones, setShowFullPhones] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const uniqueReferrers = Array.from(new Set(participants.map((p) => p.referrer).filter(Boolean)));

  const filteredParticipants = participants.filter((p) => {
    const matchesName = p.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesPhone = p.phone.includes(phoneSearch);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesReferrer = referrerFilter === 'all' || p.referrer === referrerFilter;
    return matchesName && matchesPhone && matchesStatus && matchesReferrer;
  });

  const filteredIds = filteredParticipants.map((p) => p.id);
  const selectedFilteredCount = filteredIds.filter((id) => selectedIds.includes(id)).length;
  const selectedTotalCount = selectedIds.length;
  const isAllFilteredSelected = filteredParticipants.length > 0 && selectedFilteredCount === filteredParticipants.length;

  useEffect(() => {
    const existingIds = new Set(participants.map((p) => p.id));
    setSelectedIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [participants]);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]);
  };

  const handleToggleSelectFiltered = () => {
    if (filteredParticipants.length === 0) return;
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleClearSelection = () => setSelectedIds([]);

  const handleDeleteSelected = async () => {
    const selectedParticipants = participants.filter((p) => selectedIds.includes(p.id));
    if (selectedParticipants.length === 0 || isMutating) return;

    const previewNames = selectedParticipants.slice(0, 5).map((p) => `- ${p.fullName}`).join('\n');
    const moreText = selectedParticipants.length > 5 ? `\n...và ${selectedParticipants.length - 5} người khác` : '';

    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedParticipants.length} người tham gia đã chọn không?\n\n${previewNames}${moreText}`)) {
      setIsMutating(true);
      try {
        await Promise.all(selectedParticipants.map((p) => storage.deleteParticipant(p.id)));
        setSelectedIds([]);
        await onDataChanged();
      } catch (error) {
        console.error('Bulk delete participants error:', error);
        alert('Không thể xóa danh sách đã chọn. Vui lòng kiểm tra kết nối Supabase và thử lại.');
      } finally {
        setIsMutating(false);
      }
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingParticipant || isMutating) return;

    setIsMutating(true);
    try {
      await storage.updateParticipant(editingParticipant.id, {
        fullName: editingParticipant.fullName,
        phone: editingParticipant.phone,
        address: editingParticipant.address,
        referrer: editingParticipant.referrer,
        note: editingParticipant.note,
        status: editingParticipant.status,
      });
      setEditingParticipant(null);
      await onDataChanged();
    } catch (err: any) {
      if (err.message === 'DUPLICATE_PHONE') {
        alert('Số điện thoại này đã tồn tại trong danh sách đăng ký.');
      } else {
        console.error('Save participant error:', err);
        alert('Không thể lưu thông tin. Vui lòng kiểm tra lại.');
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isMutating) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa người tham gia "${name}" không?`)) {
      setIsMutating(true);
      try {
        await storage.deleteParticipant(id);
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
        await onDataChanged();
      } catch (error) {
        console.error('Delete participant error:', error);
        alert('Không thể xóa người tham gia. Vui lòng thử lại.');
      } finally {
        setIsMutating(false);
      }
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

  const handleExportCSV = () => {
    const headers = ['STT', 'Họ và tên', 'Số điện thoại', 'Địa chỉ giao hàng', 'Người giới thiệu', 'Ghi chú', 'Thời gian đăng ký', 'Trạng thái', 'Quà đã trúng', 'Thời gian trúng'];
    const rows = filteredParticipants.map((p, index) => [
      index + 1,
      `"${p.fullName.replace(/"/g, '""')}"`,
      `'${p.phone}`,
      `"${p.address.replace(/"/g, '""')}"`,
      `"${p.referrer.replace(/"/g, '""')}"`,
      `"${p.note.replace(/"/g, '""')}"`,
      new Date(p.registrationTime).toLocaleString('vi-VN'),
      p.status === 'won' ? 'Đã trúng' : 'Chưa trúng',
      p.prizeName ? `"${p.prizeName.replace(/"/g, '""')}"` : '',
      p.wonTime ? new Date(p.wonTime).toLocaleString('vi-VN') : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DS_DangKy_VongQuay_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input id="search-by-name-input" type="text" placeholder="Tìm theo tên..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white outline-none transition-all" />
          </div>
          <div className="w-full md:w-56 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input id="search-by-phone-input" type="text" placeholder="Tìm theo số điện thoại..." value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white outline-none transition-all" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Trạng thái:</span>
              <select id="filter-status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none focus:border-indigo-500">
                <option value="all">Tất cả</option>
                <option value="pending">Chưa trúng</option>
                <option value="won">Đã trúng</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <span>Người giới thiệu:</span>
              <select id="filter-referrer-select" value={referrerFilter} onChange={(e) => setReferrerFilter(e.target.value)} className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none focus:border-indigo-500 max-w-[180px]">
                <option value="all">Tất cả nguồn</option>
                {uniqueReferrers.map((ref) => <option key={ref} value={ref}>{ref}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button id="toggle-mask-phones" onClick={() => setShowFullPhones(!showFullPhones)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
              {showFullPhones ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showFullPhones ? 'Ẩn số điện thoại' : 'Hiện số đầy đủ'}</span>
            </button>
            <button id="export-participants-csv" onClick={handleExportCSV} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel/CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
          <div className="text-xs text-slate-400">
            Đang hiển thị <strong className="text-white">{filteredParticipants.length}</strong> người
            {selectedTotalCount > 0 && <span> · Đã chọn <strong className="text-amber-300">{selectedTotalCount}</strong> người</span>}
            {isMutating && <span className="text-indigo-300"> · Đang lưu...</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button id="quick-select-filtered-participants" type="button" disabled={filteredParticipants.length === 0 || isMutating} onClick={handleToggleSelectFiltered} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-200 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {isAllFilteredSelected ? 'Bỏ chọn danh sách đang lọc' : `Chọn nhanh ${filteredParticipants.length} người đang lọc`}
            </button>
            {selectedTotalCount > 0 && (
              <>
                <button id="clear-selected-participants" type="button" disabled={isMutating} onClick={handleClearSelection} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50">Bỏ chọn tất cả</button>
                <button id="delete-selected-participants" type="button" disabled={isMutating} onClick={handleDeleteSelected} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />Xóa {selectedTotalCount} người đã chọn
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-3.5 text-center w-12"><input id="select-all-filtered-participants" type="checkbox" checked={isAllFilteredSelected} disabled={filteredParticipants.length === 0 || isMutating} onChange={handleToggleSelectFiltered} className="w-4 h-4 accent-indigo-500 cursor-pointer disabled:cursor-not-allowed" aria-label="Chọn nhanh toàn bộ danh sách đang lọc" /></th>
              <th className="px-4 py-3.5 text-center w-12">STT</th>
              <th className="px-4 py-3.5">Họ và tên</th>
              <th className="px-4 py-3.5">Số điện thoại</th>
              <th className="px-4 py-3.5">Người giới thiệu</th>
              <th className="px-4 py-3.5">Địa chỉ</th>
              <th className="px-4 py-3.5">Ghi chú</th>
              <th className="px-4 py-3.5 text-center">Trạng thái</th>
              <th className="px-4 py-3.5 text-center w-24">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-gray-300">
            {filteredParticipants.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-10 text-gray-500 font-medium">Không tìm thấy người tham gia phù hợp.</td></tr>
            ) : filteredParticipants.map((p, idx) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <tr key={p.id} className={`${isSelected ? 'bg-indigo-500/10' : 'hover:bg-slate-800/30'} transition-colors`}>
                  <td className="px-4 py-3 text-center"><input id={`select-participant-${p.id}`} type="checkbox" checked={isSelected} disabled={isMutating} onChange={() => toggleSelectOne(p.id)} className="w-4 h-4 accent-indigo-500 cursor-pointer disabled:cursor-not-allowed" aria-label={`Chọn ${p.fullName}`} /></td>
                  <td className="px-4 py-3 text-center text-xs font-mono text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-white">{p.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{maskPhone(p.phone)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-indigo-200">{p.referrer}</td>
                  <td className="px-4 py-3 text-xs max-w-[180px] truncate" title={p.address}>{p.address}</td>
                  <td className="px-4 py-3 text-xs italic text-gray-400 max-w-[120px] truncate" title={p.note}>{p.note || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {p.status === 'won' ? <span className="inline-flex px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Đã trúng ({p.prizeName})</span> : <span className="inline-flex px-2 py-0.5 bg-slate-800 border border-slate-700 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Chưa trúng</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button id={`edit-btn-${p.id}`} disabled={isMutating} onClick={() => setEditingParticipant(p)} className="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-600/30 rounded transition-colors cursor-pointer disabled:opacity-50" title="Sửa thông tin"><Edit className="w-4 h-4" /></button>
                      <button id={`delete-btn-${p.id}`} disabled={isMutating} onClick={() => void handleDelete(p.id, p.fullName)} className="p-1.5 text-red-400 hover:text-white hover:bg-red-600/30 rounded transition-colors cursor-pointer disabled:opacity-50" title="Xóa người tham gia"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editingParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl relative">
              <button id="close-edit-dialog" onClick={() => setEditingParticipant(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-lg font-bold mb-4 text-indigo-300 flex items-center gap-2"><Edit className="w-5 h-5" />Sửa Thông Tin Người Tham Gia</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Họ và tên</label><input id="edit-fullName" type="text" required value={editingParticipant.fullName} onChange={(e) => setEditingParticipant({ ...editingParticipant, fullName: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Số điện thoại</label><input id="edit-phone" type="text" required value={editingParticipant.phone} onChange={(e) => setEditingParticipant({ ...editingParticipant, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Người giới thiệu</label><input id="edit-referrer" type="text" required value={editingParticipant.referrer} onChange={(e) => setEditingParticipant({ ...editingParticipant, referrer: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Địa chỉ giao hàng</label><textarea id="edit-address" rows={2} required value={editingParticipant.address} onChange={(e) => setEditingParticipant({ ...editingParticipant, address: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 resize-none" /></div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Ghi chú</label><input id="edit-note" type="text" value={editingParticipant.note} onChange={(e) => setEditingParticipant({ ...editingParticipant, note: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Trạng thái trúng thưởng</label><select id="edit-status" value={editingParticipant.status} onChange={(e) => setEditingParticipant({ ...editingParticipant, status: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"><option value="pending">Chưa trúng</option><option value="won">Đã trúng</option></select></div>
                <div className="flex gap-2.5 pt-2"><button id="save-edit-btn" type="submit" disabled={isMutating} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"><Save className="w-3.5 h-3.5" />{isMutating ? 'Đang lưu...' : 'Lưu Thay Đổi'}</button><button id="cancel-edit-btn" type="button" disabled={isMutating} onClick={() => setEditingParticipant(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50">Hủy</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
