export type PopulationBracket = "0-500" | "501-800" | "801-1000" | ">1000";

export const POPULATION_BRACKETS: PopulationBracket[] = [
  "0-500",
  "501-800",
  "801-1000",
  ">1000",
];

export const POPULATION_BRACKET_LABELS: Record<PopulationBracket, string> = {
  "0-500": "0 – 500 hab.",
  "501-800": "501 – 800 hab.",
  "801-1000": "801 – 1 000 hab.",
  ">1000": "> 1 000 hab.",
};

export type PopulationBracketStats = {
  bracket: PopulationBracket;
  communeCount: number;
  avgMembers: number;
  avgPendingInvites: number;
};

export type PopulationStatsResult = {
  brackets: PopulationBracketStats[];
  communesWithoutPopulation: number;
};

export type GlobalUserStats = {
  totalUsers: number;
  pendingInvitations: number;
};

export type UserListRow = {
  userId: string;
  fullName: string;
  email: string | null;
  createdAt: string;
  isPlatformAdmin: boolean;
  bannedAt: string | null;
  communeCount: number;
  totalContentCount: number;
};
