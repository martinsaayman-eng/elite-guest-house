
import { useState, useEffect } from 'react';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { UserContext, UserRole } from '../types';
import { DEFAULT_TENANT_ID, DEFAULT_PROPERTY_ID } from '../constants';

const rawUrl = process.env.SUPABASE_URL;
const rawKey = process.env.SUPABASE_ANON_KEY;
const isConfigured = !!(rawUrl && rawKey && rawUrl !== "" && rawUrl !== "undefined");
const supabaseClient = isConfigured ? createClient(rawUrl as string, rawKey as string) : null;

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isConfigured);
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  useEffect(() => {
    if (!supabaseClient) {
      setAuthLoading(false);
      // Fallback context for local storage mode
      setUserContext({
        tenant_id: DEFAULT_TENANT_ID,
        property_id: DEFAULT_PROPERTY_ID,
        roles: ['admin']
      });
      return;
    }

    const updateContext = (sess: Session | null) => {
      setSession(sess);
      if (sess?.user) {
        // We assume metadata contains these fields. In a real app, this might come from a 'profiles' table.
        const meta = sess.user.user_metadata;
        setUserContext({
          tenant_id: meta.tenant_id || DEFAULT_TENANT_ID,
          property_id: meta.property_id || DEFAULT_PROPERTY_ID,
          roles: meta.roles || ['staff']
        });
      } else {
        setUserContext(null);
      }
    };

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      updateContext(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      updateContext(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (role: UserRole) => userContext?.roles.includes(role) || false;

  return { session, authLoading, isConfigured, supabase: supabaseClient, userContext, hasRole };
};
