export class CreateReminderDto {
  patientId: number;
  type: string;
  title: string;
  time: string;
  completed?: boolean;
}

