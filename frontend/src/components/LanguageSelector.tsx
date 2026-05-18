import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, i18n.language === 'en' && styles.activeButton]} 
        onPress={() => changeLanguage('en')}
      >
        <Image 
          source={require('../assets/images/england.jpg')} 
          style={styles.flag} 
        />
        <Text style={[styles.text, i18n.language === 'en' && styles.activeText]}>English</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, i18n.language === 'rw' && styles.activeButton]} 
        onPress={() => changeLanguage('rw')}
      >
        <Image 
          source={require('../assets/images/rwanda.png')} 
          style={styles.flag} 
        />
        <Text style={[styles.text, i18n.language === 'rw' && styles.activeText]}>Kinyarwanda</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  activeButton: {
    borderColor: '#2EB67D',
    backgroundColor: '#F0FDF4',
  },
  flag: {
    width: 24,
    height: 16,
    marginRight: 8,
    borderRadius: 2,
  },
  text: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeText: {
    color: '#059669',
  },
});

export default LanguageSelector;
