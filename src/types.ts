/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Participant {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  referrer: string;
  note: string;
  registrationTime: string;
  status: 'pending' | 'won'; // 'pending' = chưa trúng, 'won' = đã trúng
  prizeName?: string;
  wonTime?: string;
}

export interface Winner {
  id: string;
  participantId: string;
  fullName: string;
  phone: string;
  address: string;
  referrer: string;
  wonTime: string;
  prizeName: string;
  status: 'not_contacted' | 'contacted' | 'sent'; // 'chưa liên hệ' | 'đã liên hệ' | 'đã gửi quà'
}

export interface Prize {
  id: string;
  name: string;
  quantity: number;
  notes: string;
  isActive: boolean;
}

export interface AppSettings {
  programName: string;
  shortDescription: string;
  referrerLabel: string;
  groupLink: string;
  successMessage: string;
  removeWinnerFromNextSpins: boolean; // Loại người đã trúng khỏi lần quay tiếp theo
  allowMultipleWins: boolean; // Cho phép trúng nhiều lần
}
