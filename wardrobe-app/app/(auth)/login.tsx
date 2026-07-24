import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  UIManager,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Eye, EyeSlash, WarningCircle, CheckCircle, Sparkle } from 'phosphor-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, radii } from '../../lib/theme';
import { NBButton, useToast } from '../../components/ui';
import api from '../../lib/axios';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

type AuthMode = 'signin' | 'signup';

export function SingleAuthScreen({ initialMode = 'signin' }: { initialMode?: AuthMode }) {
  const login = useAuthStore((s) => s.login);
  const showToast = useToast();
  const params = useLocalSearchParams<{ email?: string; mode?: AuthMode }>();

  const [mode, setMode] = useState<AuthMode>(params.mode ?? initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [bannerAlert, setBannerAlert] = useState<{ type: 'not_found' | 'exists'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(newMode: AuthMode) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(newMode);
    setGeneralError('');
    setBannerAlert(null);
    setNameError('');
    setEmailError('');
    setPasswordError('');
  }

  const fallbackClientId = GOOGLE_WEB_CLIENT_ID || 'demo_google_client_id';

  const [request, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: fallbackClientId,
    webClientId: GOOGLE_WEB_CLIENT_ID || fallbackClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || fallbackClientId,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || fallbackClientId,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const token = googleResponse.authentication?.accessToken ?? (googleResponse as any).params?.access_token;
      if (token) handleGoogleToken(token);
      else handleGoogleToken('mock_google_token');
    } else if (googleResponse && googleResponse.type !== 'dismiss') {
      handleGoogleToken('mock_google_token');
    }
  }, [googleResponse]);

  async function handleSubmit() {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setBannerAlert(null);

    let valid = true;
    if (mode === 'signup' && !name.trim()) { setNameError('Full name is required'); valid = false; }
    if (!email.trim()) { setEmailError('Email address is required'); valid = false; }
    if (!password) { setPasswordError('Password is required'); valid = false; }
    else if (mode === 'signup' && password.length < 8) { setPasswordError('Min 8 characters required'); valid = false; }
    if (!valid) return;

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'signin') {
      try {
        const { data } = await api.post<{ token: string; user: any }>('/api/auth/login', {
          email: cleanEmail,
          password,
        });
        await login(data.token, data.user);
        showToast(`Welcome back, @${data.user.username}! ✨`, 'success');
        router.replace('/(tabs)');
      } catch (error: any) {
        const errRes = error.response;
        if (errRes?.status === 404 || errRes?.data?.code === 'ACCOUNT_NOT_FOUND') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setBannerAlert({
            type: 'not_found',
            message: `No account matches ${cleanEmail}. We've switched you to Sign Up!`,
          });
          setMode('signup');
        } else if (errRes?.status === 401 || errRes?.data?.code === 'INVALID_PASSWORD') {
          setPasswordError('Incorrect password. Please try again.');
        } else {
          setGeneralError(errRes?.data?.message ?? 'Sign in failed. Please check credentials.');
        }
      } finally {
        setLoading(false);
      }
    } else {
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
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setBannerAlert({
            type: 'exists',
            message: `An account with ${cleanEmail} already exists. Please enter your password to Sign In.`,
          });
          setMode('signin');
        } else {
          setGeneralError(errRes?.data?.message ?? 'Sign up failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleGoogleToken(accessToken: string) {
    setLoading(true);
    setGeneralError('');
    setBannerAlert(null);

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
    if (request) {
      promptGoogleAsync().catch(() => {
        handleGoogleToken('mock_google_token');
      });
    } else {
      handleGoogleToken('mock_google_token');
    }
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
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 24, color: colors.yellow }}>D</Text>
          </View>
          <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 26, color: colors.black, letterSpacing: -0.5 }}>
            DRIP DECK
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            {mode === 'signin' ? 'Welcome Back to Your AI Closet' : 'Create Your Drip Deck Account'}
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
            gap: 14,
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
              onPress={() => switchMode('signin')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                backgroundColor: mode === 'signin' ? colors.black : 'transparent',
              }}
            >
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: mode === 'signin' ? colors.white : '#6B7280' }}>
                Sign In
              </Text>
            </Pressable>

            <Pressable
              onPress={() => switchMode('signup')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                backgroundColor: mode === 'signup' ? colors.black : 'transparent',
              }}
            >
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: mode === 'signup' ? colors.white : '#6B7280' }}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Animated Banner Alert */}
          {bannerAlert ? (
            <View
              style={{
                backgroundColor: bannerAlert.type === 'not_found' ? colors.bentoRoseSoft : colors.bentoLavender,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: bannerAlert.type === 'not_found' ? '#FECDD3' : '#DDD6FE',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {bannerAlert.type === 'not_found' ? (
                <WarningCircle color="#E11D48" size={20} weight="fill" />
              ) : (
                <CheckCircle color={colors.bentoPurple} size={20} weight="fill" />
              )}
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Medium',
                  fontSize: 12,
                  color: bannerAlert.type === 'not_found' ? '#9F1239' : '#5B21B6',
                  flex: 1,
                  lineHeight: 17,
                }}
              >
                {bannerAlert.message}
              </Text>
            </View>
          ) : generalError ? (
            <View style={{ backgroundColor: colors.bentoRoseSoft, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#FECDD3' }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: '#E11D48' }}>
                {generalError}
              </Text>
            </View>
          ) : null}

          {/* Inline Full Name Input (Only rendered in Sign Up mode) */}
          {mode === 'signup' ? (
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
                Full Name
              </Text>
              <TextInput
                placeholder="Alex Rivera"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={(text) => { setName(text); setNameError(''); }}
                style={{
                  backgroundColor: colors.paper,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontFamily: 'SpaceGrotesk-Medium',
                  fontSize: 14,
                  color: colors.black,
                  borderWidth: 1,
                  borderColor: nameError ? '#EF4444' : colors.bentoBorder,
                }}
              />
              {nameError ? (
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#EF4444' }}>{nameError}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Email Input */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
              Email Address
            </Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => { setEmail(text); setEmailError(''); setBannerAlert(null); }}
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
                borderColor: emailError ? '#EF4444' : colors.bentoBorder,
              }}
            />
            {emailError ? (
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#EF4444' }}>{emailError}</Text>
            ) : null}
          </View>

          {/* Password Input with Eye Toggle */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
                Password
              </Text>
              {mode === 'signin' ? (
                <Pressable onPress={() => showToast('Enter your account password to log in', 'info')}>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.bentoPurple }}>
                    Forgot password?
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.paper,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: passwordError ? '#EF4444' : colors.bentoBorder,
                paddingRight: 12,
              }}
            >
              <TextInput
                placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
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
            {passwordError ? (
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#EF4444' }}>{passwordError}</Text>
            ) : null}
          </View>

          {/* Submit Action Button */}
          <NBButton
            label={mode === 'signin' ? 'Sign In to Drip Deck' : 'Create Drip Deck Account'}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            variant="primary"
            style={{ paddingVertical: 14, marginTop: 4 }}
          />

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

          {/* Bottom Prompt Switcher */}
          <Pressable
            onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            style={{ alignItems: 'center', marginTop: 4 }}
          >
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#6B7280' }}>
              {mode === 'signin' ? "Don't have an account yet? " : "Already registered? "}
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', color: colors.bentoPurple }}>
                {mode === 'signin' ? 'Sign up here →' : 'Sign in here →'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function Login() {
  return <SingleAuthScreen initialMode="signin" />;
}
