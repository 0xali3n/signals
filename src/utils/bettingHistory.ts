// Betting history utility for storing user betting activity by wallet address

export interface BettingHistoryEntry {
  id: string;
  walletAddress: string; // Wallet address that placed the bet
  priceLevel: number;
  timestamp: number; // Column timestamp
  betAmount: number;
  betTime: number; // When bet was placed
  result?: 'win' | 'lose' | 'pending';
  actualPrice?: number; // Price when column was hit
  payout?: number; // Amount won (if win)
  netGain?: number; // Net gain/loss
}

const HISTORY_KEY = 'signals-betting-history';
const SELECTED_BLOCKS_KEY = 'signals-selected-blocks';

// Get betting history for a specific wallet address
export function getBettingHistory(walletAddress: string): BettingHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const allHistory: BettingHistoryEntry[] = JSON.parse(stored);
    // Filter by wallet address
    return allHistory.filter(entry => entry.walletAddress === walletAddress);
  } catch {
    return [];
  }
}

// Get all betting history (for admin/debugging)
export function getAllBettingHistory(): BettingHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Add a new betting history entry
export function addBettingHistory(entry: BettingHistoryEntry): void {
  try {
    const allHistory = getAllBettingHistory();
    allHistory.unshift(entry); // Add to beginning (newest first)
    // Keep only last 500 entries total (across all wallets)
    const limited = allHistory.slice(0, 500);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Failed to save betting history:', error);
  }
}

// Update a history entry (e.g., when result is known)
export function updateBettingHistory(
  id: string,
  walletAddress: string,
  updates: Partial<BettingHistoryEntry>
): void {
  try {
    const allHistory = getAllBettingHistory();
    const index = allHistory.findIndex((entry) => entry.id === id && entry.walletAddress === walletAddress);
    if (index >= 0) {
      allHistory[index] = { ...allHistory[index], ...updates };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
    } else {
      // Log warning if entry not found (for debugging)
      console.warn(`Betting history entry not found: id=${id}, wallet=${walletAddress}`);
    }
  } catch (error) {
    console.error('Failed to update betting history:', error);
  }
}

// Clear history for a specific wallet
export function clearBettingHistory(walletAddress: string): void {
  try {
    const allHistory = getAllBettingHistory();
    const filtered = allHistory.filter(entry => entry.walletAddress !== walletAddress);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to clear betting history:', error);
  }
}

// Clear all history (all wallets)
export function clearAllBettingHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear all betting history:', error);
  }
}

// Selected blocks persistence (by wallet address)
export interface SelectedBlock {
  priceLevel: number;
  timestamp: number;
  betId?: string;
}

export function getSelectedBlocks(walletAddress: string): SelectedBlock[] {
  try {
    const stored = localStorage.getItem(`${SELECTED_BLOCKS_KEY}-${walletAddress}`);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveSelectedBlocks(walletAddress: string, blocks: SelectedBlock[]): void {
  try {
    localStorage.setItem(`${SELECTED_BLOCKS_KEY}-${walletAddress}`, JSON.stringify(blocks));
  } catch (error) {
    console.error('Failed to save selected blocks:', error);
  }
}

export function clearSelectedBlocks(walletAddress: string): void {
  try {
    localStorage.removeItem(`${SELECTED_BLOCKS_KEY}-${walletAddress}`);
  } catch (error) {
    console.error('Failed to clear selected blocks:', error);
  }
}
