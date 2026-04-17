declare module '@prisma/client' {
  export type UserRole = 'MHP' | 'CHW' | 'FAMILY' | 'ADMIN';

  export class PrismaClient {
    constructor();
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $executeRaw<T = any>(query: string, ...args: any[]): Promise<T>;
    $queryRaw<T = any>(query: string, ...args: any[]): Promise<T>;

    user: any;
    patient: any;
    followup: any;
    notification: any;
    reminder: any;
    treatmentChange: any;
    systemLog: any;
  }
}
