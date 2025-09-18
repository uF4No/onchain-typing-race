export interface GameResults {
  totalLetters: number;
  totalWords: number;
  totalTransactions: number;
  tps: number; // transactions per second
  wpm: number; // words per minute
  gameTime: number; // actual game duration in seconds
  timestamp: number;
}

export interface GameTransaction {
  id?: string;
  type: 'letter' | 'word' | 'startGame' | 'completeGame';
  data: string;
  timestamp: number;
  hash?: string;
  status: 'pending' | 'sent' | 'confirmed' | 'failed';
  error?: string;
}
