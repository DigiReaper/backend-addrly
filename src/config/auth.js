import { betterAuth } from 'better-auth';
import { supabaseAdapter } from 'better-auth/adapters/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const auth = betterAuth({
  database: supabaseAdapter(supabase),
  emailAndPassword: {
    enabled: false // We're using only Google OAuth
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },
  advanced: {
    cookiePrefix: 'datemедoc',
    useSecureCookies: process.env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: false
    }
  },
  trustedOrigins: [
    process.env.FRONTEND_URL,
    process.env.BASE_URL
  ]
});

export default auth;
