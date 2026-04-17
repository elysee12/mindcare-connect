export class CreateNotificationDto {
  type: string;
  title: string;
  message: string;
  userId?: number;
  isRead?: boolean;
}
