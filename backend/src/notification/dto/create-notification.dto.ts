export class CreateNotificationDto {
  type: string;
  title: string;
  message: string;
  metadata?: string; // JSON string with structured data for i18n
  userId?: number;
  isRead?: boolean;
}
