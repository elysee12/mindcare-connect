export class CreatePatientDto {
  fullName: string;
  age?: number;
  gender: string;
  contact?: string;
  diagnosis?: string;
  status?: string;
  riskLevel?: string;
  photoUrl?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  registeredByMhpId?: number;
  assignedChwId?: number;
  assignedFamilyId?: number;
}
