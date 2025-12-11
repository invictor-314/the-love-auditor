export enum AppView {
  HOME = 'HOME',
  LOADING = 'LOADING',
  RESULT_FREE = 'RESULT_FREE',
  AUTH = 'AUTH',
  PREMIUM_DASHBOARD = 'PREMIUM_DASHBOARD',
  PROFILE = 'PROFILE',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum RelationshipStatus {
  DATING = 'Dating',
  MARRIED = 'Married',
  EX = 'Ex',
  TALKING = 'Talking Stage',
  SITUATIONALSHIP = 'Situationship',
}

export interface AuditData {
  gender: Gender;
  status: RelationshipStatus;
  chatHistory: string;
  screenshot?: string; // Base64 string of the uploaded image
}

export interface RoastResult {
  toxicityScore: number; // 0-100
  verdict: string;
  shortAnalysis: string;
  hiddenRedFlagsCount: number;
  detailedAnalysis?: string; // Premium only
  redFlagsList?: string[]; // Premium only
  advice?: string; // Premium only
}

export interface User {
  email: string;
  username: string;
  isPremium: boolean;
}