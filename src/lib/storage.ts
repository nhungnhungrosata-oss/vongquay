/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Participant, Winner, Prize, AppSettings } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// Keys for local storage fallback
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
  { id: 'prize_1', name: 'Phần quà may mắn', quantity: 10, notes: 'Quà tặng trong chương trình', isActive: true },
];

// Default mock participants for local fallback only
const DEFAULT_PARTICIPANTS: Participant[] = [];

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading key "${key}" from localStorage:`, error);
  }
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

const mapParticipantFromDb = (row: any): Participant => ({
  id: row.id,
  fullName: row.full_name,
  phone: row.phone,
  address: row.address,
  referrer: row.referrer,
  note: row.note || '',
  registrationTime: row.registration_time,
  status: row.status || 'pending',
  prizeName: row.prize_name || undefined,
  wonTime: row.won_time || undefined,
});

const mapWinnerFromDb = (row: any): Winner => ({
  id: row.id,
  participantId: row.participant_id || '',
  fullName: row.full_name,
  phone: row.phone,
  address: row.address || '',
  referrer: row.referrer || '',
  wonTime: row.won_time,
  prizeName: row.prize_name,
  status: row.status || 'not_contacted',
});

const mapPrizeFromDb = (row: any): Prize => ({
  id: row.id,
  name: row.name,
  quantity: Number(row.quantity || 1),
  notes: row.notes || '',
  isActive: Boolean(row.is_active),
});

const mapSettingsFromDb = (row: any): AppSettings => ({
  programName: row?.program_name || DEFAULT_SETTINGS.programName,
  shortDescription: row?.short_description || DEFAULT_SETTINGS.shortDescription,
  referrerLabel: row?.referrer_label || DEFAULT_SETTINGS.referrerLabel,
  groupLink: row?.group_link || '',
  successMessage: row?.success_message || DEFAULT_SETTINGS.successMessage,
  removeWinnerFromNextSpins: row?.remove_winner_from_next_spins ?? DEFAULT_SETTINGS.removeWinnerFromNextSpins,
  allowMultipleWins: row?.allow_multiple_wins ?? DEFAULT_SETTINGS.allowMultipleWins,
});

// Storage operations. Uses Supabase when configured, otherwise localStorage fallback.
export const storage = {
  usingSupabase: isSupabaseConfigured,

  // Settings
  async getSettings(): Promise<AppSettings> {
    if (supabase) {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) {
        console.error('Supabase getSettings error:', error);
        return DEFAULT_SETTINGS;
      }

      return mapSettingsFromDb(data);
    }

    return loadFromStorage<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    if (supabase) {
      const payload = {
        id: 'default',
        program_name: updates.programName,
        short_description: updates.shortDescription,
        referrer_label: updates.referrerLabel,
        group_link: updates.groupLink,
        success_message: updates.successMessage,
        remove_winner_from_next_spins: updates.removeWinnerFromNextSpins,
        allow_multiple_wins: updates.allowMultipleWins,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('app_settings')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) throw error;
      return mapSettingsFromDb(data);
    }

    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    saveToStorage(SETTINGS_KEY, updated);
    return updated;
  },

  // Prizes
  async getPrizes(): Promise<Prize[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('prizes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase getPrizes error:', error);
        return [];
      }

      return (data || []).map(mapPrizeFromDb);
    }

    return loadFromStorage<Prize[]>(PRIZES_KEY, DEFAULT_PRIZES);
  },

  async savePrize(prize: Omit<Prize, 'id'>): Promise<Prize> {
    if (supabase) {
      const { data, error } = await supabase
        .from('prizes')
        .insert({
          name: prize.name,
          quantity: prize.quantity,
          notes: prize.notes,
          is_active: prize.isActive,
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapPrizeFromDb(data);
    }

    const prizes = await this.getPrizes();
    const newPrize: Prize = { ...prize, id: `prize_${Date.now()}` };
    prizes.push(newPrize);
    saveToStorage(PRIZES_KEY, prizes);
    return newPrize;
  },

  async updatePrize(id: string, updates: Partial<Prize>): Promise<Prize> {
    if (supabase) {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.quantity !== undefined) payload.quantity = updates.quantity;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('prizes')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return mapPrizeFromDb(data);
    }

    const prizes = await this.getPrizes();
    const index = prizes.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Prize with id ${id} not found`);

    const updatedPrize = { ...prizes[index], ...updates };
    prizes[index] = updatedPrize;
    saveToStorage(PRIZES_KEY, prizes);
    return updatedPrize;
  },

  async deletePrize(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('prizes').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const prizes = await this.getPrizes();
    saveToStorage(PRIZES_KEY, prizes.filter(p => p.id !== id));
  },

  // Participants
  async getParticipants(): Promise<Participant[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('registration_time', { ascending: false });

      if (error) {
        console.error('Supabase getParticipants error:', error);
        return [];
      }

      return (data || []).map(mapParticipantFromDb);
    }

    return loadFromStorage<Participant[]>(PARTICIPANTS_KEY, DEFAULT_PARTICIPANTS);
  },

  async addParticipant(participant: Omit<Participant, 'id' | 'registrationTime' | 'status'>): Promise<Participant> {
    if (supabase) {
      const { data, error } = await supabase
        .from('participants')
        .insert({
          full_name: participant.fullName,
          phone: participant.phone,
          address: participant.address,
          referrer: participant.referrer,
          note: participant.note || '',
          status: 'pending',
        })
        .select('*')
        .single();

      if (error) {
        if ((error as any).code === '23505') throw new Error('DUPLICATE_PHONE');
        throw error;
      }

      return mapParticipantFromDb(data);
    }

    const participants = await this.getParticipants();
    const isDuplicate = participants.some(
      p => p.phone.replace(/[\s.-]/g, '') === participant.phone.replace(/[\s.-]/g, '')
    );
    if (isDuplicate) throw new Error('DUPLICATE_PHONE');

    const newParticipant: Participant = {
      ...participant,
      id: `part_${Date.now()}`,
      registrationTime: new Date().toISOString(),
      status: 'pending',
    };

    participants.unshift(newParticipant);
    saveToStorage(PARTICIPANTS_KEY, participants);
    return newParticipant;
  },

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant> {
    if (supabase) {
      const payload: Record<string, any> = {};
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.referrer !== undefined) payload.referrer = updates.referrer;
      if (updates.note !== undefined) payload.note = updates.note;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.prizeName !== undefined) payload.prize_name = updates.prizeName;
      if (updates.wonTime !== undefined) payload.won_time = updates.wonTime;

      const { data, error } = await supabase
        .from('participants')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        if ((error as any).code === '23505') throw new Error('DUPLICATE_PHONE');
        throw error;
      }

      return mapParticipantFromDb(data);
    }

    const participants = await this.getParticipants();
    const index = participants.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Participant with id ${id} not found`);

    const updated = { ...participants[index], ...updates };
    participants[index] = updated;
    saveToStorage(PARTICIPANTS_KEY, participants);
    return updated;
  },

  async deleteParticipant(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('participants').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const participants = await this.getParticipants();
    saveToStorage(PARTICIPANTS_KEY, participants.filter(p => p.id !== id));
  },

  // Winners
  async getWinners(): Promise<Winner[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('winners')
        .select('*')
        .order('won_time', { ascending: false });

      if (error) {
        console.error('Supabase getWinners error:', error);
        return [];
      }

      return (data || []).map(mapWinnerFromDb);
    }

    return loadFromStorage<Winner[]>(WINNERS_KEY, []);
  },

  async saveWinner(winnerInput: Omit<Winner, 'id' | 'wonTime'>): Promise<Winner> {
    const wonTime = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from('winners')
        .insert({
          participant_id: winnerInput.participantId || null,
          full_name: winnerInput.fullName,
          phone: winnerInput.phone,
          address: winnerInput.address,
          referrer: winnerInput.referrer,
          prize_name: winnerInput.prizeName,
          status: winnerInput.status,
          won_time: wonTime,
        })
        .select('*')
        .single();

      if (error) throw error;

      if (winnerInput.participantId) {
        await this.updateParticipant(winnerInput.participantId, {
          status: 'won',
          prizeName: winnerInput.prizeName,
          wonTime,
        });
      }

      return mapWinnerFromDb(data);
    }

    const winners = await this.getWinners();
    const newWinner: Winner = {
      ...winnerInput,
      id: `winner_${Date.now()}`,
      wonTime,
    };

    winners.unshift(newWinner);
    saveToStorage(WINNERS_KEY, winners);

    try {
      await this.updateParticipant(winnerInput.participantId, {
        status: 'won',
        prizeName: winnerInput.prizeName,
        wonTime: newWinner.wonTime,
      });
    } catch (e) {
      console.warn('Participant might have been deleted but spun', e);
    }

    return newWinner;
  },

  async updateWinnerStatus(id: string, status: Winner['status']): Promise<Winner> {
    if (supabase) {
      const { data, error } = await supabase
        .from('winners')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return mapWinnerFromDb(data);
    }

    const winners = await this.getWinners();
    const index = winners.findIndex(w => w.id === id);
    if (index === -1) throw new Error(`Winner with id ${id} not found`);

    const updated = { ...winners[index], status };
    winners[index] = updated;
    saveToStorage(WINNERS_KEY, winners);
    return updated;
  },

  async deleteWinner(id: string): Promise<void> {
    if (supabase) {
      const { data: winner, error: fetchError } = await supabase
        .from('winners')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const { error: deleteError } = await supabase.from('winners').delete().eq('id', id);
      if (deleteError) throw deleteError;

      if (winner?.participant_id) {
        await this.updateParticipant(winner.participant_id, {
          status: 'pending',
          prizeName: undefined,
          wonTime: undefined,
        });
      }
      return;
    }

    const winners = await this.getWinners();
    const index = winners.findIndex(w => w.id === id);
    if (index !== -1) {
      const winner = winners[index];
      try {
        await this.updateParticipant(winner.participantId, {
          status: 'pending',
          prizeName: undefined,
          wonTime: undefined,
        });
      } catch (e) {
        console.warn('Could not reset participant status', e);
      }

      saveToStorage(WINNERS_KEY, winners.filter(w => w.id !== id));
    }
  },

  async resetAllData(): Promise<void> {
    if (supabase) {
      await supabase.from('winners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('prizes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('app_settings').upsert({
        id: 'default',
        program_name: DEFAULT_SETTINGS.programName,
        short_description: DEFAULT_SETTINGS.shortDescription,
        referrer_label: DEFAULT_SETTINGS.referrerLabel,
        group_link: DEFAULT_SETTINGS.groupLink,
        success_message: DEFAULT_SETTINGS.successMessage,
        remove_winner_from_next_spins: DEFAULT_SETTINGS.removeWinnerFromNextSpins,
        allow_multiple_wins: DEFAULT_SETTINGS.allowMultipleWins,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      await supabase.from('prizes').insert(DEFAULT_PRIZES.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        notes: p.notes,
        is_active: p.isActive,
      })));
      return;
    }

    localStorage.removeItem(PARTICIPANTS_KEY);
    localStorage.removeItem(WINNERS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(PRIZES_KEY);
    await this.getSettings();
    await this.getPrizes();
    await this.getParticipants();
  },
};
