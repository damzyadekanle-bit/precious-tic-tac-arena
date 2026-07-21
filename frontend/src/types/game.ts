export type Mark = 'X' | 'O';
export type Cell = Mark | null;
export interface PublicPlayer { id: string; nickname: string; avatar: string; mark: Mark; connected: boolean; rematchRequested: boolean }
export interface PublicRoom { code: string; board: Cell[]; turn: Mark; status: 'waiting' | 'playing' | 'finished'; winner: Mark | 'draw' | null; winningLine: number[]; players: PublicPlayer[]; scores: { X: number; O: number; draws: number } }
