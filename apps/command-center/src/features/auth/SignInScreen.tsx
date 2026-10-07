import { Link, Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { TextField } from '@/features/expenses/components/TextField';
import { signInWithPassword } from '@/lib/data/authRepository';
import { safeRedirect } from '@/lib/security/redirects';
import { useTheme } from '@/theme';
import { AuthCard, FormMessage } from './AuthCard';
import { useSession } from './sessionStore';

export function SignInScreen() {
  const theme = useTheme();
  const status = useSession((state) => state.status);
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const target = safeRedirect(redirect);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'signedIn') return <Redirect href={target as '/dashboard'} />;
  if (status === 'preview') {
    return (
      <AuthCard
        title="Sign-in is not set up"
        description="This deployment has no Supabase project configured, so it runs as a preview with sample data. Nothing you enter is saved."
      >
        <Button label="Open the preview" onPress={() => router.replace('/dashboard')} />
      </AuthCard>
    );
  }

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await signInWithPassword(email, password);
    setBusy(false);
    if (result.ok) router.replace(target as '/dashboard');
    else {
      setPassword('');
      setError(result.message);
    }
  };

  return (
    <AuthCard title="Sign in" description="Your private command center.">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        autoCapitalize="none"
        keyboardType="email-address"
        inputMode="email"
        textContentType="emailAddress"
        maxLength={254}
        autoFocus
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        autoCapitalize="none"
        maxLength={200}
        onSubmitEditing={submit}
      />
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Button label="Sign in" loading={busy} fullWidth onPress={submit} />
      <View style={{ alignItems: 'center', gap: theme.space[1] }}>
        <Link href="/forgot-password">
          <Text variant="label" color="textSecondary" style={{ textDecorationLine: 'underline' }}>
            Forgot your password?
          </Text>
        </Link>
      </View>
    </AuthCard>
  );
}
