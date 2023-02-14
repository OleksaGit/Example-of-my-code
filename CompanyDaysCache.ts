import moment from 'moment';
import ItemCache from '@main/DataAccessLayer/Web100PlatformStorage/CompanyDays/ItemCache';
import MapOfCache from '@main/DataAccessLayer/Web100PlatformStorage/CompanyDays/MapOfCache';
import CompanyDays from '@models/CompanyDays';
import { RequestTimeTracker } from '@main/logger/RequestTimeTracker';


export default class CompanyDaysCache {
    /**
     * Get "CompanyDays" from the cache or from the API
     * @param dateStart
     * @param dateEnd
     */
    static async get(dateStart: Date, dateEnd: Date = dateStart): Promise<CompanyDays> {
        // TODO need rewrite logging, temporary solution
        const requestTimeTracker = new RequestTimeTracker(undefined, 'cached data', 'Get company days from cache');
        requestTimeTracker.setAdditionalData(`Date start: ${moment(dateStart).format('DD.MM.YYYY')}, Date end: ${moment(dateEnd).format('DD.MM.YYYY')}`)
        const timeStart = RequestTimeTracker.getTimeStart();

        const mapOfCache = new MapOfCache(await this.createItemsCache(dateStart, dateEnd))

        const companyDays = mapOfCache.buildResponse()

        requestTimeTracker.calcRequestDuration(timeStart);
        requestTimeTracker.printToLog();

        return companyDays
    }

    /**
     * Create "itemsCache" and populating the value from the cache if they exist
     * @param dateStart
     * @param dateEnd
     * @private
     */
    private static async createItemsCache(dateStart: Date, dateEnd: Date = dateStart): Promise<ItemCache[]> {
        const dateStartMoment = moment(dateStart)
        const dateEndMoment = moment(dateEnd)

        const duration = moment.duration(dateEndMoment.diff(dateStartMoment))
        const amountOfDays = duration.days() + 1

        const itemsCache: ItemCache[] = []

        for (let i = 0; i < amountOfDays; i++) {
            const dateForLoop = moment(dateStartMoment)
            const singleDate = dateForLoop.add(i, 'day')
            itemsCache.push(new ItemCache(singleDate, null))
        }

        const promises = itemsCache.map(async (item) => {
            return MapOfCache.getSingleDateFromCache(item.keyData)
        })
        const companyDays = await Promise.all(promises)
        itemsCache.forEach((item, i) => item.setCompanyDay(companyDays[i]))

        return itemsCache
    }

}
