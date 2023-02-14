import moment, { MomentInput } from 'moment';
import { WorkingDayRawDTO } from '@models/CompanyDays';

export default class ItemCache {
    private readonly _date: moment.MomentInput;
    private readonly _keyData: string;
    private _companyDay: WorkingDayRawDTO | null

    constructor(
        date: MomentInput,
        companyDays: WorkingDayRawDTO | null
    ) {
        this._date = date;
        this._keyData =  this.buildKey(moment(date).format('DDMMYYYY'));
        this._companyDay = companyDays;
    }

    get companyDay() {
        return this._companyDay
    }
    get date(): MomentInput {
        return this._date
    }
    get keyData(): string {
        return this._keyData
    }

    setCompanyDay(companyDay: WorkingDayRawDTO | null): void {
        this._companyDay = companyDay
    }

    private buildKey(key: string) {
        return `company-day-${key}`;
    }




}
