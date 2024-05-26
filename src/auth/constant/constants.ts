
import * as crypto from 'crypto';

export const EXPIRES_IN = 3600;
export const generateRandomString = (length: number) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }
