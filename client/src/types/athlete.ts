// Consent status types
export type ConsentStatus = 'pending' | 'active' | 'declined';

// Gender types
export type Gender = 'male' | 'female' | 'other';

// Athlete interface - full athlete object from API
export interface Athlete {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  parentEmail: string;
  consentStatus: ConsentStatus;
  createdAt: string;
  avatarUrl?: string;
}

// Athlete creation data - used when creating new athlete
export interface AthleteCreate {
  name: string;
  age: number;
  gender: Gender;
  parentEmail: string;
}

// Athlete update data - used when updating existing athlete
export interface AthleteUpdate {
  name?: string;
  age?: number;
  gender?: Gender;
  parentEmail?: string;
}
