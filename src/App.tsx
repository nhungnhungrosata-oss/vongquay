/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Disc, 
  Settings, 
  Users, 
  Trophy, 
  Key, 
  LogOut, 
  AlertCircle, 
  UserPlus, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { storage } from './lib/storage';
import { Participant, Winner, Prize, AppSettings } from './types';

// Import sub-components
import RegistrationForm from './components/RegistrationForm';
import LuckyWheel from './components/LuckyWheel';
import ParticipantsTable from './components/ParticipantsTable';
import WinnersTable from './components/WinnersTable';
import SettingsPanel from './components/SettingsPanel';

type MainTab = 'register' | 'spin' | 'admin';
type AdminSubTab = 'settings' | 'participants' | 'winners';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('spin'); // Default to spin view for quick presentation
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('participants');

  // Application Data States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    programName: 'VÒNG QUAY MAY MẮN',
    shortDescription: '',
    referrerLabel: 'Ai giới thiệu bạn vào nhóm chuyên sâu?',
    groupLink: '',
    successMessage: '',
    removeWinnerFromNextSpins: true,
    allowMultipleWins: false,
  });

  // Admin Authentication State
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active prize ID chosen on the spin screen
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');

  // Load state from Storage on mount and keep synced
  const reloadData = () => {
    const loadedParticipants = storage.getParticipants();
    const loadedWinners = storage.getWinners();
    const loadedPrizes = storage.getPrizes();
    const loadedSettings = storage.getSettings();

    setParticipants(loadedParticipants);
    setWinners(loadedWinners);
    setPrizes(loadedPrizes);
    setSettings(loadedSettings);

    // Default selectedPrizeId to the first active prize if not already set or invalid
    const activePrizes = loadedPrizes.filter(p => p.isActive);
    if (activePrizes.length > 0) {
      if (!selectedPrizeId || !loadedPrizes.some(p => p.id === selectedPrizeId)) {
        setSelectedPrizeId(activePrizes[0].id);
      }
    } else {
      setSelectedPrizeId('');
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Handle Admin Passcode Login
  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true);
      setAdminPassword('');
    } else {
      setAuthError('Mật khẩu không chính xác. Vui lòng thử lại!');
    }
  };

  // Handle Admin Log Out
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-slate-200 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* GLOWING HEADER DECORATION */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.12)_0%,_transparent_70%)] pointer-events-none" />

      {/* TOP NAVIGATION HEADBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center text-slate-900 font-bold shadow-lg"
            >
              <Disc className="w-5 h-5 text-slate-950" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wider text-white leading-none">
                {settings.programName || 'VÒNG QUAY MAY MẮN'}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight mt-1">
                Giải pháp quay số Zoom / Livestream chuyên nghiệp
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1.5 bg-[#1E293B] border border-slate-700 p-1.5 rounded-xl">
            {/* Tab 1: Register */}
            <button
              id="tab-register-btn"
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ĐĂNG KÝ THAM GIA</span>
            </button>

            {/* Tab 2: Spin Wheel */}
            <button
              id="tab-spin-btn"
              onClick={() => setActiveTab('spin')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'spin'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>MÀN HÌNH QUAY SỐ</span>
            </button>

            {/* Tab 3: Admin Controls */}
            <button
              id="tab-admin-btn"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>QUẢN TRỊ VIÊN</span>
              {isAdminAuthenticated && (
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN LAYOUT CANVAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PLAYER REGISTRATION PAGE */}
          {activeTab === 'register' && (
            <motion.div
              key="register-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-4"
            >
              <RegistrationForm
                settings={settings}
                onSuccess={reloadData}
              />
            </motion.div>
          )}

          {/* TAB 2: SPINNING WHEEL PAGE */}
          {activeTab === 'spin' && (
            <motion.div
              key="spin-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              {/* LEFT & CENTER COLUMN: THE WHEEL AND TITLE */}
              <div className="lg:col-span-2 space-y-6 flex flex-col items-center">
                
                {/* Visual Title Banner */}
                <div className="text-center w-full bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-100 to-pink-300 uppercase filter drop-shadow">
                    {settings.programName || 'VÒNG QUAY MAY MẮN'}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 font-medium italic">
                    {settings.shortDescription || 'Mời quý vị nhập thông tin tham gia để có cơ hội trúng những phần quà đặc biệt'}
                  </p>
                </div>

                {/* The Canvas LuckyWheel */}
                <LuckyWheel
                  participants={participants}
                  prizes={prizes}
                  selectedPrizeId={selectedPrizeId}
                  onWinnerConfirmed={reloadData}
                  onParticipantListChanged={reloadData}
                />
              </div>

              {/* RIGHT SIDEBAR: CHOOSE ACTIVE PRIZE & QUICK ACTIONS */}
              <div className="space-y-6">
                
                {/* Prize selector card */}
                <div className="bg-[#1E293B] border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    🎁 Chọn giải thưởng quay số
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Vui lòng chọn giải thưởng bạn chuẩn bị quay. Giải thưởng này sẽ được lưu kèm theo thông tin người trúng.
                  </p>

                  <div>
                    <label className="block text-[11px] text-indigo-400 font-bold mb-1.5 uppercase tracking-wide">
                      Danh sách giải đang mở
                    </label>
                    <select
                      id="spin-prize-selector"
                      value={selectedPrizeId}
                      onChange={(e) => setSelectedPrizeId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-semibold outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {prizes.filter(p => p.isActive).length === 0 ? (
                        <option value="" className="text-slate-400 bg-slate-900">Phần quà may mắn</option>
                      ) : (
                        prizes
                          .filter((p) => p.isActive)
                          .map((p) => (
                            <option key={p.id} value={p.id} className="font-semibold text-slate-200 bg-slate-900">
                              {p.name} (SL: {p.quantity})
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Quick winners overview sidebar list */}
                <div className="bg-[#1E293B] border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      🏆 Danh sách trúng giải vừa qua ({winners.length})
                    </h3>
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {winners.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        Chưa có người trúng giải. Bấm nút QUAY ở vòng quay để thử vận may!
                      </div>
                    ) : (
                      winners.slice(0, 5).map((winner) => (
                        <div
                          key={winner.id}
                          className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between gap-2.5 transition-colors"
                        >
                          <div>
                            <span className="text-xs font-bold text-white uppercase block">{winner.fullName}</span>
                            <span className="text-[10px] text-amber-400 font-semibold">{winner.prizeName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(winner.wonTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {winners.length > 5 && (
                    <button
                      id="view-more-winners"
                      onClick={() => {
                        setActiveTab('admin');
                        setAdminSubTab('winners');
                      }}
                      className="text-center w-full text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Xem toàn bộ {winners.length} người trúng giải →
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ADMIN CONTROL AND SETTINGS */}
          {activeTab === 'admin' && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* GATED PASSWORD ENTRY IF NOT AUTHENTICATED */}
              {!isAdminAuthenticated ? (
                <div className="max-w-md mx-auto py-12">
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6"
                  >
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center mx-auto text-indigo-400 border border-indigo-500/20">
                      <Key className="w-6 h-6 animate-pulse" />
                    </div>

                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white uppercase">XÁC THỰC QUẢN TRỊ VIÊN</h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        Bạn cần mật khẩu quản lý để tiếp cận dữ liệu người tham gia, chỉnh sửa giải thưởng, và điều chỉnh cấu hình hệ thống.
                      </p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      {authError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                          Nhập mật khẩu Admin
                        </label>
                        <input
                          id="admin-password-input"
                          type="password"
                          required
                          placeholder="Mật khẩu mặc định: admin123"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      <button
                        id="submit-admin-login"
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                      >
                        ĐĂNG NHẬP ADMIN
                      </button>
                    </form>
                    
                    <div className="text-center">
                      <span className="text-[10px] text-indigo-400 font-semibold uppercase bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                        Mật khẩu mặc định: admin123
                      </span>
                    </div>
                  </motion.div>
                </div>
              ) : (
                
                // AUTHENTICATED ADMIN PANEL DASHBOARD
                <div className="space-y-6">
                  {/* Admin Welcome Title and Navigation Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#1E293B] border border-slate-700 p-4 rounded-2xl shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                          Hệ Thống Quản Trị Vòng Quay
                          <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">Live</span>
                        </h3>
                        <p className="text-xs text-slate-400">Xem đầy đủ danh sách, quản lý giải thưởng và chỉnh sửa cấu hình.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="sync-data-btn"
                        onClick={reloadData}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-indigo-300 hover:text-white transition-all cursor-pointer border border-slate-700"
                        title="Đồng bộ tải lại dữ liệu"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      <button
                        id="admin-logout-btn"
                        onClick={handleAdminLogout}
                        className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-300 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        ĐĂNG XUẤT
                      </button>
                    </div>
                  </div>

                  {/* Sub panel Navigation Tabs */}
                  <div className="flex items-center gap-1 border-b border-slate-700">
                    {/* Tab 3A: Participants Table */}
                    <button
                      id="subtab-participants"
                      onClick={() => setAdminSubTab('participants')}
                      className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === 'participants'
                          ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Danh Sách Đăng Ký ({participants.length})</span>
                    </button>

                    {/* Tab 3B: Winners Table */}
                    <button
                      id="subtab-winners"
                      onClick={() => setAdminSubTab('winners')}
                      className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === 'winners'
                          ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Danh Sách Trúng Giải ({winners.length})</span>
                    </button>

                    {/* Tab 3C: Settings Program */}
                    <button
                      id="subtab-settings"
                      onClick={() => setAdminSubTab('settings')}
                      className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === 'settings'
                          ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Cài Đặt & Giải Thưởng</span>
                    </button>
                  </div>

                  {/* SUB PANEL CONTENT PANELS */}
                  <div className="py-2">
                    {adminSubTab === 'participants' && (
                      <ParticipantsTable
                        participants={participants}
                        onDataChanged={reloadData}
                      />
                    )}

                    {adminSubTab === 'winners' && (
                      <WinnersTable
                        winners={winners}
                        onDataChanged={reloadData}
                      />
                    )}

                    {adminSubTab === 'settings' && (
                      <SettingsPanel
                        settings={settings}
                        prizes={prizes}
                        onDataChanged={reloadData}
                      />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* COMPANION SMALL STATIC FOOTER */}
      <footer className="w-full text-center py-8 text-[11px] text-gray-500 border-t border-white/5 mt-12 bg-slate-950/40">
        <p>© 2026 {settings.programName || 'Vòng Quay May Mắn'}. All Rights Reserved.</p>
        <p className="mt-1">Hỗ trợ đầy đủ hiển thị đa nền tảng, xuất danh sách Excel an toàn.</p>
      </footer>

    </div>
  );
}
