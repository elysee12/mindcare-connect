export interface LocationPickerProps {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onSectorChange: (value: string) => void;
  onCellChange: (value: string) => void;
  onVillageChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}
