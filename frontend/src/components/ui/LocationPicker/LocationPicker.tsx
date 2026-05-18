import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import { LocationPickerProps } from './LocationPicker.types';
import locationsData from '@/assets/rwanda_locations.json';

interface LocationItem {
  name: string;
  [key: string]: any;
}

export function LocationPicker({
  province,
  district,
  sector,
  cell,
  village,
  onProvinceChange,
  onDistrictChange,
  onSectorChange,
  onCellChange,
  onVillageChange,
  label,
  error,
  disabled = false,
}: LocationPickerProps) {
  const [activePicker, setActivePicker] = useState<'province' | 'district' | 'sector' | 'cell' | 'village' | null>(null);

  const provinces = useMemo(() => locationsData.items, []);
  
  const districts = useMemo(() => {
    const selectedProvince = provinces.find(p => p.name === province);
    return selectedProvince ? selectedProvince.districts : [];
  }, [province, provinces]);

  const sectors = useMemo(() => {
    const selectedDistrict = districts.find(d => d.name === district);
    return selectedDistrict ? selectedDistrict.sectors : [];
  }, [district, districts]);

  const cells = useMemo(() => {
    const selectedSector = sectors.find(s => s.name === sector);
    return selectedSector ? selectedSector.cells : [];
  }, [sector, sectors]);

  const villages = useMemo(() => {
    const selectedCell = cells.find(c => c.name === cell);
    return selectedCell ? selectedCell.villages : [];
  }, [cell, cells]);

  const handleSelect = (item: string | LocationItem) => {
    const name = typeof item === 'string' ? item : item.name;
    
    if (activePicker === 'province') {
      onProvinceChange(name);
      onDistrictChange('');
      onSectorChange('');
      onCellChange('');
      onVillageChange('');
    } else if (activePicker === 'district') {
      onDistrictChange(name);
      onSectorChange('');
      onCellChange('');
      onVillageChange('');
    } else if (activePicker === 'sector') {
      onSectorChange(name);
      onCellChange('');
      onVillageChange('');
    } else if (activePicker === 'cell') {
      onCellChange(name);
      onVillageChange('');
    } else if (activePicker === 'village') {
      onVillageChange(name);
    }
    
    setActivePicker(null);
  };

  const renderPickerButton = (
    currentLabel: string,
    value: string,
    type: 'province' | 'district' | 'sector' | 'cell' | 'village',
    isDisabled: boolean
  ) => (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{currentLabel}</Text>
      <TouchableOpacity
        style={[
          styles.dropdown,
          isDisabled && styles.dropdownDisabled,
          activePicker === type && styles.dropdownActive
        ]}
        onPress={() => !isDisabled && !disabled && setActivePicker(type)}
        disabled={isDisabled || disabled}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || `Select ${currentLabel}`}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={isDisabled ? colors.textTertiary : colors.textSecondary} 
        />
      </TouchableOpacity>
    </View>
  );

  const getActiveData = () => {
    if (activePicker === 'province') return provinces;
    if (activePicker === 'district') return districts;
    if (activePicker === 'sector') return sectors;
    if (activePicker === 'cell') return cells;
    if (activePicker === 'village') return villages;
    return [];
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.mainLabel}>{label}</Text>}
      
      {renderPickerButton('Province', province, 'province', false)}
      {renderPickerButton('District', district, 'district', !province)}
      {renderPickerButton('Sector', sector, 'sector', !district)}
      {renderPickerButton('Cell', cell, 'cell', !sector)}
      {renderPickerButton('Village', village, 'village', !cell)}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={activePicker !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {activePicker?.charAt(0).toUpperCase()}{activePicker?.slice(1)}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getActiveData()}
              keyExtractor={(item, index) => (typeof item === 'string' ? item : item.name) + index}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>
                    {typeof item === 'string' ? item : item.name}
                  </Text>
                  {(typeof item === 'string' ? item : item.name) === (
                    activePicker === 'province' ? province :
                    activePicker === 'district' ? district :
                    activePicker === 'sector' ? sector :
                    activePicker === 'cell' ? cell : village
                  ) && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.sm,
  },
  mainLabel: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fieldWrapper: {
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  dropdownActive: {
    borderColor: colors.primary,
  },
  dropdownDisabled: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
    opacity: 0.6,
  },
  dropdownText: {
    ...typography.body,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
