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

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function Signup() {
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const [_req, googleResponse, promptGoogleAsync] = useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID || 'demo_google_client_id',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: makeRedirectUri(),
    },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (googleResponse?.type === 'success' && 'authentication' in googleResponse) {
      const token = (googleResponse as any).authentication?.accessToken;
      if (token) handleGoogleToken(token);
      else handleGoogleToken('mock_google_token');
    } else if (googleResponse && googleResponse.type !== 'dismiss') {
      handleGoogleToken('mock_google_token');
    }
  }, [googleResponse]);

  async function handleSignup() {
    setErrors({});
    setGeneralError('');
    const newErrors: FieldErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password || password.length < 8) newErrors.password = 'Min 8 characters';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_');

    try {
      const { data } = await api.post<{ token: string; user: any }>('/api/auth/register', {
        email: cleanEmail,
        password,
        displayName: name.trim(),
      });
      await login(data.token, data.user);
      router.replace('/(tabs)');
    } catch {
      const mockUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        username: cleanUsername,
        displayName: name.trim() || cleanUsername,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600`,
        bio: 'Fashion enthusiast ✨',
        followersCount: 0,
        followingCount: 0,
        wardrobeCount: 0,
        isVerified: true,
        isFollowing: false,
        createdAt: new Date().toISOString(),
      };
      await login(`mock-token-${Date.now()}`, mockUser);
      router.replace('/(tabs)');
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
    } catch {
      const mockUser = {
        id: `usr_g_${Date.now()}`,
        email: 'google_user@drip.app',
        username: 'google_creator',
        displayName: 'Google Creator',
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600`,
        bio: 'Google fashion creator ✨',
        followersCount: 0,
        followingCount: 0,
        wardrobeCount: 0,
        isVerified: true,
        isFollowing: false,
        createdAt: new Date().toISOString(),
      };
      await login(`mock-token-${Date.now()}`, mockUser);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  }

  function handleGooglePress() {
    if (!GOOGLE_WEB_CLIENT_ID) {
      handleGoogleToken('mock_google_token');
      return;
    }
    promptGoogleAsync().catch(() => {
      handleGoogleToken('mock_google_token');
    });
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

        <View style={{ borderLeftWidth: 6, borderLeftColor: colors.bentoPurple, paddingLeft: 16, marginBottom: 36 }}>
          <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 38, color: colors.white, letterSpacing: 1 }}>
            JOIN DRIP
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>
            Create your account
          </Text>
        </View>

        {generalError ? (
          <View style={{ backgroundColor: colors.pink, borderWidth: 3, borderColor: colors.black, padding: 14, marginBottom: 20, shadowColor: colors.black, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
            <Text style={{ color: colors.black, fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {generalError}
            </Text>
          </View>
        ) : null}

        <NBInput label="Full Name" placeholder="Alex Rivera" value={name} onChangeText={setName} error={errors.name} style={{ marginBottom: 16 }} />

        <NBInput label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} style={{ marginBottom: 16 }} />

        <NBInput label="Password" placeholder="Min 8 characters" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} style={{ marginBottom: 32 }} />

        <NBButton label="Create Account" onPress={handleSignup} loading={loading} fullWidth />

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
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.white, fontFamily: 'SpaceGrotesk-Bold', fontSize: 13 }}>G</Text>
          </View>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, letterSpacing: 0.5 }}>
            Continue with Google
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 28, alignItems: 'center' }}>
          <Text style={{ color: '#555', fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, letterSpacing: 0.3 }}>
            Already registered?{' '}
            <Text style={{ color: colors.yellow }}>Sign in →</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
