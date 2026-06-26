/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Participant, Winner, Prize, AppSettings } from '../types';

// Keys for local storage
const PARTICIPANTS_KEY = 'lucky_wheel_participants';
const WINNERS_KEY = 'lucky_wheel_winners';
const SETTINGS_KEY = 'lucky_wheel_settings';
const PRIZES_KEY = 'lucky_wheel_prizes';

// Default initial settings
const DEFAULT_SETTINGS: AppSettings = {
  programName: 'VÒNG QUAY MAY MẮN',
  shortDescription: 'Nhập thông tin bên dưới để tham gia vòng quay may mắn trong chương trình Zoom hôm nay.',
  referrerLabel: 'Ai giới thiệu bạn vào nhóm chuyên sâu?',
  groupLink: 'https://zalo.me/g/luckywheel-chuyensau',
  successMessage: 'Anh/chị đã đăng ký thành công. Vui lòng theo dõi phần quay số trong chương trình.',
  removeWinnerFromNextSpins: true,
  allowMultipleWins: false,
};

// Default initial prizes
const DEFAULT_PRIZES: Prize[] = [
  { id: 'prize_1', name: 'Giải Nhất - iPad Gen 10 Wifi 64GB', quantity: 1, notes: 'Quà tặng công nghệ đặc biệt', isActive: true },
  { id: 'prize_2', name: 'Giải Nhì - Tai nghe AirPods 3', quantity: 2, notes: 'Dành cho thành viên nhiệt tình', isActive: true },
  { id: 'prize_3', name: 'Giải Ba - Sạc Dự Phòng Anker 20W', quantity: 3, notes: 'Sạc nhanh tiện lợi', isActive: true },
  { id: 'prize_4', name: 'Phần quà may mắn', quantity: 10, notes: 'Voucher học tập chuyên sâu trị giá 500k', isActive: true }
];

// Default mock participants as requested by user
const DEFAULT_PARTICIPANTS: Participant[] = [
  {
    id: 'part_1',
    fullName: 'Nguyễn Văn An',
    phone: '0912345678',
    address: '12 Cầu Giấy, Hà Nội',
    referrer: 'Thầy Minh Zoom',
    note: 'Đăng ký sớm nhất',
    registrationTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    status: 'pending'
  },
  {
    id: 'part_2',
    fullName: 'Trần Thị Bình',
    phone: '0987654321',
    address: '456 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    referrer: 'Chị Lan Facebook',
    note: 'Khách hàng thân thiết',
    registrationTime: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'pending'
  },
  {
    id: 'part_3',
    fullName: 'Lê Minh Cường',
    phone: '0901111222',
    address: '78 Hải Phòng, Thanh Khê, Đà Nẵng',
    referrer: 'Tự tìm hiểu qua Youtube',
    note: 'Rất mong chờ nhận quà',
    registrationTime: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: 'pending'
  },
  {
    id: 'part_4',
    fullName: 'Phạm Thu Dung',
    phone: '0933333444',
    address: '89 Ba Cu, Vũng Tàu',
    referrer: 'Anh Hoàng Gia Huy',
    note: '',
    registrationTime: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'pending'
  },
  {
    id: 'part_5',
    fullName: 'Hoàng Gia Huy',
    phone: '0977777888',
    address: '123 Hùng Vương, Nha Trang',
    referrer: 'Group Zalo',
    note: 'Muốn nhận giải Nhất',
    registrationTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'pending'
  },
  {
    id: 'part_6',
    fullName: 'Đỗ Thanh Mai',
    phone: '0966666555',
    address: '56 Trần Phú, Hải Phòng',
    referrer: 'Thầy Minh Zoom',
    note: '',
    registrationTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    status: 'pending'
  },
  {
    id: 'part_7',
    fullName: 'Vũ Ngọc Lan',
    phone: '0944444333',
    address: '321 Quang Trung, Hà Đông, Hà Nội',
    referrer: 'Bạn bè giới thiệu',
    note: 'Thành viên mới tinh',
    registrationTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'pending'
  },
  {
    id: 'part_8',
    fullName: 'Bùi Anh Tuấn',
    phone: '0922222111',
    address: '14 Nguyễn Chí Thanh, Cần Thơ',
    referrer: 'Chị Lan Facebook',
    note: 'Đã share bài viết',
    registrationTime: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    status: 'pending'
  }
];

// Helper to load or initialize from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading key "${key}" from localStorage:`, error);
  }
  // If not found, save default and return it
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving key "${key}" to localStorage:`, error);
  }
}

// Storage Operations - Design for easy upgrade to Cloud Database (Firebase)
export const storage = {
  // Settings
  getSettings(): AppSettings {
    return loadFromStorage<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  },

  updateSettings(updates: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    saveToStorage(SETTINGS_KEY, updated);
    return updated;
  },

  // Prizes
  getPrizes(): Prize[] {
    return loadFromStorage<Prize[]>(PRIZES_KEY, DEFAULT_PRIZES);
  },

  savePrize(prize: Omit<Prize, 'id'>): Prize {
    const prizes = this.getPrizes();
    const newPrize: Prize = {
      ...prize,
      id: `prize_${Date.now()}`,
    };
    prizes.push(newPrize);
    saveToStorage(PRIZES_KEY, prizes);
    return newPrize;
  },

  updatePrize(id: string, updates: Partial<Prize>): Prize {
    const prizes = this.getPrizes();
    const index = prizes.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Prize with id ${id} not found`);
    }
    const updatedPrize = { ...prizes[index], ...updates };
    prizes[index] = updatedPrize;
    saveToStorage(PRIZES_KEY, prizes);
    return updatedPrize;
  },

  deletePrize(id: string): void {
    const prizes = this.getPrizes();
    const filtered = prizes.filter(p => p.id !== id);
    saveToStorage(PRIZES_KEY, filtered);
  },

  // Participants
  getParticipants(): Participant[] {
    return loadFromStorage<Participant[]>(PARTICIPANTS_KEY, DEFAULT_PARTICIPANTS);
  },

  addParticipant(participant: Omit<Participant, 'id' | 'registrationTime' | 'status'>): Participant {
    const participants = this.getParticipants();
    
    // Check duplication of phone number
    const isDuplicate = participants.some(
      p => p.phone.replace(/[\s.-]/g, '') === participant.phone.replace(/[\s.-]/g, '')
    );
    if (isDuplicate) {
      throw new Error('DUPLICATE_PHONE');
    }

    const newParticipant: Participant = {
      ...participant,
      id: `part_${Date.now()}`,
      registrationTime: new Date().toISOString(),
      status: 'pending'
    };

    participants.unshift(newParticipant); // Add new registration to the top
    saveToStorage(PARTICIPANTS_KEY, participants);
    return newParticipant;
  },

  updateParticipant(id: string, updates: Partial<Participant>): Participant {
    const participants = this.getParticipants();
    const index = participants.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Participant with id ${id} not found`);
    }
    const updated = { ...participants[index], ...updates };
    participants[index] = updated;
    saveToStorage(PARTICIPANTS_KEY, participants);
    return updated;
  },

  deleteParticipant(id: string): void {
    const participants = this.getParticipants();
    const filtered = participants.filter(p => p.id !== id);
    saveToStorage(PARTICIPANTS_KEY, filtered);

    // Also optionally remove matching winners, or keep them for logs
  },

  // Winners
  getWinners(): Winner[] {
    return loadFromStorage<Winner[]>(WINNERS_KEY, []);
  },

  saveWinner(winnerInput: Omit<Winner, 'id' | 'wonTime'>): Winner {
    const winners = this.getWinners();
    const newWinner: Winner = {
      ...winnerInput,
      id: `winner_${Date.now()}`,
      wonTime: new Date().toISOString(),
    };

    winners.unshift(newWinner); // Add latest winner to top
    saveToStorage(WINNERS_KEY, winners);

    // Also update matching participant status
    try {
      this.updateParticipant(winnerInput.participantId, {
        status: 'won',
        prizeName: winnerInput.prizeName,
        wonTime: newWinner.wonTime
      });
    } catch (e) {
      console.warn('Participant might have been deleted but spun', e);
    }

    return newWinner;
  },

  updateWinnerStatus(id: string, status: Winner['status']): Winner {
    const winners = this.getWinners();
    const index = winners.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error(`Winner with id ${id} not found`);
    }
    const updated = { ...winners[index], ...status === undefined ? {} : { status } };
    winners[index] = updated;
    saveToStorage(WINNERS_KEY, winners);
    return updated;
  },

  deleteWinner(id: string): void {
    const winners = this.getWinners();
    const index = winners.findIndex(w => w.id === id);
    if (index !== -1) {
      const winner = winners[index];
      // Reset participant status
      try {
        this.updateParticipant(winner.participantId, {
          status: 'pending',
          prizeName: undefined,
          wonTime: undefined
        });
      } catch (e) {
        console.warn('Could not reset participant status', e);
      }
      
      const filtered = winners.filter(w => w.id !== id);
      saveToStorage(WINNERS_KEY, filtered);
    }
  },

  // Helper to reset all data for demo purposes
  resetAllData(): void {
    localStorage.removeItem(PARTICIPANTS_KEY);
    localStorage.removeItem(WINNERS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(PRIZES_KEY);
    // Reload defaults
    this.getSettings();
    this.getPrizes();
    this.getParticipants();
  }
};
