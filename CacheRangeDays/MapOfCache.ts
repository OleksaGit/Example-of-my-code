import ItemCache from '@main/ItemCache';
import CompanyDays, { WorkingDayRawDTO } from '@models/CompanyDays';
import moment, { MomentInput } from 'moment';
import Api2CompanyDaysController from '@Api2CompanyDaysController';
import CacheFsStore from '@main/cache/CacheFsStore';
import * as config from '@main/CacheRangeDays.config.json';

export default class MapOfCache {
    private _itemsCache: ItemCache[];
    constructor(itemsCache: ItemCache[]) {
        this._itemsCache = itemsCache;
    }

    /**
     * Check "itemsCache" for missing "CompanyDays"
     * @private
     */
    private hasEmptyCompanyDays():boolean {
        const emptyDays = this._itemsCache.filter((item) => !item.companyDay)
        return !!emptyDays.length;
    }

    /**
     * Creat a date range for updating the cache from the API.
     * The start date is calculate from the beginning of the "itemsCache" array by the first value in which the "CompanyDay" value is missing.
     * The end date is calculate from the end of the "itemsCache" array by the first value in which the "CompanyDay" value is missing
     * @private
     */
    private createDaysForUpdateCache(): {dateStart: MomentInput, dateEnd: MomentInput} {
        let dateStart
        for (let i = 0; i < this._itemsCache.length; i++) {
            if (this._itemsCache[i].companyDay === null) {
                dateStart = this._itemsCache[i].date
                break
            }
        }

        let dateEnd
        for (let i = this._itemsCache.length - 1; i > -1; i--) {
            if (this._itemsCache[i].companyDay === null) {
                dateEnd = this._itemsCache[i].date
                break
            }
        }
        return { dateStart, dateEnd }
    }

    /**
     * Update "itemsCache" according to the coincidence of dates
     * @param days
     * @private
     */
    private async updateItemsCache(days: WorkingDayRawDTO[]) {
        const promises: Promise<void>[] = []
        days.forEach((day) => {
            this._itemsCache.forEach((item) => {
                // const date = moment.utc(day.date)
                const date = moment(day.date)
                if (date.isSame(item.date, 'day')) {
                    item.setCompanyDay(day)
                    promises.push(MapOfCache.setSingleDateToCache(item.keyData, day))
                }
            })
        })
        try {
            await Promise.all(promises)
        } catch (e) {
            throw e
        }
    }

    /**
     * Build response "CompanyDay"
     */
    async buildResponse(): Promise<CompanyDays> {
        if (this.hasEmptyCompanyDays()) {
            const { dateStart, dateEnd } = this.createDaysForUpdateCache()
            const workingDayRaw = await Api2CompanyDaysController.getCompanyDays(moment(dateStart).toDate(), moment(dateEnd).toDate())
            await this.updateItemsCache(workingDayRaw)
            const companyDays = this._itemsCache.map((item) => {
                if (item.companyDay !== null) {
                    return item.companyDay
                } else {
                    const msg = 'Error getting company days from cache, with update from API'
                    global.logger.error(msg)
                    throw new Error(msg)
                }
            })
            global.logger.info(`Get company days from cache: Days get from API - ${workingDayRaw.length};
                     Days get from cache - ${this._itemsCache.filter((item) => item.companyDay).length}; 
                     Range ${moment(this._itemsCache[0].date).format('DD.MM.YYYY')} - 
                     ${moment(this._itemsCache[this._itemsCache.length - 1].date).format('DD.MM.YYYY')}`)
            return new CompanyDays(companyDays)
        } else {
            const companyDays = this._itemsCache.map((item) => {
                if (item.companyDay !== null) {
                    return item.companyDay
                } else {
                    const msg = 'Error getting company days from cache, without update from API'
                    global.logger.error(msg)
                    throw new Error(msg)
                }
            })
            global.logger.info(`Get days from cache: All days get from cache; Range ${moment(this._itemsCache[0].date).format('DD.MM.YYYY')} - 
                     ${moment(this._itemsCache[this._itemsCache.length - 1].date).format('DD.MM.YYYY')}`)
            return new CompanyDays(companyDays)
        }
    }

    /**
     * Read the cache by key
     * @param keyData
     */
    static async getSingleDateFromCache(keyData: string): Promise<WorkingDayRawDTO | null> {
        const cacheFsStore = CacheFsStore.getInstance();
        const dayFromCache = await cacheFsStore.get(keyData);
        if (dayFromCache) {
            if (!MapOfCache.isOutdated(dayFromCache.timestamp)) {
                return dayFromCache.data;
            } else {
                cacheFsStore.delete(keyData)
                return null
            }
        } else {
            return null
        }
    }

    /**
     * Write cache by key
     * @param keyData
     * @param day
     */
    static async setSingleDateToCache(keyData: string, day: WorkingDayRawDTO): Promise<void> {
        const cacheFsStore = CacheFsStore.getInstance();
        await cacheFsStore.set(keyData, day);
    }


    private static isOutdated(timestampData: number) {
        return timestampData + MapOfCache.getCacheTime() < Date.now();
    }

    private static getCacheTime(): number {
        return Number(process.env.CACHE_TIME || config.cacheTime);
    }
}
