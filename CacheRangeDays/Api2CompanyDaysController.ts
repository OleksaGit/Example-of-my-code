import ApiWeb100ControllerHelper from '@components/ApiWeb100ControllerHelper';
import { WorkingDayRawDTO } from '@models/CompanyDays';
import ApiConnectorService from '@components/apiConnectors/ApiConnectorService';
import globalConfig from '@main/config';
import DateApiFormat from '@helpers/DateApiFormat';

export default class Api2CompanyDaysController {
    /**
     * @param {null|Date} timeMin
     * @param {null|Date} timeMax
     * @returns {Promise<CompanyDays>}
     */
    // static async getCompanyDays(timeMin?: Date, timeMax?: Date): Promise<CompanyDays> {
    static async getCompanyDays(timeMin: Date, timeMax: Date): Promise<WorkingDayRawDTO[]> {
        const { stage = 'production' } = process.env;
        const calendarId = globalConfig.calendarIds.main[stage];
        let url = `/actions/v2.0/calendars/${calendarId}/company-days`;

        const params: string[] = [];

        if (timeMin) {
            const dateTimeMin = DateApiFormat.dateToStrForCheckCalendarZero(timeMin);
            const timeMinFormat = dateTimeMin ? encodeURIComponent(dateTimeMin) : '';
            params.push('timeMin=' + timeMinFormat);
        }
        if (timeMax) {
            const dateTimeMax = DateApiFormat.dateToStrForCheckCalendarZero(timeMax);
            const timeMaxFormat = dateTimeMax ? encodeURIComponent(dateTimeMax) : '';
            params.push('timeMax=' + timeMaxFormat);
        }

        if (params.length) {
            url += '?' + params.join('&');
        }

        try {
            const options = ApiWeb100ControllerHelper.buildOptionWithRequestInfo('CompanyDays: get Company Days');
            const apiResponse = await ApiConnectorService.getInstance().get(url, options);

            // return Promise.resolve(new CompanyDays(apiResponse.data));
            return Promise.resolve(apiResponse.data);
        } catch (error) {
            global.logger.error('CompanyDays Error: get Company Days', error);
            throw error;
        }
    }
}
