/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Phone, MapPin, Users, FileText, CheckCircle, AlertTriangle, ExternalLink, Gift, ShieldCheck, Sparkles } from 'lucide-react';
import { storage } from '../lib/storage';
import { AppSettings } from '../types';

interface RegistrationFormProps {
  settings: AppSettings;
  onSuccess: () => void | Promise<void>;
}

export default function RegistrationForm({ settings, onSuccess }: RegistrationFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [referrer, setReferrer] = useState('');
  const [note, setNote] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputClass = 'w-full min-h-[48px] px-4 py-3 bg-slate-950/70 text-white placeholder:text-slate-500 border border-slate-700/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl outline-none transition-all text-[15px] shadow-inner';
  const labelClass = 'text-[13px] font-bold text-slate-200 mb-2 flex items-center gap-2';

  const getFriendlyErrorMessage = (error: any) => {
    const rawMessage = error?.message || error?.details || 'Không rõ lỗi';
    const code = error?.code ? `Mã lỗi: ${error.code}. ` : '';

    if (String(rawMessage).includes('relation') && String(rawMessage).includes('participants')) {
      return 'Lỗi Supabase: Chưa tạo bảng participants. Vui lòng chạy file supabase-setup.sql trong SQL Editor.';
    }

    if (String(rawMessage).toLowerCase().includes('row-level security') || String(rawMessage).toLowerCase().includes('rls')) {
      return 'Lỗi Supabase: Chưa bật policy RLS cho bảng participants. Vui lòng chạy lại toàn bộ file supabase-setup.sql.';
    }

    if (String(rawMessage).toLowerCase().includes('invalid api key') || String(rawMessage).toLowerCase().includes('jwt')) {
      return 'Lỗi Supabase: Key không đúng. Vui lòng kiểm tra VITE_SUPABASE_PUBLISHABLE_KEY trong Vercel rồi Redeploy.';
    }

    return `Không thể lưu đăng ký. ${code}${rawMessage}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    if (!fullName.trim() || !phone.trim() || !address.trim() || !referrer.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin có dấu * để tham gia quay số.');
      setIsSubmitting(false);
      return;
    }

    const cleanPhone = phone.trim();

    try {
      await storage.addParticipant({
        fullName: fullName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        referrer: referrer.trim(),
        note: note.trim(),
      });

      setIsSuccess(true);
      await onSuccess();
      setFullName('');
      setPhone('');
      setAddress('');
      setReferrer('');
      setNote('');
    } catch (error: any) {
      if (error.message === 'DUPLICATE_PHONE') {
        setErrorMsg('Số điện thoại này đã đăng ký tham gia rồi.');
      } else {
        console.error('Registration save error:', error);
        setErrorMsg(getFriendlyErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative min-h-[calc(100vh-2rem)] flex items-center justify-center py-4">
        <motion.div
          id="registration-success-card"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-lg mx-auto text-center text-slate-200"
        >
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative bg-slate-900/90 rounded-[28px] shadow-2xl p-6 sm:p-8 border border-emerald-400/20 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-indigo-400 to-amber-300" />
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/30 shadow-lg shadow-emerald-900/30">
              <CheckCircle className="w-11 h-11 text-emerald-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 uppercase tracking-wide">Đăng ký thành công</h3>
            <p className="text-slate-300 leading-relaxed mb-6 text-sm sm:text-base">
              {settings.successMessage || 'Anh/chị đã đăng ký thành công. Vui lòng theo dõi phần quay số trong chương trình.'}
            </p>
            
            {settings.groupLink && (
              <div className="bg-slate-950/70 rounded-2xl p-4 mb-6 border border-slate-700/70 text-left">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Tham gia nhóm đồng hành chuyên sâu
                </p>
                <p className="text-sm text-slate-400 mb-4">Nhận tài liệu miễn phí và theo dõi lịch công bố trúng thưởng tại đây:</p>
                <a
                  id="join-group-button"
                  href={settings.groupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-colors shadow-lg shadow-indigo-900/30 cursor-pointer"
                >
                  Vào nhóm Zalo ngay <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            <button
              id="register-another-button"
              onClick={() => setIsSuccess(false)}
              className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl transition-colors cursor-pointer"
            >
              Đăng ký thông tin khác
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] flex items-center justify-center py-2 sm:py-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[460px] max-w-full h-[460px] bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />

      <motion.div
        id="registration-form-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-2xl mx-auto"
      >
        <div className="text-center mb-5 sm:mb-7 px-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 rounded-full text-[12px] font-bold text-amber-200 mb-4 shadow-lg">
            <Gift className="w-4 h-4 text-amber-300" />
            Tham gia quay số nhận quà
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight">
            {settings.programName || 'Vòng Quay May Mắn'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed max-w-xl mx-auto">
            {settings.shortDescription || 'Điền thông tin bên dưới để tham gia chương trình vòng quay may mắn.'}
          </p>
        </div>

        <div className="bg-slate-900/90 rounded-[28px] shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
          <div className="h-1.5 bg-gradient-to-r from-amber-300 via-indigo-400 to-pink-400" />
          <div className="p-5 sm:p-7 md:p-8">
            <div className="flex items-start gap-3 mb-6 bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">Thông tin tham gia</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">Thông tin của anh/chị chỉ dùng để quay số và liên hệ gửi quà khi trúng thưởng.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <motion.div
                  id="form-error-alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-500/10 text-rose-200 rounded-2xl flex items-start gap-3 border border-rose-500/30"
                >
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-sm font-semibold leading-relaxed">{errorMsg}</div>
                </motion.div>
              )}

              <div>
                <label className={labelClass}><User className="w-4 h-4 text-indigo-300" />Họ và tên <span className="text-amber-300">*</span></label>
                <input id="input-fullName" type="text" required autoComplete="name" placeholder="Ví dụ: Nguyễn Văn An" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}><Phone className="w-4 h-4 text-indigo-300" />Số điện thoại <span className="text-amber-300">*</span></label>
                <input id="input-phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="Ví dụ: 0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                <span className="text-[11px] text-slate-500 mt-1.5 block">Mỗi số điện thoại chỉ được đăng ký một lần duy nhất.</span>
              </div>

              <div>
                <label className={labelClass}><MapPin className="w-4 h-4 text-indigo-300" />Địa chỉ nhận quà <span className="text-amber-300">*</span></label>
                <input id="input-address" type="text" required autoComplete="street-address" placeholder="Nhập địa chỉ giao quà nếu trúng thưởng" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
                <span className="text-[11px] text-slate-500 mt-1.5 block">Vui lòng điền địa chỉ đầy đủ để admin gửi quà khi trúng giải.</span>
              </div>

              <div>
                <label className={labelClass}><Users className="w-4 h-4 text-indigo-300" />{settings.referrerLabel || 'Ai giới thiệu bạn vào nhóm chuyên sâu?'} <span className="text-amber-300">*</span></label>
                <input id="input-referrer" type="text" required placeholder="Ví dụ: Facebook, Zalo, bạn bè giới thiệu..." value={referrer} onChange={(e) => setReferrer(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}><FileText className="w-4 h-4 text-indigo-300" />Ghi chú <span className="text-slate-500 font-normal">(Không bắt buộc)</span></label>
                <textarea id="input-note" rows={3} placeholder="Gửi lời nhắn tới ban tổ chức hoặc ghi chú thêm..." value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} resize-none min-h-[88px]`} />
              </div>

              <div className="pt-1 space-y-3">
                <button
                  id="submit-registration-button"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[54px] py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-900/30 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Gift className="w-5 h-5" />Đăng ký tham gia ngay</>}
                </button>

                <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500 justify-center px-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Thông tin được lưu để phục vụ chương trình quay số và liên hệ trao quà.</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
