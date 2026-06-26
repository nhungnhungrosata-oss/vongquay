/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Gift, ShieldCheck, MapPin, UserCheck, Phone, X, Award } from 'lucide-react';
import { Participant } from '../types';

interface WinnerPopupProps {
  isOpen: boolean;
  winner: Participant | null;
  prizeName: string;
  onConfirm: () => void;
  onSpinAgain: () => void;
  onClose: () => void;
}

export default function WinnerPopup({
  isOpen,
  winner,
  prizeName,
  onConfirm,
  onSpinAgain,
  onClose,
}: WinnerPopupProps) {
  if (!isOpen || !winner) return null;

  // Mask phone number for public security: e.g. 0912345678 -> 09xx xxx 678 or 0912***678
  const maskPhone = (phoneStr: string) => {
    const cleaned = phoneStr.replace(/\s+/g, '');
    if (cleaned.length < 6) return 'xxxxxx';
    const start = cleaned.substring(0, 3);
    const end = cleaned.substring(cleaned.length - 3);
    return `${start}xx xxx ${end}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-[500px] bg-white rounded-[32px] overflow-hidden shadow-2xl text-slate-900"
        >
          {/* Close button top */}
          <button
            id="close-winner-popup-top"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Premium Header */}
          <div className="bg-amber-400 p-8 text-center relative overflow-hidden">
            <p className="text-amber-900 font-bold uppercase tracking-widest text-xs mb-2">🎉 Chúc mừng người trúng thưởng</p>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight leading-tight">
              {winner.fullName}
            </h3>
            <div className="mt-2 text-amber-950/80 text-xs font-bold uppercase tracking-wider">
              {prizeName}
            </div>
          </div>

          {/* Winner Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              {/* Phone */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Số điện thoại</label>
                <p className="text-slate-800 font-mono font-bold text-base">{maskPhone(winner.phone)}</p>
              </div>

              {/* Referrer */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Người giới thiệu</label>
                <p className="text-slate-800 font-bold text-sm">{winner.referrer || 'Không có'}</p>
              </div>

              {/* Delivery address */}
              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Địa chỉ giao hàng</label>
                <p className="text-slate-800 text-sm font-medium leading-relaxed">{winner.address}</p>
              </div>

              {/* Note */}
              {winner.note && (
                <div className="md:col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">Ghi chú đăng ký:</span> {winner.note}
                </div>
              )}
            </div>

            {/* Action buttons stack */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {/* Confirm winner button */}
              <button
                id="confirm-winner-btn"
                onClick={onConfirm}
                className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <ShieldCheck className="w-5 h-5" />
                Xác nhận & Tiếp tục
              </button>

              {/* Spin again button */}
              <button
                id="spin-again-btn"
                onClick={onSpinAgain}
                className="px-5 py-4 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer text-sm"
              >
                Quay tiếp
              </button>

              {/* Close button */}
              <button
                id="close-winner-popup-btn"
                onClick={onClose}
                className="px-5 py-4 border-2 border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-500 transition-colors cursor-pointer text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
