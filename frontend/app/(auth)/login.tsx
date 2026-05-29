import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity, Text, ScrollView, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input, Container } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail]           = useState('mhp@mindcare.com');
  const [password, setPassword]     = useState('MHP123');
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Missing fields', 'Please enter email and password.'); return; }
    setLoading(true);
    try {
      const user = await api.login(email, password);
      api.setAuthUserId(user.id);
      setUser(user);
      router.replace(`/(${(user.role || 'family').toLowerCase()})` as any);
    } catch (err: any) {
      Alert.alert('Login Failed', err?.message?.includes('401')
        ? 'Email or password is incorrect.'
        : err.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <Container safeArea edges={['top','bottom']} style={S.container}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Hero gradient top ── */}
          <LinearGradient colors={['#1a6b4a','#2EB67D','#4BD19B']} start={{x:0,y:0}} end={{x:1,y:1}} style={S.hero}>
            <View style={S.langRow}><LanguageSelector /></View>
            <View style={S.logoWrap}>
              <View style={S.logoCircle}>
                <Ionicons name="heart" size={36} color="#2EB67D" />
              </View>
            </View>
            <Text style={S.brand}>MindCare Connect</Text>
            <Text style={S.brandSub}>{t('auth.sign_in_to_continue')}</Text>
          </LinearGradient>

          {/* ── Card ── */}
          <View style={S.card}>
            <Text style={S.cardTitle}>{t('auth.welcome_back')}</Text>
            <Text style={S.cardSub}>Sign in to your account</Text>

            <View style={S.field}>
              <Text style={S.label}>{t('auth.email')}</Text>
              <View style={S.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" style={S.inputIcon} />
                <Input
                  placeholder={t('auth.email_placeholder')}
                  value={email} onChangeText={setEmail}
                  autoCapitalize="none" keyboardType="email-address"
                  style={S.input}
                />
              </View>
            </View>

            <View style={S.field}>
              <Text style={S.label}>{t('auth.password')}</Text>
              <View style={S.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={S.inputIcon} />
                <Input
                  placeholder={t('auth.password_placeholder')}
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  style={S.input}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{padding:4}}>
                      <Ionicons name={showPwd?'eye-outline':'eye-off-outline'} size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  }
                />
              </View>
            </View>

            <TouchableOpacity style={S.forgotRow} onPress={() => router.push('/forgot-password')}>
              <Text style={S.forgotText}>{t('auth.forgot_password')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.loginBtn, loading && {opacity:0.7}]}
              onPress={handleLogin} disabled={loading} activeOpacity={0.85}
            >
              <LinearGradient colors={['#2EB67D','#1a6b4a']} start={{x:0,y:0}} end={{x:1,y:0}} style={S.loginGrad}>
                {loading
                  ? <Text style={S.loginText}>Signing in…</Text>
                  : <><Ionicons name="log-in-outline" size={18} color="#fff" /><Text style={S.loginText}>{t('auth.login')}</Text></>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={S.footer}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#94A3B8" />
              <Text style={S.footerText}>{t('auth.need_help')}</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F1F5F9' },
  scroll: { flexGrow:1 },
  hero: { paddingTop:16, paddingBottom:48, paddingHorizontal:24, alignItems:'center' },
  langRow: { alignSelf:'flex-end', marginBottom:8 },
  logoWrap: { marginBottom:16 },
  logoCircle: {
    width:72, height:72, borderRadius:36, backgroundColor:'#fff',
    justifyContent:'center', alignItems:'center',
    shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.15, shadowRadius:12, elevation:6,
  },
  brand: { fontSize:26, fontWeight:'800', color:'#fff', letterSpacing:-0.5, marginBottom:4 },
  brandSub: { fontSize:13, color:'rgba(255,255,255,0.75)' },
  card: {
    backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28,
    marginTop:-24, flex:1, padding:28,
    shadowColor:'#000', shadowOffset:{width:0,height:-4}, shadowOpacity:0.06, shadowRadius:12, elevation:4,
  },
  cardTitle: { fontSize:22, fontWeight:'800', color:'#1E293B', marginBottom:4 },
  cardSub: { fontSize:13, color:'#94A3B8', marginBottom:28 },
  field: { marginBottom:18 },
  label: { fontSize:13, fontWeight:'600', color:'#475569', marginBottom:6 },
  inputWrap: { position:'relative' },
  inputIcon: { position:'absolute', left:14, top:13, zIndex:1 },
  input: { paddingLeft:42 },
  forgotRow: { alignItems:'flex-end', marginBottom:24, marginTop:-8 },
  forgotText: { fontSize:13, fontWeight:'600', color:'#2EB67D' },
  loginBtn: { borderRadius:14, overflow:'hidden', marginBottom:24 },
  loginGrad: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:16 },
  loginText: { fontSize:16, fontWeight:'700', color:'#fff' },
  footer: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6 },
  footerText: { fontSize:12, color:'#94A3B8' },
});
