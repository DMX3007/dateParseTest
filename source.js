const { parse, parseISO, isValid, format } = require('date-fns');
const { ru } = require('date-fns/locale');

function cleanDateString(dateString) {
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
    return dateString.trim();
  }

  return dateString
  .replace(/www\.ru;\s*/i, '')
  .replace(/\(по местному времени\)/gi, '')
  .replace(/\(по московскому времени\)/gi, '')
  .replace(/года|г\.|г(?![а-яё])|часов|часа|час|\sв\s/gi, '')
  .replace(/[;,()«»"']/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
}
function parseRussianDate(cleanedDateString) {
  const russianMonths = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12',
    'янв': '01', 'фев': '02', 'мар': '03', 'апр': '04',
    'май': '05', 'июн': '06', 'июл': '07', 'авг': '08',
    'сен': '09', 'окт': '10', 'ноя': '11', 'дек': '12'
  };
  

  const russianDateRegex = /^(\d{1,2})\s+([\wа-я]+)\.?\s+(\d{4})/i;
  const match = cleanedDateString.match(russianDateRegex);

  if (match) {
    const [_, day, monthStr, year] = match;
    const month = russianMonths[monthStr.toLowerCase()];
    if (month) {
      const paddedDay = day.padStart(2, '0');
      return `${year}-${month}-${paddedDay}T00:00:00.000Z`;
    }
  }
  return null;
}
function source({ src, options }) {
  const dateString = src[options];
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Invalid input');
  }

  const originalDateString = dateString.trim();
  const cleanedDateString = cleanDateString(dateString);

  // Handle ISO dates with timezone
  if (/^\d{4}-\d{2}-\d{2}T.*[+-]\d{2}:\d{2}$/.test(originalDateString)) {
    return originalDateString;
  }

  // Handle UTC dates
  if (/^\d{4}-\d{2}-\d{2}T.*Z$/.test(originalDateString)) {
    return originalDateString;
  }

  // Handle dates with timezone but no time
  if (/^\d{4}-\d{2}-\d{2}[+-]\d{2}:\d{2}$/.test(originalDateString)) {
    const [year, month, day] = originalDateString.substring(0, 10).split('-');
    const timezone = originalDateString.substring(10);
    return `${year}-${month}-${day}T00:00:00.000${timezone}`;
  }
  
  const russianDate = parseRussianDate(cleanedDateString);
  if (russianDate) {
    return russianDate;
  }

  // Additional formats for YYYY-MM-DD HH:mm and YYYY.MM.DD HH:mm
  const specialFormats = [
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/,
    /^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/
  ];

  for (const format of specialFormats) {
    const match = cleanedDateString.match(format);
    if (match) {
      const [_, year, month, day, hour, minute] = match;
      return `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
    }
  }

  const formats = [
    "yyyy-MM-dd'T'HH:mm:ss.SSS",
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd",
    "dd-MM-yyyy HH:mm",
    "dd.MM.yyyy HH:mm",
    "dd/MM/yyyy HH:mm",
    "dd-MM-yyyy",
    "dd.MM.yyyy",
    "dd/MM/yyyy",
    "yyyy.MM.dd"
  ];

  for (const formatString of formats) {
    try {
      const parsedDate = parse(cleanedDateString, formatString, new Date(), { locale: ru });
      if (isValid(parsedDate)) {
        return format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error('Unrecognized date format');
}

module.exports = source;
