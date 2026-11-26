// Supabase Auth errors → the app's text keys (AuthScreen authErrorKey), so the website says
// the same as the app.
export function authErrorKey(e: { code?: string; message?: string; name?: string } | null | undefined): string {
  const code = e?.code ?? '';
  const msg = (e?.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'errorInvalidCredentials';
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) return 'errorUserExists';
  if (code === 'weak_password' || msg.includes('password should')) return 'errorWeakPassword';
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'errorEmailInvalid';
  if (code.startsWith('over_') || msg.includes('rate limit')) return 'errorRateLimit';
  if (e?.name === 'AuthRetryableFetchError' || msg.includes('network') || msg.includes('failed to fetch')) return 'errorNetwork';
  return 'errorGeneric';
}
