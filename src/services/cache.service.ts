import {Injectable, Optional} from 'angular2/core';
import {CacheOptionsInterface} from '../interfaces/cache-options.interface';
import {CacheStoragesEnum} from '../enums/cache-storages.enum';
import {CacheStorageAbstract} from './storage/cache-storage-abstract.service';
import {CacheSessionStorage} from './storage/session-storage/cache-session-storage.service';
import {CacheLocalStorage} from './storage/local-storage/cache-local-storage.service';
import {CacheMemoryStorage} from './storage/memory/cache-memory.service';
import {StorageValueInterface} from '../interfaces/storage-value.interface';

const CACHE_PREFIX = 'CacheService';

const DEFAULT_STORAGE = CacheStoragesEnum.SESSION_STORAGE;
const DEFAULT_ENABLED_STORAGE = CacheStoragesEnum.MEMORY;

@Injectable()
export class CacheService {

    /**
     * Default cache options
     * @type CacheOptionsInterface
     * @private
     */
    private _defaultOptions: CacheOptionsInterface = {
        expires: Number.MAX_VALUE,
        maxAge : Number.MAX_VALUE
    };

    public constructor(@Optional() private _storage: CacheStorageAbstract) {
        this._validateStorage();
    }

    /**
     * Set data to cache
     * @param key
     * @param value
     * @param options
     */
    public set(key: string, value: any, options?: CacheOptionsInterface) {
        let storageKey = this._toStorageKey(key);
        options = options ? options : this._defaultOptions;
        this._storage.setItem(storageKey, this._toStorageValue(value, options));
        if (!this._isSystemKey(key) && options.tag) {
            this._saveTag(options.tag, storageKey);
        }
    }


    /**
     * Get data from cache
     * @param key
     * @returns {any}
     */
    public get(key: string): any {
        let storageValue = this._storage.getItem(this._toStorageKey(key)),
            value: any = null;
        if (storageValue) {
            if (this._validateStorageValue(storageValue)) {
                value = storageValue.value;
            } else {
                this.remove(key);
            }
        }
        return value;
    }

    /**
     * Check if value exists
     * @param key
     * @returns {boolean}
     */
    public exists(key: string): boolean {
        return !!this.get(key);
    }

    /**
     * Remove item from cache
     * @param key
     */
    public remove(key: string) {
        this._storage.removeItem(this._toStorageKey(key));
        this._removeFromTag(this._toStorageKey(key));
    }

    /**
     * Remove all from cache
     */
    public removeAll() {
        this._storage.clear();
    }

    /**
     * Get all tag data
     * @param tag
     * @returns {Array}
     */
    public getTagData(tag: string) {
        let tags = this.get(this._tagsStorageKey()) || {},
            result = {};
        if (tags[tag]) {
            tags[tag].forEach((key: string) => {
                let data = this.get(this._fromStorageKey(key));
                if (data) {
                    result[this._fromStorageKey(key)] = data;
                }
            });
        }
        return result;
    }

    /**
     * Remove all by tag
     * @param tag
     */
    public removeTag(tag: string) {
        let tags = this.get(this._tagsStorageKey()) || {};
        if (tags[tag]) {
            tags[tag].forEach((key: string) => {
                this._storage.removeItem(key);
            });
            delete tags[tag];
            this.set(this._tagsStorageKey(), tags);
        }
    }

    /**
     * Validate cache storage
     * @private
     */
    private _validateStorage() {
        if (!this._storage) {
            this._initStorage(DEFAULT_STORAGE);
        }
        if (!this._storage.isEnabled()) {
            this._initStorage(DEFAULT_ENABLED_STORAGE);
        }
    }

    /**
     * Remove key from tags keys list
     * @param key
     * @private
     */
    private _removeFromTag(key: string) {
        let tags = this.get(this._tagsStorageKey()) || {},
            index: number;
        for (let tag in tags) {
            index = tags[tag].indexOf(key);
            if (index !== -1) {
                tags[tag].splice(index, 1);
                this.set(this._tagsStorageKey(), tags);
                break;
            }
        }
    }

    /**
     * Init storage by type
     * @param type
     * @returns {CacheStorageAbstract}
     */
    private _initStorage(type: CacheStoragesEnum) {
        switch (type) {
            case CacheStoragesEnum.SESSION_STORAGE:
                this._storage = new CacheSessionStorage();
                break;
            case CacheStoragesEnum.LOCAL_STORAGE:
                this._storage = new CacheLocalStorage();
                break;
            default: this._storage = new CacheMemoryStorage();
        }
    }

    private _toStorageKey(key: string) {
        return CACHE_PREFIX + key;
    }

    private _fromStorageKey(key: string) {
        return key.replace(CACHE_PREFIX, '');
    }

    /**
     * Prepare value to set to storage
     * @param value
     * @param options
     * @returns {{value: any, options: CacheOptionsInterface}}
     * @private
     */
    private _toStorageValue(value: any, options: CacheOptionsInterface): StorageValueInterface {
        return {
            value: value,
            options: this._toStorageOptions(options)
        };
    }

    /**
     * Prepare options to set to storage
     * @param options
     * @returns {CacheOptionsInterface}
     * @private
     */
    private _toStorageOptions(options: CacheOptionsInterface): CacheOptionsInterface {
        var storageOptions: CacheOptionsInterface = {};
        storageOptions.expires = options.expires ? options.expires :
            (options.maxAge ? Date.now() + (options.maxAge * 1000) : this._defaultOptions.expires);
        storageOptions.maxAge = options.maxAge ? options.maxAge : this._defaultOptions.maxAge;
        return storageOptions;
    }

    /**
     * Validate storage value
     * @param value
     * @returns {boolean}
     * @private
     */
    private _validateStorageValue(value: StorageValueInterface) {
        return value.options.expires > Date.now();
    }

    /**
     * check if its system cache key
     * @param key
     * @returns {boolean}
     * @private
     */
    private _isSystemKey(key: string) {
        return [this._tagsStorageKey()].indexOf(key) !== -1;
    }

    /**
     * Save tag to list of tags
     * @param tag
     * @param key
     * @private
     */
    private _saveTag(tag: string, key: string) {
        let tags = this.get(this._tagsStorageKey()) || {};
        if (!tags[tag]) {
            tags[tag] = [key];
        } else {
            tags[tag].push(key);
        }
        this.set(this._tagsStorageKey(), tags);
    }

    private _tagsStorageKey() {
        return 'CacheService_tags';
    }

}