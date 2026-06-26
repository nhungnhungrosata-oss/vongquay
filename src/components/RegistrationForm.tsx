/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Phone, MapPin, Users, FileText, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { storage } from '../lib/storage';
import { AppSettings } from '../types';

interface RegistrationFormProps {
  settings: AppSettings;
  onSuccess: () => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    // Basic client validation
    if (!fullName.trim() || !phone.trim() || !address.trim() || !referrer.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
      setIsSubmitting(false);
      return;
    }

    // Clean phone number format slightly for storage check
    const cleanPhone = phone.trim();

    try {
      storage.addParticipant({
        fullName: fullName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        referrer: referrer.trim(),
        note: note.trim()
      });

      setIsSuccess(true);
      onSuccess(); // Refresh parents if necessary
      
      // Clear form
      setFullName('');
      setPhone('');
      setAddress('');
      setReferrer('');
      setNote('');
    } catch (error: any) {
      if (error.message === 'DUPLICATE_PHONE') {
        setErrorMsg('Số điện thoại này đã đăng ký tham gia rồi.');
      } else {
        setErrorMsg('Đã xảy ra lỗi hệ thống, vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        id="registration-success-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-[#1E293B] rounded-2xl shadow-2xl p-8 max-w-lg mx-auto text-center border border-slate-700 text-slate-200"
      >
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide">ĐĂNG KÝ THÀNH CÔNG</h3>
        <p className="text-slate-300 leading-relaxed mb-6 text-sm">
          {settings.successMessage || 'Anh/chị đã đăng ký thành công. Vui lòng theo dõi phần quay số trong chương trình.'}
        </p>
        
        {settings.groupLink && (
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700">
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2">Tham gia Nhóm Đồng Hành Chuyên Sâu</p>
            <p className="text-sm text-slate-400 mb-3">Nhận tài liệu miễn phí và theo dõi lịch công bố trúng thưởng tại đây:</p>
            <a
              id="join-group-button"
              href={settings.groupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg cursor-pointer"
            >
              Vào Nhóm Zalo Ngay <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        <button
          id="register-another-button"
          onClick={() => setIsSuccess(false)}
          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
        >
          Đăng ký thông tin khác
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      id="registration-form-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#1E293B] rounded-2xl shadow-2xl p-6 md:p-8 max-w-xl mx-auto border border-slate-700 text-slate-200"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wider">
          ĐĂNG KÝ THAM GIA
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          {settings.shortDescription || 'Nhập thông tin bên dưới để tham gia chương trình vòng quay may mắn'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <motion.div
            id="form-error-alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-500/10 text-rose-300 rounded-xl flex items-start gap-3 border border-rose-500/20"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{errorMsg}</div>
          </motion.div>
        )}

        {/* Full name */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Họ và tên <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <input
              id="input-fullName"
              type="text"
              required
              placeholder="Ví dụ: Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-850 focus:bg-slate-900 text-slate-200 border border-slate-700 focus:border-indigo-500 rounded-xl outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-400" />
            Số điện thoại <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <input
              id="input-phone"
              type="tel"
              required
              placeholder="Ví dụ: 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-850 focus:bg-slate-900 text-slate-200 border border-slate-700 focus:border-indigo-500 rounded-xl outline-none transition-all text-sm"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Mỗi số điện thoại chỉ được đăng ký một lần duy nhất.
          </span>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            Địa chỉ nhận quà <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <input
              id="input-address"
              type="text"
              required
              placeholder="Ví dụ: 123 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-850 focus:bg-slate-900 text-slate-200 border border-slate-700 focus:border-indigo-500 rounded-xl outline-none transition-all text-sm"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Vui lòng điền địa chỉ đầy đủ và chính xác để admin gửi quà nếu trúng giải.
          </span>
        </div>

        {/* Referrer - label is customizable by admin */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            {settings.referrerLabel || 'Ai giới thiệu bạn vào nhóm chuyên sâu?'} <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <input
              id="input-referrer"
              type="text"
              required
              placeholder="Ví dụ: Thầy Minh Zoom, Tự tìm hiểu, Facebook, v.v."
              value={referrer}
              onChange={(e) => setReferrer(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-850 focus:bg-slate-900 text-slate-200 border border-slate-700 focus:border-indigo-500 rounded-xl outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Ghi chú <span className="text-slate-500 font-normal">(Không bắt buộc)</span>
          </label>
          <div className="relative">
            <textarea
              id="input-note"
              rows={2}
              placeholder="Gửi lời nhắn tới ban tổ chức hoặc ghi chú thêm..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-850 focus:bg-slate-900 text-slate-200 border border-slate-700 focus:border-indigo-500 rounded-xl outline-none transition-all text-sm resize-none"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          id="submit-registration-button"
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'ĐĂNG KÝ THAM GIA NGAY'
          )}
        </button>
      </form>
    </motion.div>
  );
}
