export interface Redis {
  setex: (key: string, expiration: number, value: string) => Promise<void>;
  del: (key: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
}
