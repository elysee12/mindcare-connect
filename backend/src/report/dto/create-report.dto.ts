export class CreateReportDto {
  patientId: number;
  createdByChwId: number;
  mhpId?: number;
  title: string;
  details: string;
}