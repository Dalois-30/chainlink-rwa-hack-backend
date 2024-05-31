import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class CacheService {
  private cache: Map<string, BehaviorSubject<any>> = new Map();

  get<T>(key: string): Observable<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, new BehaviorSubject<T>(null));
    }
    return this.cache.get(key).asObservable();
  }

  set<T>(key: string, value: T): void {
    if (!this.cache.has(key)) {
      this.cache.set(key, new BehaviorSubject<T>(value));
    } else {
      this.cache.get(key).next(value);
    }
  }

  del(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
  }
}
