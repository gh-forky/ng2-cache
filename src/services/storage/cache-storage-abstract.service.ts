import {CacheStoragesEnum} from '../../enums/cache-storages.enum';
import {StorageValueInterface} from '../../interfaces/storage-value.interface';

/**
 * Abstract cache storage
 */
export abstract class CacheStorageAbstract {
    /**
     * The number of data items stored in the storage
     */
    public abstract readonly length: number;

    /**
     * Get item from storage
     * @param key
     */
    public abstract getItem(key: string): StorageValueInterface;

    /**
     * Set item to storage
     * @param key
     * @param value
     */
    public abstract setItem(key: string, value: StorageValueInterface): boolean;

    /**
     * Remove item from storage
     * @param key
     */
    public abstract removeItem(key: string): void;

    /**
     * Clear item in storage
     */
    public abstract clear(): void;

    /**
     * Get current storage type
     */
    public abstract type(): CacheStoragesEnum;

    /**
     * Check if storage is enabled
     */
    public abstract isEnabled(): boolean;

    /**
     * Get the name of the nth key in the storage
     * @param index
     */
    public abstract key(index: number): string | null;

}
