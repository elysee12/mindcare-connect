export class CreateLessonDto {
  title: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  isPublished?: boolean;
  createdBy?: number;
}
