import { addDays, addMinutes, format, fromUnixTime, getDay, isMatch, isPast } from 'date-fns';
import { capitalize } from '@core/Util';
import { insertStringatIndex, Logger } from '.';
import { REBOOT_WINDOW } from '@core/constants';

const dayIndex = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

//TODO: unused function
export const isValidTime = (str: string): boolean => {
  if (str.length === 4) {
    return isMatch(str.slice(0, 2), 'HH') && isMatch(str.slice(2), 'mm');
  }
  return false;
};

export const getTimerDaysString = (days: Weekday[]) => {
  if (days.length === 7) {
    return 'Every day';
  }

  return days.map((day) => capitalize(day.substring(0, 2))).join(', ');
};

export const timerUUID = (timer: onAndOffTimerSetting): string => {
  let uuid = [...timer.days].reduce((prev, day) => prev + day.substring(0, 2).toLowerCase(), '');
  uuid += timer.onTime.replace(/( |:)/g, '').toLowerCase();
  uuid += timer.offTime.replace(/( |:)/g, '').toLowerCase();
  return uuid;
};

// TODO: unused function
export const toHumanDate = (timestamp: number) => {
  const d = fromUnixTime(timestamp);
  return format(d, 'yyyy-MM-dd HH:mm:ss');
};

export const rightNow = () => {
  return format(new Date(), 'E LLL do h:mm a');
};

export const todayAsString = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const padZero = (int: number) => {
  return int < 10 && int >= 0 ? `0${int}` : `${int}`;
};

// TODO: unused function
export const is24HrTimeAfterNoon = (timeString: string) => {
  return parseInt(timeString.substring(0, 2)) >= 12 && parseInt(timeString.substring(0, 2)) < 24;
};

// TODO: unused function
export const timeStringto12Hour = (timeString: string) => {
  // Time string could be of format hh:mm or hh:mm:ss. Seconds will be zero and are padded to comply with cloud
  if (timeString.length === 5 || timeString.length == 8) {
    if (is24HrTimeAfterNoon(timeString)) {
      try {
        return format(new Date(`${todayAsString()} ${timeString}`), 'hhmm');
      } catch {
        Logger.error('Bad time value in utility function timeStringto12Hour');
      }
    } else if (parseInt(timeString.substring(0, 2)) === 12) {
      return timeString.replace(':', '');
    }
    return padZero(parseInt(timeString.substring(0, 2)) % 12) + timeString.substring(3);
  }
  return timeString;
};

export const getRandomTimeWindow = (time: string) => {
  // get random window within the hour to reboot (for network congestion when devices are configured in bulk).
  let targetDate = new Time(time).nextOccurrence()!;
  // random window is +60 mins or 5 mins in dev mode.
  const randomWindowSize = REBOOT_WINDOW;
  const randomOffset = Math.floor(Math.random() * randomWindowSize);
  targetDate = addMinutes(targetDate, randomOffset);

  return targetDate;
};

// returns boolean based on whether dates are equal or if date1 + 24 hours === date2
export const isSameTimeTodayOrTomorrow = (date1: Date, date2: Date) => {
  return date1.getTime() === date2.getTime() || addDays(date1, 1).getTime() === date2.getTime();
};

export const mapDeviceTimezonetoShadow = (deviceTimeZoneKey: string) => {
  switch (deviceTimeZoneKey) {
    case 'EST':
      return 'EST - US Eastern Time';
    case 'CST':
      return 'CST - US Central Time';
    case 'MST':
      return 'MST - US Mountain Time';
    case 'PST':
      return 'PST - US Pacific Time';
    case 'AKST':
      return 'AKST - Alaska Time';
    case 'HST':
      return 'HST - Hawaii - Aleutian Time without Daylight Saving Time (Hawaii)';
    case 'HST1':
      return 'HST1 - Hawaii - Aleutian Time with Daylight Saving Time';
    case 'MST1':
      return 'MST1 - US Mountain Time without Daylight Saving Time (Arizona)';
    case 'EST1':
      return 'EST1 - US Eastern Time without Daylight Saving Time (East Indiana)';
    case 'AST':
      return 'AST - Atlantic Time';
    case 'CST2':
      return 'CST2 - Mexico (Mexico City)';
    case 'MST2':
      return 'MST2 - Mexico (Chihuahua)';
    case 'PST2':
      return 'PST2 - Mexico (Tijuana)';
    case 'BRT':
      return 'BRT - Brazil Time (São Paulo)';
    case 'NST':
      return 'NST - Newfoundland Time';
    case 'AZOT':
      return 'AZOT - Azores Time';
    case 'GMTBST':
      return 'GMTBST - London / Dublin Time';
    case 'WET':
      return 'WET - Western European Time (Lisbon)';
    case 'CET':
      return 'CET - Central European Time (Copenhagen, Berlin, Paris)';
    case 'EET':
      return 'EET - Eastern European Time (Helsinki)';
    case 'MSK':
      return 'MSK - Moscow Time';
    case 'SAMT':
      return 'SAMT - Delta Time Zone (Samara)';
    case 'YEKT':
      return 'YEKT - Echo Time Zone (Yekaterinburg)';
    case 'IST':
      return 'IST - Indian Standard Time';
    case 'NPT':
      return 'NPT - Nepal Time';
    case 'OMST':
      return 'OMST - Foxtrot Time Zone (Omsk)';
    case 'JST':
      return 'JST - Japanese Standard Time';
    case 'CXT':
      return 'CXT - Christmas Island Time (Australia)';
    case 'AWST':
      return 'AWST - Australian Western Time with Daylight Saving Time';
    case 'AWST1':
      return 'AWST1 - Australian Western Time without Daylight Saving Time';
    case 'ACST':
      return 'ACST - Australian Central Standard Time (CST) with Daylight Saving Time';
    case 'ACST1':
      return 'ACST1 - Darwin, Australia and Australian Central Standard Time (CST) without Daylight Saving Time';
    case 'AEST':
      return 'AEST - Australian Eastern Time with Daylight Saving Time';
    case 'AEST1':
      return 'AEST1 - Australian Eastern Time without Daylight Saving Time (Brisbane)';
    case 'NFT':
      return 'NFT - Norfolk (Island) Time (Australia)';
    case 'NZST':
      return 'NZST - New Zealand Time (Auckland)';
    case 'CHAST':
      return 'CHAST - Fiji Time, Fiji, Pacific / Fiji, Yankee Time Zone (Fiji)';
    case 'SST':
      return 'SST - X-ray Time Zone (Pago Pago)';
    case 'GMT':
      return 'GMT - Greenwich Mean Time';
    case 'GMT-1':
      return 'GMT-1 - 1 hour behind Greenwich Mean Time';
    case 'GMT-2':
      return 'GMT-2 - 2 hours behind Greenwich Mean Time';
    case 'GMT-3':
      return 'GMT-3 - 3 hours behind Greenwich Mean Time';
    case 'GMT-3:30':
      return 'GMT-3: 30 - 3.5 hours behind Greenwich Mean Time';
    case 'GMT-4':
      return 'GMT-4 - 4 hours behind Greenwich Mean Time';
    case 'GMT-4:30':
      return 'GMT-4: 30 - 4.5 hours behind Greenwich Mean Time';
    case 'GMT-5':
      return 'GMT-5 - 5 hours behind Greenwich Mean Time';
    case 'GMT-6':
      return 'GMT-6 - 6 hours behind Greenwich Mean Time';
    case 'GMT-7':
      return 'GMT-7 - 7 hours behind Greenwich Mean Time';
    case 'GMT-8':
      return 'GMT-8 - 8 hours behind Greenwich Mean Time';
    case 'GMT-9':
      return 'GMT-9 - 9 hours behind Greenwich Mean Time';
    case 'GMT-9:30':
      return 'GMT-9: 30 - 9.5 hours behind Greenwich Mean Time';
    case 'GMT-10':
      return 'GMT-10 - 10 hours behind Greenwich Mean Time';
    case 'GMT-11':
      return 'GMT-11 - 11 hours behind Greenwich Mean Time';
    case 'GMT-12':
      return 'GMT-12 - 12 hours behind Greenwich Mean Time';
    case 'GMT-13':
      return 'GMT-13 - 13 hours behind Greenwich Mean Time';
    case 'GMT-14':
      return 'GMT-14 - 14 hours behind Greenwich Mean Time';
    case 'GMT+1':
      return 'GMT+1 - 1 hour ahead of Greenwich Mean Time';
    case 'GMT+2':
      return 'GMT+2 - 2 hours ahead of Greenwich Mean Time';
    case 'GMT+3':
      return 'GMT+3 - 3 hours ahead of Greenwich Mean Time';
    case 'GMT+3:30':
      return 'GMT+3: 30 - 3.5 hours ahead of Greenwich Mean Time';
    case 'GMT+4':
      return 'GMT+4 - 4 hours ahead of Greenwich Mean Time';
    case 'GMT+4:30':
      return 'GMT+4: 30 - 4.5 hours ahead of Greenwich Mean Time';
    case 'GMT+5':
      return 'GMT+5 - 5 hours ahead of Greenwich Mean Time';
    case 'GMT+5:30':
      return 'GMT+5: 30 - 5.5 hours ahead of Greenwich Mean Time';
    case 'GMT+6':
      return 'GMT+6 - 6 hours ahead of Greenwich Mean Time';
    case 'GMT+6:30':
      return 'GMT+6: 30 - 6.5 hours ahead of Greenwich Mean Time';
    case 'GMT+7':
      return 'GMT+7 - 7 hours ahead of Greenwich Mean Time';
    case 'GMT+7:30':
      return 'GMT+7: 30 - 7.5 hours ahead of Greenwich Mean Time';
    case 'GMT+8':
      return 'GMT+8 - 8 hours ahead of Greenwich Mean Time';
    case 'GMT+8:30':
      return 'GMT+8: 30 - 8.5 hours ahead of Greenwich Mean Time';
    case 'GMT+9':
      return 'GMT+9 - 9 hours ahead of Greenwich Mean Time';
    case 'GMT+9:30':
      return 'GMT+9: 30 - 9.5 hours ahead of Greenwich Mean Time';
    case 'GMT+10':
      return 'GMT+10 - 10 hours ahead of Greenwich Mean Time';
    case 'GMT+10:30':
      return 'GMT+10: 30 - 10.5 hours ahead of Greenwich Mean Time';
    case 'GMT+11':
      return 'GMT+11 - 11 hours ahead of Greenwich Mean Time';
    case 'GMT+11:30':
      return 'GMT+11: 30 - 11.5 hours ahead of Greenwich Mean Time';
    case 'GMT+12':
      return 'GMT+12 - 12 hours ahead of Greenwich Mean Time';
    case 'GMT+12:30':
      return 'GMT+12: 30 - 12.5 hours ahead of Greenwich Mean Time';
    case 'GMT+13':
      return 'GMT+13 - 13 hours ahead of Greenwich Mean Time';
    case 'GMT+14':
      return 'GMT+14 - 14 hours ahead of Greenwich Mean Time';
    default:
      return deviceTimeZoneKey;
  }
};

export const mapShadowTimezoneToDevice = (shadowTimeZoneKey: string) => {
  switch (shadowTimeZoneKey) {
    case 'EST - US Eastern Time':
      return 'EST';
    case 'CST - US Central Time':
      return 'CST';
    case 'MST - US Mountain Time':
      return 'MST';
    case 'PST - US Pacific Time':
      return 'PST';
    case 'AKST - Alaska Time':
      return 'AKST';
    case 'HST - Hawaii - Aleutian Time without Daylight Saving Time (Hawaii)':
      return 'HST';
    case 'HST1 - Hawaii - Aleutian Time with Daylight Saving Time':
      return 'HST1';
    case 'MST1 - US Mountain Time without Daylight Saving Time (Arizona)':
      return 'MST1';
    case 'EST1 - US Eastern Time without Daylight Saving Time (East Indiana)':
      return 'EST1';
    case 'AST - Atlantic Time':
      return 'AST';
    case 'CST2 - Mexico (Mexico City)':
      return 'CST2';
    case 'MST2 - Mexico (Chihuahua)':
      return 'MST2';
    case 'PST2 - Mexico (Tijuana)':
      return 'PST2';
    case 'BRT - Brazil Time (São Paulo)':
      return 'BRT';
    case 'NST - Newfoundland Time':
      return 'NST';
    case 'AZOT - Azores Time':
      return 'AZOT';
    case 'GMTBST - London / Dublin Time':
      return 'GMTBST';
    case 'WET - Western European Time (Lisbon)':
      return 'WET';
    case 'CET - Central European Time (Copenhagen, Berlin, Paris)':
      return 'CET';
    case 'EET - Eastern European Time (Helsinki)':
      return 'EET';
    case 'MSK - Moscow Time':
      return 'MSK';
    case 'SAMT - Delta Time Zone (Samara)':
      return 'SAMT';
    case 'YEKT - Echo Time Zone (Yekaterinburg)':
      return 'YEKT';
    case 'IST - Indian Standard Time':
      return 'IST';
    case 'NPT - Nepal Time':
      return 'NPT';
    case 'OMST - Foxtrot Time Zone (Omsk)':
      return 'OMST';
    case 'JST - Japanese Standard Time':
      return 'JST';
    case 'CXT - Christmas Island Time (Australia)':
      return 'CXT';
    case 'AWST - Australian Western Time with Daylight Saving Time':
      return 'AWST';
    case 'AWST1 - Australian Western Time without Daylight Saving Time':
      return 'AWST1';
    case 'ACST - Australian Central Standard Time (CST) with Daylight Saving Time':
      return 'ACST';
    case 'ACST1 - Darwin, Australia and Australian Central Standard Time (CST) without Daylight Saving Time':
      return 'ACST1';
    case 'AEST - Australian Eastern Time with Daylight Saving Time':
      return 'AEST';
    case 'AEST1 - Australian Eastern Time without Daylight Saving Time (Brisbane)':
      return 'AEST1';
    case 'NFT - Norfolk (Island) Time (Australia)':
      return 'NFT';
    case 'NZST - New Zealand Time (Auckland)':
      return 'NZST';
    case 'CHAST - Fiji Time, Fiji, Pacific / Fiji, Yankee Time Zone (Fiji)':
      return 'CHAST';
    case 'SST - X-ray Time Zone (Pago Pago)':
      return 'SST';
    case 'GMT - Greenwich Mean Time':
      return 'GMT';
    case 'GMT-1 - 1 hour behind Greenwich Mean Time':
      return 'GMT-1';
    case 'GMT-2 - 2 hours behind Greenwich Mean Time':
      return 'GMT-2';
    case 'GMT-3 - 3 hours behind Greenwich Mean Time':
      return 'GMT-3';
    case 'GMT-3: 30 - 3.5 hours behind Greenwich Mean Time':
      return 'GMT-3:30';
    case 'GMT-4 - 4 hours behind Greenwich Mean Time':
      return 'GMT-4';
    case 'GMT-4: 30 - 4.5 hours behind Greenwich Mean Time':
      return 'GMT-4:30';
    case 'GMT-5 - 5 hours behind Greenwich Mean Time':
      return 'GMT-5';
    case 'GMT-6 - 6 hours behind Greenwich Mean Time':
      return 'GMT-6';
    case 'GMT-7 - 7 hours behind Greenwich Mean Time':
      return 'GMT-7';
    case 'GMT-8 - 8 hours behind Greenwich Mean Time':
      return 'GMT-8';
    case 'GMT-9 - 9 hours behind Greenwich Mean Time':
      return 'GMT-9';
    case 'GMT-9: 30 - 9.5 hours behind Greenwich Mean Time':
      return 'GMT-9:30';
    case 'GMT-10 - 10 hours behind Greenwich Mean Time':
      return 'GMT-10';
    case 'GMT-11 - 11 hours behind Greenwich Mean Time':
      return 'GMT-11';
    case 'GMT-12 - 12 hours behind Greenwich Mean Time':
      return 'GMT-12';
    case 'GMT-13 - 13 hours behind Greenwich Mean Time':
      return 'GMT-13';
    case 'GMT-14 - 14 hours behind Greenwich Mean Time':
      return 'GMT-14';
    case 'GMT+1 - 1 hour ahead of Greenwich Mean Time':
      return 'GMT+1';
    case 'GMT+2 - 2 hours ahead of Greenwich Mean Time':
      return 'GMT+2';
    case 'GMT+3 - 3 hours ahead of Greenwich Mean Time':
      return 'GMT+3';
    case 'GMT+3: 30 - 3.5 hours ahead of Greenwich Mean Time':
      return 'GMT+3:30';
    case 'GMT+4 - 4 hours ahead of Greenwich Mean Time':
      return 'GMT+4';
    case 'GMT+4: 30 - 4.5 hours ahead of Greenwich Mean Time':
      return 'GMT+4:30';
    case 'GMT+5 - 5 hours ahead of Greenwich Mean Time':
      return 'GMT+5';
    case 'GMT+5: 30 - 5.5 hours ahead of Greenwich Mean Time':
      return 'GMT+5:30';
    case 'GMT+6 - 6 hours ahead of Greenwich Mean Time':
      return 'GMT+6';
    case 'GMT+6: 30 - 6.5 hours ahead of Greenwich Mean Time':
      return 'GMT+6:30';
    case 'GMT+7 - 7 hours ahead of Greenwich Mean Time':
      return 'GMT+7';
    case 'GMT+7: 30 - 7.5 hours ahead of Greenwich Mean Time':
      return 'GMT+7:30';
    case 'GMT+8 - 8 hours ahead of Greenwich Mean Time':
      return 'GMT+8';
    case 'GMT+8: 30 - 8.5 hours ahead of Greenwich Mean Time':
      return 'GMT+8:30';
    case 'GMT+9 - 9 hours ahead of Greenwich Mean Time':
      return 'GMT+9';
    case 'GMT+9: 30 - 9.5 hours ahead of Greenwich Mean Time':
      return 'GMT+9:30';
    case 'GMT+10 - 10 hours ahead of Greenwich Mean Time':
      return 'GMT+10';
    case 'GMT+10: 30 - 10.5 hours ahead of Greenwich Mean Time':
      return 'GMT+10:30';
    case 'GMT+11 - 11 hours ahead of Greenwich Mean Time':
      return 'GMT+11';
    case 'GMT+11: 30 - 11.5 hours ahead of Greenwich Mean Time':
      return 'GMT+11:30';
    case 'GMT+12 - 12 hours ahead of Greenwich Mean Time':
      return 'GMT+12';
    case 'GMT+12: 30 - 12.5 hours ahead of Greenwich Mean Time':
      return 'GMT+12:30';
    case 'GMT+13 - 13 hours ahead of Greenwich Mean Time':
      return 'GMT+13';
    case 'GMT+14 - 14 hours ahead of Greenwich Mean Time':
      return 'GMT+14';

    default:
      return shadowTimeZoneKey;
  }
};

export const getNextOccurrenceOfWeekday = (day: Weekday, time = ''): Date => {
  const today = new Date(`${todayAsString()} ${time}`);
  const isToday = getDay(today) === dayIndex[day];

  if (isPast(today) || !isToday) {
    today.setDate(today.getDate() + ((dayIndex[day] - 1 - today.getDay() + 7) % 7) + 1);
  }

  return today;
};

export const currentlyWithinTimerWindow = (timer: onAndOffTimerSetting) => {
  const now = new Date();
  if ((timer.days as string[]).includes(weekdays[now.getDay()])) {
    const offTime = new Time(timer.offTime);
    const onTime = new Time(timer.onTime);
    if (isPast(offTime.asDate()!) && !isPast(onTime.asDate()!)) {
      return true;
    }
  }
  return false;
};

export class Time {
  date?: Date;
  timeString?: string;

  constructor(timeString: string | Date) {
    if (typeof timeString === 'string') {
      if (timeString.match(/\d{4}\s?(AM|PM)?/i)) {
        // after noon but with meridiem
        timeString = this.adjustMeridiem(timeString);
        this.timeString = insertStringatIndex(timeString, ':', 2);
        this.date = this.createDateFromString(this.timeString);
      } else if (timeString.includes(':')) {
        timeString = this.adjustMeridiem(timeString);
        this.timeString = timeString;
        this.date = this.createDateFromString(timeString);
      } else {
        this.date = new Date('-');
        this.timeString = timeString;
      }
    } else if (timeString instanceof Date) {
      this.date = timeString;
    } else {
      this.date = new Date('-');
      this.timeString = timeString;
    }
  }

  private adjustMeridiem(timeString: string) {
    if (parseInt(timeString.substring(0, 2)) >= 12 && timeString.match(/(AM|PM)/i)) {
      return timeString.replace(/\s+(AM|PM)/gi, '');
    }
    return timeString;
  }
  private createDateFromString(str: string): Date {
    return new Date(`${todayAsString()} ${str}`);
  }

  asDate(): Date | undefined {
    if (this.isValid()) return this.date;
    return undefined;
  }

  isAfterNoon(): boolean {
    if (this.timeString) {
      return parseInt(this.timeString?.substring(0, 2)) > 12 ?? false;
    }
    return false;
  }

  static isAfterNoon(timeString: string): boolean {
    if (timeString) {
      return parseInt(timeString.substring(0, 2)) > 12 ?? false;
    }
    return false;
  }

  isValid() {
    return this.date?.toString() !== 'Invalid Date' ?? false;
  }

  isPM() {
    if (this.isValid()) {
      return this.date!.getHours() >= 12;
    } else {
      return false;
    }
  }

  isPast(): boolean {
    return this.date ? isPast(this.date) : false;
  }

  nextOccurrence(): Date | undefined {
    if (this.date) {
      if (this.isPast()) {
        return addDays(this.date, 1);
      }
      return this.date;
    }
    return undefined;
  }

  toUIFormat() {
    if (this.isValid()) {
      try {
        return format(this.date!, 'hhmm');
      } catch {
        return this.timeString?.replace(/:/g, '');
      }
    } else {
      return this.timeString?.replace(/:/g, '');
    }
  }

  to24hString(): string {
    if (this.isValid()) {
      try {
        return format(this.date!, 'HH:mm:ss');
      } catch {
        return this.timeString?.toString() ?? '';
      }
    }
    return this.timeString?.toString() ?? '';
  }

  toFormat(_format: string) {
    if (this.isValid()) {
      try {
        return format(this.date!, _format);
      } catch {
        return this.timeString?.toString() ?? '';
      }
    }
    return this.timeString?.toString() ?? '';
  }

  addMinutes(minutes: number): Date | undefined {
    if (this.isValid()) {
      return addMinutes(this.date!, minutes);
    }
  }
}
