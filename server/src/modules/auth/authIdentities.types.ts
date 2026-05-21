export type AuthProvider = 'telegram' | 'google' | 'email';

export type AuthIdentityRow = {
  id: string;
  profile_id: string;
  provider: AuthProvider;
  provider_user_id: string;
  email: string | null;
  created_at: Date | string;
};

export type AuthIdentityPublic = {
  provider: AuthProvider;
  email: string | null;
  linkedAt: string;
  emailVerified?: boolean;
};
