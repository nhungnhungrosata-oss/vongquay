/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Save, Check, Plus, Trash2, ShieldAlert, Gift, Settings, ToggleLeft, ToggleRight, HelpCircle } from 'lucide-react';
import { AppSettings, Prize } from '../types';
import { storage } from '../lib/storage';

interface SettingsPanelProps {
  settings: AppSettings;
  prizes: Prize[];
  onDataChanged: () => void;
}

export default function SettingsPanel({ settings, prizes, onDataChanged }: SettingsPanelProps) {
  // Settings local state
  const [programName, setProgramName] = useState(settings.programName);
  const [shortDescription, setShortDescription] = useState(settings.shortDescription);
  const [referrerLabel, setReferrerLabel] = useState(settings.referrerLabel);
  const [groupLink, setGroupLink] = useState(settings.groupLink);
  const [successMessage, setSuccessMessage] = useState(settings.successMessage);
  const [removeWinnerFromNextSpins, setRemoveWinnerFromNextSpins] = useState(settings.removeWinnerFromNextSpins);
  const [allowMultipleWins, setAllowMultipleWins] = useState(settings.allowMultipleWins);

  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // New Prize form state
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeQty, setNewPrizeQty] = useState(1);
  const [newPrizeNote, setNewPrizeNote] = useState('');

  // Handle saving general settings
  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    storage.updateSettings({
      programName,
      shortDescription,
      referrerLabel,
      groupLink,
      successMessage,
      removeWinnerFromNextSpins,
      allowMultipleWins,
    });
    setSettingsSuccess(true);
    onDataChanged();
    setTimeout(() => setSettingsSuccess(false), 2500);
  };

  // Handle adding a new prize
  const handleAddPrize = (e: FormEvent) => {
    e.preventDefault();
    if (!newPrizeName.trim()) return;

    storage.savePrize({
      name: newPrizeName.trim(),
      quantity: newPrizeQty,
      notes: newPrizeNote.trim(),
      isActive: true,
    });

    setNewPrizeName('');
    setNewPrizeQty(1);
    setNewPrizeNote('');
    onDataChanged();
  };

  // Handle toggling prize active state
  const handleTogglePrize = (id: string, currentActive: boolean) => {
    storage.updatePrize(id, { isActive: !currentActive });
    onDataChanged();
  };

  // Handle deleting a prize
  const handleDeletePrize = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa giải thưởng "${name}" không?`)) {
      storage.deletePrize(id);
      onDataChanged();
    }
  };

  // Reset all app data to mock defaults for testing
  const handleResetData = () => {
    if (window.confirm('CẢNH BÁO: Hành động này sẽ RESET toàn bộ dữ liệu người đăng ký, danh sách trúng giải, và khôi phục lại 8 người tham gia mẫu ban đầu. Bạn có muốn tiếp tục?')) {
      storage.resetAllData();
      // Reload states
      const resetSettings = storage.getSettings();
      setProgramName(resetSettings.programName);
      setShortDescription(resetSettings.shortDescription);
      setReferrerLabel(resetSettings.referrerLabel);
      setGroupLink(resetSettings.groupLink);
      setSuccessMessage(resetSettings.successMessage);
      setRemoveWinnerFromNextSpins(resetSettings.removeWinnerFromNextSpins);
      setAllowMultipleWins(resetSettings.allowMultipleWins);
      onDataChanged();
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-white">
      
      {/* SECTION A: SYSTEM SETTINGS FORM */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold border-b border-slate-800 pb-3 text-indigo-300 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Cài Đặt Chương Trình
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          {/* Program name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Tên chương trình / Tiêu đề vòng quay
            </label>
            <input
              id="settings-programName"
              type="text"
              required
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>

          {/* Short description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Mô tả ngắn (Trang đăng ký)
            </label>
            <textarea
              id="settings-shortDescription"
              rows={2}
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Referrer custom label */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Nhãn trường Người giới thiệu (Có thể tùy chỉnh)
            </label>
            <input
              id="settings-referrerLabel"
              type="text"
              required
              value={referrerLabel}
              onChange={(e) => setReferrerLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">
              Ví dụ: &quot;Ai mời bạn tham gia Zoom hôm nay?&quot; hoặc &quot;Mã người giới thiệu&quot;
            </span>
          </div>

          {/* Group invite link */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Link nhóm đồng hành (Zalo, Facebook, Telegram)
            </label>
            <input
              id="settings-groupLink"
              type="url"
              placeholder="Nhập liên kết..."
              value={groupLink}
              onChange={(e) => setGroupLink(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>

          {/* Success Message */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Nội dung thông báo đăng ký thành công
            </label>
            <textarea
              id="settings-successMessage"
              rows={2}
              required
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* LOGIC SPIN TOGGLES */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Thiết Lập Logic Quay Số</h4>
            
            {/* Toggle remove winner */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Loại người trúng khỏi lần quay tiếp</span>
                <span className="text-[10px] text-gray-500">Giúp mỗi người chỉ trúng tối đa 1 giải.</span>
              </div>
              <button
                id="toggle-remove-winners"
                type="button"
                onClick={() => setRemoveWinnerFromNextSpins(!removeWinnerFromNextSpins)}
                className="text-indigo-400 hover:text-white transition-colors cursor-pointer"
              >
                {removeWinnerFromNextSpins ? (
                  <ToggleRight className="w-10 h-10 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-600" />
                )}
              </button>
            </div>

            {/* Toggle allow multiple wins */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <div>
                <span className="text-xs font-bold block">Cho phép trúng nhiều lần</span>
                <span className="text-[10px] text-gray-500">Giữ tên người đã trúng trong vòng quay.</span>
              </div>
              <button
                id="toggle-multiple-wins"
                type="button"
                onClick={() => setAllowMultipleWins(!allowMultipleWins)}
                className="text-indigo-400 hover:text-white transition-colors cursor-pointer"
              >
                {allowMultipleWins ? (
                  <ToggleRight className="w-10 h-10 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Save & Reset buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              id="save-settings-btn"
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              <Save className="w-4 h-4" />
              Lưu Cấu Hình
            </button>
            
            {settingsSuccess && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-400 text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Check className="w-4 h-4" /> Đã lưu!
              </motion.span>
            )}
          </div>
        </form>

        {/* RESET SYSTEM DATA BUTTON */}
        <div className="pt-4 border-t border-slate-800">
          <div className="p-4 bg-rose-950/20 rounded-xl border border-rose-900/30 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-300 uppercase">Khôi phục dữ liệu mẫu</h4>
              <p className="text-[10px] text-gray-400 mt-1 mb-2">Xóa sạch dữ liệu đã tạo và khôi phục 8 người đăng ký thử nghiệm (Nguyễn Văn An, Trần Thị Bình, v.v.).</p>
              <button
                id="reset-mock-data-btn"
                type="button"
                onClick={handleResetData}
                className="px-3 py-1 bg-rose-600/25 border border-rose-500/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Reset Toàn Bộ Dữ Liệu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: PRIZES MANAGEMENT PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold border-b border-slate-800 pb-3 text-indigo-300 flex items-center gap-2">
          <Gift className="w-5 h-5 text-indigo-400" />
          Cài Đặt & Quản Lý Giải Thưởng
        </h3>

        {/* Add new prize form */}
        <form onSubmit={handleAddPrize} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Thêm Giải Thưởng Mới</h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Tên giải thưởng</label>
              <input
                id="new-prize-name"
                type="text"
                placeholder="Ví dụ: Giải Nhất - Loa bluetooth"
                required
                value={newPrizeName}
                onChange={(e) => setNewPrizeName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Số lượng</label>
              <input
                id="new-prize-qty"
                type="number"
                min={1}
                required
                value={newPrizeQty}
                onChange={(e) => setNewPrizeQty(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Ghi chú giải thưởng (Không bắt buộc)</label>
            <input
              id="new-prize-note"
              type="text"
              placeholder="Ví dụ: Quà do nhà tài trợ A gửi tặng"
              value={newPrizeNote}
              onChange={(e) => setNewPrizeNote(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
            />
          </div>

          <button
            id="add-prize-btn"
            type="submit"
            className="w-full py-2 bg-indigo-600/35 hover:bg-indigo-600 text-indigo-200 hover:text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 border border-indigo-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Mới Giải Thưởng
          </button>
        </form>

        {/* List of current prizes */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Danh sách giải thưởng hiện tại</span>
            <span className="text-[10px] font-semibold text-indigo-300">Nhấp checkbox để Bật/Tắt giải</span>
          </h4>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {prizes.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs font-medium">Chưa có giải thưởng nào được khai báo.</div>
            ) : (
              prizes.map((p) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    p.isActive 
                      ? 'bg-slate-950/30 border-slate-800 hover:bg-slate-950/50' 
                      : 'bg-slate-950/10 border-slate-800/40 opacity-55'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Active Checkbox toggler */}
                    <input
                      id={`prize-active-checkbox-${p.id}`}
                      type="checkbox"
                      checked={p.isActive}
                      onChange={() => handleTogglePrize(p.id, p.isActive)}
                      className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-800 bg-slate-900 cursor-pointer"
                    />
                    <div>
                      <span className={`text-xs font-bold block ${p.isActive ? 'text-white' : 'text-gray-400 line-through'}`}>
                        {p.name} <span className="text-amber-400 ml-1">x{p.quantity}</span>
                      </span>
                      {p.notes && <span className="text-[10px] text-gray-500 block">{p.notes}</span>}
                    </div>
                  </div>

                  <button
                    id={`delete-prize-btn-${p.id}`}
                    onClick={() => handleDeletePrize(p.id, p.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                    title="Xóa giải"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
