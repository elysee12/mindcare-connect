import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity, Text, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input, Container } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

type Step = 'email' | 'otp' | 'reset';

const STEP_META = {
  email: { icon:'mail-open' as const,  title:'auth.forgot_password',  sub:'auth.enter_email_to_reset', grad:['#1a6b4a','#2EB67D'] as [string,string] },
  otp:   { icon:'keypad' as const,     title:'auth.enter_otp',        sub:'auth.enter_otp_description', grad:['#1E40AF','#3B82F6'] as [string,string] },
  reset: { icon:'lock-open' as const,  title:'auth.reset_password',   sub:'auth.set_new_password', grad:['#7C3AED','#A78BFA'] as [string,string] },
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep]               = useState<Step>('email');
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);

  const meta = STEP_META[step];

  const requestOtp = async () => {
    if (!email || !email.includes('@')) { Alert.alert('Error', t('auth.valid_email_error')); return; }
    setLoading(true);
    try { await api.requestOtp(email); setStep('otp'); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp) { Alert.alert('Error', t('auth.otp_required')); return; }
    setLoading(true);
    try { await api.verifyOtp(email, otp); setStep('reset'); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const resetPwd = async () => {
    if (!newPwd || newPwd.length < 6) { Alert.alert('Error', t('auth.password_min_length')); return; }
    if (newPwd !== confirmPwd) { Alert.alert('Error', t('auth.passwords_dont_match')); return; }
    setLoading(true);
    try {
      await api.resetPassword(email, otp, newPwd);
      Alert.alert(t('common.success'), t('auth.password_reset_success'), [
        { text:'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleAction = step==='email' ? requestOtp : step==='otp' ? verifyOtp : resetPwd;
  const actionLabel  = step==='email' ? t('auth.send_otp') : step==='otp' ? t('auth.verify_otp') : t('auth.reset_password');

  return (
    <Container safeArea edges={['top','bottom']} style={S.container}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <LinearGradient colors={meta.grad} style={S.hero}>
            <TouchableOpacity style={S.backBtn} onPress={() => step==='email' ? router.back() : setStep(step==='otp'?'email':'otp')}>
              <View style={S.backCircle}><Ionicons name="arrow-back" size={18} color="#fff" /></View>
            </TouchableOpacity>
            <View style={S.iconCircle}>
              <Ionicons name={meta.icon} size={36} color="#fff" />
            </View>
            <Text style={S.heroTitle}>{t(meta.title)}</Text>
            <Text style={S.heroSub}>{t(meta.sub)}</Text>

            {/* Step dots */}
            <View style={S.stepDots}>
              {(['email','otp','reset'] as Step[]).map((s,i) => (
                <View key={s} style={[S.stepDot, step===s && S.stepDotActive, (['email','otp','reset'] as Step[]).indexOf(step) > i && S.stepDotDone]} />
              ))}
            </View>
          </LinearGradient>

          {/* Card */}
          <View style={S.card}>
            {step==='email' && (
              <View style={S.field}>
                <Text style={S.label}>{t('auth.email')}</Text>
                <View style={S.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={S.inputIcon} />
                  <Input placeholder={t('auth.email_placeholder')} value={email} onChangeText={setEmail}
                    autoCapitalize="none" keyboardType="email-address" style={S.input} />
                </View>
              </View>
            )}

            {step==='otp' && (
              <View style={S.field}>
                <Text style={S.label}>{t('auth.enter_otp')}</Text>
                <View style={S.inputWrap}>
                  <Ionicons name="key-outline" size={18} color="#94A3B8" style={S.inputIcon} />
                  <Input placeholder="••••••" value={otp} onChangeText={setOtp}
                    keyboardType="number-pad" maxLength={6} style={S.input} />
                </View>
                <Text style={S.hint}>OTP sent to {email}</Text>
              </View>
            )}

            {step==='reset' && (
              <>
                <View style={S.field}>
                  <Text style={S.label}>{t('auth.new_password')}</Text>
                  <View style={S.inputWrap}>
                    <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={S.inputIcon} />
                    <Input placeholder="••••••••" value={newPwd} onChangeText={setNewPwd}
                      secureTextEntry={!showPwd} style={S.input}
                      rightIcon={<TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{padding:4}}><Ionicons name={showPwd?'eye-outline':'eye-off-outline'} size={18} color="#94A3B8" /></TouchableOpacity>}
                    />
                  </View>
                </View>
                <View style={S.field}>
                  <Text style={S.label}>{t('auth.confirm_password')}</Text>
                  <View style={S.inputWrap}>
                    <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={S.inputIcon} />
                    <Input placeholder="••••••••" value={confirmPwd} onChangeText={setConfirmPwd}
                      secureTextEntry={!showPwd} style={S.input} />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity style={[S.btn, loading && {opacity:0.7}]} onPress={handleAction} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={meta.grad} start={{x:0,y:0}} end={{x:1,y:0}} style={S.btnGrad}>
                <Text style={S.btnText}>{loading ? 'Please wait…' : actionLabel}</Text>
                {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>

            {step==='email' && (
              <TouchableOpacity style={S.backLink} onPress={() => router.replace('/(auth)/login')}>
                <Text style={S.backLinkText}>{t('auth.back_to_login')}</Text>
              </TouchableOpacity>
            )}
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
  backBtn: { alignSelf:'flex-start', marginBottom:20 },
  backCircle: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center' },
  iconCircle: { width:72, height:72, borderRadius:36, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center', marginBottom:16 },
  heroTitle: { fontSize:24, fontWeight:'800', color:'#fff', marginBottom:6 },
  heroSub: { fontSize:13, color:'rgba(255,255,255,0.75)', textAlign:'center', marginBottom:20 },
  stepDots: { flexDirection:'row', gap:8 },
  stepDot: { width:8, height:8, borderRadius:4, backgroundColor:'rgba(255,255,255,0.3)' },
  stepDotActive: { width:24, backgroundColor:'#fff' },
  stepDotDone: { backgroundColor:'rgba(255,255,255,0.7)' },
  card: { backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, marginTop:-24, flex:1, padding:28 },
  field: { marginBottom:20 },
  label: { fontSize:13, fontWeight:'600', color:'#475569', marginBottom:6 },
  inputWrap: { position:'relative' },
  inputIcon: { position:'absolute', left:14, top:13, zIndex:1 },
  input: { paddingLeft:42 },
  hint: { fontSize:12, color:'#94A3B8', marginTop:6 },
  btn: { borderRadius:14, overflow:'hidden', marginBottom:16 },
  btnGrad: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:16 },
  btnText: { fontSize:16, fontWeight:'700', color:'#fff' },
  backLink: { alignItems:'center' },
  backLinkText: { fontSize:13, fontWeight:'600', color:'#2EB67D' },
});
