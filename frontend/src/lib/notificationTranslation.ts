/**
 * notificationTranslation.ts
 *
 * Translates notification title and message using the notification `type` and
 * structured `metadata` stored by the backend.  The raw English `title` /
 * `message` strings stored in the DB are used as a fallback for old records
 * that pre-date the metadata column.
 */

import { TFunction } from 'i18next';

export interface RawNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  metadata?: string | null;
  isRead?: boolean;
  createdAt: string;
  user?: any;
}

export interface TranslatedNotification extends RawNotification {
  translatedTitle: string;
  translatedMessage: string;
}

/** Safely parse the JSON metadata string. Returns {} on failure. */
function parseMeta(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Try to extract a patient name from the stored English message as a fallback
 * for old notifications that pre-date the metadata column.
 * Examples:
 *   "Patient John Doe has been assigned to you." → "John Doe"
 *   "A new reminder has been set for John Doe." → "John Doe"
 *   "Followup for patient John Doe has been added." → "John Doe"
 */
function extractPatientNameFromMessage(message: string): string {
  const patterns = [
    /^Patient (.+?) has been assigned/i,
    /^Patient (.+?) is now being tracked/i,
    /has been set for (.+?)\./i,
    /for patient (.+?) has been/i,
    /for your patient (.+?) has been/i,
    /treatment for (.+?) has been/i,
    /clinical treatment for (.+?) has been/i,
    /^(.+?) has been located at/i,
    /appointment .+ for (.+?) on /i,
    /appointment .+ for (.+?) is tomorrow/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

/**
 * Returns translated title + message for a single notification.
 * Falls back to the stored English strings when no translation key exists.
 */
export function translateNotification(
  notification: RawNotification,
  t: TFunction,
): TranslatedNotification {
  const meta = parseMeta(notification.metadata);
  const type = notification.type?.toLowerCase() ?? '';

  // For any field missing from metadata, try to extract from the stored message
  const fallbackPatientName = meta.patientName || extractPatientNameFromMessage(notification.message);

  let translatedTitle = notification.title;
  let translatedMessage = notification.message;

  switch (type) {
    case 'assignment':
      translatedTitle = t('notif.assignment_title');
      translatedMessage = t('notif.assignment_message', { patientName: fallbackPatientName });
      break;

    case 'tracking':
      translatedTitle = t('notif.tracking_title');
      translatedMessage = t('notif.tracking_message', { patientName: fallbackPatientName });
      break;

    case 'patient_found':
      translatedTitle = t('notif.patient_found_title');
      translatedMessage = t('notif.patient_found_message', {
        patientName: fallbackPatientName,
        location: meta.location || '',
        finderName: meta.finderName || '',
      });
      break;

    case 'appointment_scheduled':
      translatedTitle = t('notif.appointment_scheduled_title');
      translatedMessage = t('notif.appointment_scheduled_message', {
        appointmentTitle: meta.appointmentTitle || '',
        patientName: fallbackPatientName,
        appointmentTime: meta.appointmentTime || '',
      });
      break;

    case 'appointment_reminder':
      translatedTitle = t('notif.appointment_reminder_title');
      translatedMessage = t('notif.appointment_reminder_message', {
        appointmentTitle: meta.appointmentTitle || '',
        patientName: fallbackPatientName,
        appointmentTime: meta.appointmentTime || '',
      });
      break;

    case 'reminder_created':
      translatedTitle = t('notif.reminder_created_title');
      translatedMessage = t('notif.reminder_created_message', { patientName: fallbackPatientName });
      break;

    case 'followup_created':
      translatedTitle = t('notif.followup_created_title');
      translatedMessage = t('notif.followup_created_message', { patientName: fallbackPatientName });
      break;

    case 'treatment_change_created':
      translatedTitle = t('notif.treatment_change_title');
      translatedMessage = t('notif.treatment_change_message', { patientName: fallbackPatientName });
      break;

    case 'report_submitted':
      translatedTitle = t('notif.report_submitted_title');
      translatedMessage = t('notif.report_submitted_message', { reportTitle: meta.reportTitle || '' });
      break;

    case 'user_created':
      translatedTitle = t('notif.user_created_title');
      translatedMessage = t('notif.user_created_message', {
        userName: meta.userName || '',
        userRole: meta.userRole ? t(`status_values.${meta.userRole}`, { defaultValue: meta.userRole }) : '',
      });
      break;

    case 'user_updated':
      translatedTitle = t('notif.user_updated_title');
      translatedMessage = t('notif.user_updated_message', { userName: meta.userName || '' });
      break;

    case 'user_deleted':
      translatedTitle = t('notif.user_deleted_title');
      translatedMessage = t('notif.user_deleted_message', { userName: meta.userName || '' });
      break;

    default:
      break;
  }

  return { ...notification, translatedTitle, translatedMessage };
}

/**
 * Convenience hook-free helper to translate an array of notifications.
 */
export function translateNotifications(
  notifications: RawNotification[],
  t: TFunction,
): TranslatedNotification[] {
  return notifications.map((n) => translateNotification(n, t));
}
