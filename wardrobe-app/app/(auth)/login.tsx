import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../lib/theme';
import { NBButton, NBInput } from '../../components/ui';
import api from '../../lib/axios';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const [_req, googleResponse, promptGoogleAsync] = useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID || '',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: makeRedirectUri({ useProxy: true }),
    },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (googleResponse?.type === 'success' && 'authentication' in googleResponse) {
      const token = (googleResponse as any).authentication?.accessToken;
      if (token) handleGoogleToken(token);
    }
  }, [googleResponse]);

  async function handleLogin() {
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    let valid = true;
    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    if (!password) { setPasswordError('Password is required'); valid = false; }
    if (!valid) return;

    setLoading(true);
    try {
      const { data } = await api.post<{ token: string; user: any }>('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      await login(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Login failed. Please try again.';
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleToken(accessToken: string) {
    setLoading(true);
    setGeneralError('');
    try {
      const { data } = await api.post<{ token: string; user: any }>('/api/auth/google', { accessToken });
      await login(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setGeneralError(err.response?.data?.message ?? 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  function handleGooglePress() {
    if (!GOOGLE_WEB_CLIENT_ID) {
      setGeneralError('Google sign-in not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env');
      return;
    }
    promptGoogleAsync();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={{ marginBottom: 40 }}>
          <Text style={{ color: colors.yellow, fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
            ← Back
          </Text>
        </Pressable>

        <View style={{ borderLeftWidth: 6, borderLeftColor: colors.yellow, paddingLeft: 16, marginBottom: 36 }}>
          <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 38, color: colors.white, letterSpacing: 1 }}>
            SIGN IN
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>
            Welcome back
          </Text>
        </View>

        {generalError ? (
          <View style={{ backgroundColor: colors.pink, borderWidth: 3, borderColor: colors.black, padding: 14, marginBottom: 20, shadowColor: colors.black, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
            <Text style={{ color: colors.black, fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {generalError}
            </Text>
          </View>
        ) : null}

        <NBInput label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" error={emailError} style={{ marginBottom: 16 }} />

        <NBInput label="Password" placeholder="••••••••" value={password} onChangeText={setPassword}
          secureTextEntry error={passwordError} style={{ marginBottom: 10 }} />

        <Pressable style={{ alignSelf: 'flex-end', marginBottom: 32, marginTop: 8 }}>
          <Text style={{ color: colors.yellow, fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Forgot password?
          </Text>
        </Pressable>

        <NBButton label="Sign In" onPress={handleLogin} loading={loading} fullWidth />

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: '#555', letterSpacing: 1.5 }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
        </View>

        {/* Google sign-in */}
        <Pressable
          onPress={handleGooglePress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            borderWidth: 3,
            borderColor: '#333',
            backgroundColor: colors.white,
            paddingVertical: 14,
            shadowColor: colors.white,
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 0,
            elevation: 4,
          }}
        >
          {/* Google "G" logo in brand colours */}
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.white, fontFamily: 'SpaceGrotesk-Bold', fontSize: 13 }}>G</Text>
          </View>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, letterSpacing: 0.5 }}>
            Continue with Google
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/signup')} style={{ marginTop: 28, alignItems: 'center' }}>
          <Text style={{ color: '#555', fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, letterSpacing: 0.3 }}>
            No account?{' '}
            <Text style={{ color: colors.yellow }}>Create one →</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
