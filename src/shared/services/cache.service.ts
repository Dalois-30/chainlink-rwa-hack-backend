import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    async get<T>(key: string): Promise<T> {
        return await this.cacheManager.get<T>(key);
    }

    async set<T>(key: string, value: T, ttl: number = 3600000): Promise<void> {
        await this.cacheManager.set(key, value, ttl);
    }

    async del(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }

    async getOrSet<T>(key: string, fetchFunction: () => Promise<T>, ttl: number = 3600): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached) {
            return cached;
        }

        const value = await fetchFunction();
        await this.set(key, value, ttl);
        return value;
    }

    async flushAll(): Promise<void> {
        await this.cacheManager.reset();
    }
}
