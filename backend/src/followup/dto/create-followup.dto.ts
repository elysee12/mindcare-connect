export class CreateFollowupDto {
  patientId: number;
  createdById?: number;
  mentalStatus: string;
  notes: string;
  relapseSigns?: boolean;
}
