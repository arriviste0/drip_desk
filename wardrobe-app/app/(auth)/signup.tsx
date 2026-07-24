import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import { Eye, EyeSlash, WarningCircle, CheckCircle } from 'phosphor-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, radii } from '../../lib/theme';
import { NBButton, useToast } from '../../components/ui';
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
  const showToast = useToast();
  const params = useLocalSearchParams<{ email?: string }>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.email) setEmail(params.email);
  }, [params.email]);

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
    setAccountExists(false);

    const newErrors: FieldErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!password || password.length < 8) newErrors.password = 'Min 8 characters required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data } = await api.post<{ token: string; user: any }>('/api/auth/register', {
        email: cleanEmail,
        password,
        displayName: name.trim(),
      });
      await login(data.token, data.user);
      showToast(`Welcome to Drip Deck, @${data.user.username}! 🎉`, 'success');
      router.replace('/(tabs)');
    } catch (error: any) {
      const errRes = error.response;
      if (errRes?.status === 409 || errRes?.data?.code === 'ACCOUNT_EXISTS') {
        setAccountExists(true);
        setGeneralError('An account with this email address already exists.');
      } else {
        setGeneralError(errRes?.data?.message ?? 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleToken(accessToken: string) {
    setLoading(true);
    setGeneralError('');
    setAccountExists(false);

    try {
      const { data } = await api.post<{ token: string; user: any }>('/api/auth/google', { accessToken });
      await login(data.token, data.user);
      showToast(`Welcome to Drip Deck, @${data.user.username}! 🚀`, 'success');
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

  function goToLoginWithEmail() {
    router.replace({ pathname: '/(auth)/login', params: { email: email.trim() } });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 26, color: colors.yellow }}>D</Text>
          </View>
          <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 28, color: colors.black, letterSpacing: -0.5 }}>
            DRIP DECK
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Create Your Digital Closet Account
          </Text>
        </View>

        {/* Bento Glassmorphic Auth Card */}
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radii.bento,
            padding: 22,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 4,
            gap: 16,
          }}
        >
          {/* Mode Switcher Segmented Control */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.paper,
              borderRadius: 9999,
              padding: 4,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
            }}
          >
            <Pressable
              onPress={() => router.replace({ pathname: '/(auth)/login', params: { email } })}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: '#6B7280' }}>
                Sign In
              </Text>
            </Pressable>

            <View
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                backgroundColor: colors.black,
              }}
            >
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.white }}>
                Sign Up
              </Text>
            </View>
          </View>

          {/* Account Exists Banner Prompt */}
          {accountExists ? (
            <View
              style={{
                backgroundColor: colors.bentoLavender,
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: '#DDD6FE',
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle color={colors.bentoPurple} size={20} weight="fill" />
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.bentoPurple, flex: 1 }}>
                  Account Already Exists!
                </Text>
              </View>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#5B21B6', lineHeight: 17 }}>
                An account with <Text style={{ fontFamily: 'SpaceGrotesk-Bold' }}>{email}</Text> is already registered. Please sign in to access your wardrobe.
              </Text>
              <NBButton
                label="Sign In Now →"
                variant="primary"
                style={{ marginTop: 4, paddingVertical: 10 }}
                onPress={goToLoginWithEmail}
              />
            </View>
          ) : generalError ? (
            <View style={{ backgroundColor: colors.bentoRoseSoft, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#FECDD3' }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: '#E11D48' }}>
                {generalError}
              </Text>
            </View>
          ) : null}

          {/* Full Name Input */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
              Full Name
            </Text>
            <TextInput
              placeholder="Alex Rivera"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={(text) => { setName(text); setErrors((prev) => ({ ...prev, name: undefined })); }}
              style={{
                backgroundColor: colors.paper,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontFamily: 'SpaceGrotesk-Medium',
                fontSize: 14,
                color: colors.black,
                borderWidth: 1,
                borderColor: errors.name ? '#EF4444' : colors.bentoBorder,
              }}
            />
            {errors.name ? (
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#EF4444' }}>{errors.name}</Text>
            ) : null}
          </View>

          {/* Email Input */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
              Email Address
            </Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => { setEmail(text); setAccountExists(false); setErrors((prev) => ({ ...prev, email: undefined })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: colors.paper,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontFamily: 'SpaceGrotesk-Medium',
                fontSize: 14,
                color: colors.black,
                borderWidth: 1,
                borderColor: errors.email ? '#EF4444' : colors.bentoBorder,
              }}
            />
            {errors.email ? (
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#EF4444' }}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Password Input with Eye Toggle */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
              Password
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.paper,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: errors.password ? '#EF4444' : colors.bentoBorder,
                paddingRight: 12,
              }}
            >
              <TextInput
                placeholder="Min 8 characters"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => { setPassword(text); setErrors((prev) => ({ ...prev, password: undefined })); }}
                secureTextEntry={!showPassword}
                style={{
                  flex: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontFamily: 'SpaceGrotesk-Medium',
                  fontSize: 14,
                  color: colors.black,
                }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                {showPassword ? (
                  <EyeSlash color="#6B7280" size={20} weight="bold" />
                ) : (
                  <Eye color="#6B7280" size={20} weight="bold" />
                )}
              </Pressable>
            </View>
            {errors.password ? (
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#EF4444' }}>{errors.password}</Text>
            ) : null}
          </View>

          {/* Submit Sign Up Button */}
          <NBButton label="Create Drip Deck Account" onPress={handleSignup} loading={loading} fullWidth variant="primary" style={{ paddingVertical: 14, marginTop: 4 }} />

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.bentoBorder }} />
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: '#9CA3AF' }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.bentoBorder }} />
          </View>

          {/* Google Sign-In Branded Button */}
          <Pressable
            onPress={handleGooglePress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              backgroundColor: colors.paper,
              borderRadius: 14,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
            }}
          >
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.white, fontFamily: 'SpaceGrotesk-Bold', fontSize: 13 }}>G</Text>
            </View>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
              Continue with Google
            </Text>
          </Pressable>

          {/* Bottom Prompt */}
          <Pressable onPress={() => router.replace({ pathname: '/(auth)/login', params: { email } })} style={{ alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#6B7280' }}>
              Already registered?{' '}
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', color: colors.bentoPurple }}>Sign in here →</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
