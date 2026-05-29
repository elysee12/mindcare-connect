import React, { useState, useRef } from 'react';
import {
  View, StyleSheet, Text, ScrollView, Dimensions,
  TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'heart' as const,
    gradient: ['#1a6b4a','#2EB67D'] as [string,string],
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    icon: 'people' as const,
    gradient: ['#1E40AF','#3B82F6'] as [string,string],
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    icon: 'shield-checkmark' as const,
    gradient: ['#7C3AED','#A78BFA'] as [string,string],
    iconBg: 'rgba(255,255,255,0.2)',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const data = [
    { title: t('onboarding.welcome_title'),      desc: t('onboarding.welcome_desc') },
    { title: t('onboarding.followup_title'),     desc: t('onboarding.followup_desc') },
    { title: t('onboarding.collaborative_title'),desc: t('onboarding.collaborative_desc') },
  ];

  const finish = async () => {
    await AsyncStorage.setItem('has_completed_onboarding','true').catch(()=>{});
    router.replace('/(auth)/login');
  };

  const next = () => {
    if (idx < data.length - 1) {
      scrollRef.current?.scrollTo({ x: (idx+1)*width, animated:true });
      setIdx(idx+1);
    } else { finish(); }
  };

  const slide = SLIDES[idx];

  return (
    <Container safeArea style={S.container}>
      <LinearGradient colors={slide.gradient} style={S.bg}>

        {/* Skip */}
        <TouchableOpacity style={S.skip} onPress={finish}>
          <Text style={S.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>

        {/* Slides */}
        <ScrollView
          ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{nativeEvent:{contentOffset:{x:scrollX}}}],{useNativeDriver:false})}
          scrollEventThrottle={16}
          onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x/width))}
          style={S.slides}
        >
          {data.map((item, i) => (
            <View key={i} style={S.slide}>
              <View style={[S.iconCircle, {backgroundColor: SLIDES[i].iconBg}]}>
                <Ionicons name={SLIDES[i].icon} size={72} color="#fff" />
              </View>
              <Text style={S.slideTitle}>{item.title}</Text>
              <Text style={S.slideDesc}>{item.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={S.footer}>
          {/* Dots */}
          <View style={S.dots}>
            {data.map((_,i) => {
              const w = scrollX.interpolate({
                inputRange:[(i-1)*width,i*width,(i+1)*width],
                outputRange:[8,24,8], extrapolate:'clamp',
              });
              const op = scrollX.interpolate({
                inputRange:[(i-1)*width,i*width,(i+1)*width],
                outputRange:[0.4,1,0.4], extrapolate:'clamp',
              });
              return <Animated.View key={i} style={[S.dot,{width:w,opacity:op}]} />;
            })}
          </View>

          {/* Button */}
          <TouchableOpacity style={S.btn} onPress={next} activeOpacity={0.85}>
            <View style={S.btnInner}>
              <Text style={S.btnText}>
                {idx === data.length-1 ? t('onboarding.get_started') : t('onboarding.next')}
              </Text>
              <Ionicons name={idx===data.length-1?'checkmark':'arrow-forward'} size={20} color={slide.gradient[1]} />
            </View>
          </TouchableOpacity>
        </View>

      </LinearGradient>
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex:1 },
  bg: { flex:1 },
  skip: { position:'absolute', top:16, right:20, zIndex:10, padding:8 },
  skipText: { fontSize:14, fontWeight:'600', color:'rgba(255,255,255,0.8)' },
  slides: { flex:1 },
  slide: { width, alignItems:'center', justifyContent:'center', paddingHorizontal:40, paddingTop:80 },
  iconCircle: {
    width:160, height:160, borderRadius:80,
    justifyContent:'center', alignItems:'center', marginBottom:40,
    shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.2, shadowRadius:16, elevation:8,
  },
  slideTitle: { fontSize:28, fontWeight:'800', color:'#fff', textAlign:'center', marginBottom:16, letterSpacing:-0.5 },
  slideDesc: { fontSize:16, color:'rgba(255,255,255,0.8)', textAlign:'center', lineHeight:24 },
  footer: { paddingHorizontal:32, paddingBottom:48, alignItems:'center', gap:28 },
  dots: { flexDirection:'row', gap:6, height:10, alignItems:'center' },
  dot: { height:8, borderRadius:4, backgroundColor:'#fff' },
  btn: {
    width:'100%', backgroundColor:'#fff', borderRadius:16, overflow:'hidden',
    shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.15, shadowRadius:8, elevation:4,
  },
  btnInner: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:18 },
  btnText: { fontSize:16, fontWeight:'700', color:'#1E293B' },
});
