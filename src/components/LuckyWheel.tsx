/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, AlertCircle, Award, Volume2, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { storage } from '../lib/storage';
import { Participant, Prize, AppSettings } from '../types';
import WinnerPopup from './WinnerPopup';

interface LuckyWheelProps {
  participants: Participant[];
  prizes: Prize[];
  settings: AppSettings;
  selectedPrizeId: string;
  onWinnerConfirmed: () => void | Promise<void>;
  onParticipantListChanged: () => void | Promise<void>;
}

export default function LuckyWheel({
  participants,
  prizes,
  settings,
  selectedPrizeId,
  onWinnerConfirmed,
  onParticipantListChanged,
}: LuckyWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSavingWinner, setIsSavingWinner] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState<Participant | null>(null);
  const [isWinnerPopupOpen, setIsWinnerPopupOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const eligibleParticipants = participants.filter((p) => {
    if (settings.allowMultipleWins) return true;
    return p.status !== 'won';
  });

  const displayParticipants = (() => {
    if (eligibleParticipants.length === 0) return [];
    if (eligibleParticipants.length <= 24) return eligibleParticipants;
    return eligibleParticipants.slice(0, 24);
  })();

  const activePrize = prizes.find(p => p.id === selectedPrizeId) || { name: 'Phần quà may mắn' };

  const colors = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#4f46e5', '#4338ca', '#6366f1'];

  const playTickSound = (frequency = 600, duration = 0.05) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Browser may block Web Audio until user interaction.
    }
  };

  const triggerConfettiExplosion = () => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 500;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 20;
    ctx.clearRect(0, 0, size, size);
    ctx.shadowColor = 'rgba(79, 70, 229, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    if (displayParticipants.length === 0) {
      const fallbackLabels = ['Tham gia ngay', 'Quà hấp dẫn', 'Đăng ký nhanh', 'Vòng quay may mắn', 'Chúc bạn may mắn', 'Zoom Livestream'];
      const arc = (2 * Math.PI) / fallbackLabels.length;

      for (let i = 0; i < fallbackLabels.length; i++) {
        const startAngle = currentRotation + i * arc;
        const endAngle = currentRotation + (i + 1) * arc;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText(fallbackLabels[i], radius - 20, 0);
        ctx.restore();
      }
    } else {
      const N = displayParticipants.length;
      const arc = (2 * Math.PI) / N;

      for (let i = 0; i < N; i++) {
        const startAngle = currentRotation + i * arc;
        const endAngle = currentRotation + (i + 1) * arc;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.max(10, Math.min(16, 280 / N));
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        let name = displayParticipants[i].fullName;
        if (name.length > 15) name = name.substring(0, 13) + '...';
        ctx.fillText(name, radius - 20, 0);
        ctx.restore();
      }
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.shadowBlur = 0;
    const lightCount = 24;
    for (let i = 0; i < lightCount; i++) {
      const angle = (i * 2 * Math.PI) / lightCount;
      const lx = cx + (radius - 1) * Math.cos(angle);
      const ly = cy + (radius - 1) * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f59e0b';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
  }, [currentRotation, displayParticipants, eligibleParticipants]);

  const startSpin = () => {
    if (isSpinning || eligibleParticipants.length === 0) return;

    setIsSpinning(true);
    setSelectedWinner(null);

    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const winner = eligibleParticipants[randomIndex];
    const visualParticipants = [...displayParticipants];
    let winnerIndexInSubset = visualParticipants.findIndex((p) => p.id === winner.id);

    if (winnerIndexInSubset === -1) {
      const substituteSlot = Math.floor(Math.random() * visualParticipants.length);
      visualParticipants[substituteSlot] = winner;
      winnerIndexInSubset = substituteSlot;
    }

    const N = visualParticipants.length;
    const arc = (2 * Math.PI) / N;
    const startingPos = currentRotation % (2 * Math.PI);
    const minRotations = 5;
    const additionalRotations = Math.floor(Math.random() * 3);
    const totalFullRotations = (minRotations + additionalRotations) * 2 * Math.PI;
    const targetFinalAngle = totalFullRotations - (Math.PI / 2) - (winnerIndexInSubset + 0.5) * arc;
    const spinDuration = 4800 + Math.random() * 1200;
    const startTime = performance.now();
    let lastTickAngle = 0;
    const tickInterval = (2 * Math.PI) / N;

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const angle = startingPos + easeOut * (targetFinalAngle - startingPos);
      setCurrentRotation(angle);

      const currentRelativeAngle = angle % (2 * Math.PI);
      if (Math.abs(currentRelativeAngle - lastTickAngle) > tickInterval) {
        playTickSound(500 - progress * 300, 0.04);
        lastTickAngle = currentRelativeAngle;
      }

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        setIsSpinning(false);
        setSelectedWinner(winner);
        setTimeout(() => playTickSound(800, 0.15), 50);
        setTimeout(() => playTickSound(1000, 0.2), 200);
        triggerConfettiExplosion();
        setTimeout(() => setIsWinnerPopupOpen(true), 800);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  const handleConfirmWinner = async () => {
    if (!selectedWinner || isSavingWinner) return;
    setIsSavingWinner(true);

    try {
      await storage.saveWinner({
        participantId: selectedWinner.id,
        fullName: selectedWinner.fullName,
        phone: selectedWinner.phone,
        address: selectedWinner.address,
        referrer: selectedWinner.referrer,
        prizeName: activePrize.name,
        status: 'not_contacted',
      });

      setIsWinnerPopupOpen(false);
      setSelectedWinner(null);
      await onWinnerConfirmed();
    } catch (error) {
      console.error('Không thể lưu người trúng giải:', error);
      alert('Không thể lưu người trúng giải. Vui lòng kiểm tra kết nối Supabase và thử lại.');
    } finally {
      setIsSavingWinner(false);
    }
  };

  const handleSpinAgain = async () => {
    setIsWinnerPopupOpen(false);
    setSelectedWinner(null);
    await onParticipantListChanged();
    setTimeout(() => startSpin(), 300);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-lg mb-4 flex items-center justify-between px-2 text-indigo-100">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium">
          <Award className="w-4.5 h-4.5 text-amber-400" />
          <span>Giải đang quay: <strong className="text-amber-400 underline">{activePrize.name}</strong></span>
        </div>
        <button
          id="toggle-wheel-sound"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${soundEnabled ? 'bg-emerald-500/25 border-emerald-500/35 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
        </button>
      </div>

      <div className="relative w-[500px] h-[500px] flex items-center justify-center my-6 filter drop-shadow-[0_20px_50px_rgba(30,27,75,0.6)]">
        <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]">
          <div className="w-8 h-10 bg-gradient-to-b from-red-500 to-amber-500 rounded-md clip-triangle" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
          <div className="absolute top-0.5 left-1 w-6 h-7 bg-amber-300 clip-triangle" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-2 border-amber-400 rounded-full" />
        </div>

        <canvas ref={canvasRef} className="rounded-full select-none" />

        <div className="absolute inset-0 m-auto w-28 h-28 rounded-full flex items-center justify-center z-20 pointer-events-auto">
          <motion.button
            id="start-spin-button"
            disabled={isSpinning || eligibleParticipants.length === 0}
            onClick={startSpin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-24 h-24 rounded-full bg-white text-slate-900 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.25)] border-4 border-amber-400 transition-all cursor-pointer select-none ${isSpinning || eligibleParticipants.length === 0 ? 'opacity-80 pointer-events-none filter saturate-50' : 'hover:scale-105 active:scale-95'}`}
          >
            <span className="text-slate-950 font-black text-xl leading-none">QUAY</span>
            <span className="text-indigo-600 font-bold text-[10px] tracking-tighter mt-1">NGAY</span>
          </motion.button>
        </div>
      </div>

      <div className="w-full max-w-lg mt-4 flex flex-col items-center gap-2">
        <div className="flex gap-4 text-xs font-semibold text-indigo-200">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Tổng người tham gia: <strong className="text-white text-sm">{participants.length}</strong>
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Đủ điều kiện quay: <strong className="text-amber-400 text-sm">{eligibleParticipants.length}</strong>
          </span>
        </div>

        {eligibleParticipants.length === 0 && (
          <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            {participants.length === 0 ? 'Chưa có người tham gia. Hãy đăng ký thông tin để bắt đầu quay!' : 'Không có người đủ điều kiện quay (Tất cả mọi người đã trúng giải).'}
          </div>
        )}
      </div>

      <WinnerPopup
        isOpen={isWinnerPopupOpen}
        winner={selectedWinner}
        prizeName={activePrize.name}
        onConfirm={handleConfirmWinner}
        onSpinAgain={handleSpinAgain}
        onClose={() => setIsWinnerPopupOpen(false)}
      />
    </div>
  );
}
