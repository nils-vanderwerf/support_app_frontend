import { parseAvail } from './SupportWorkerList';

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const allTrue = (days: string[]) => Object.fromEntries(days.map(d => [d, true]));

describe('parseAvail', () => {
  // -------------------------------------------------------------------------
  // Falsy / empty inputs
  // -------------------------------------------------------------------------

  it('returns {} for null', () => expect(parseAvail(null)).toEqual({}));
  it('returns {} for undefined', () => expect(parseAvail(undefined)).toEqual({}));
  it('returns {} for empty string', () => expect(parseAvail('')).toEqual({}));

  // -------------------------------------------------------------------------
  // JSON inputs
  // -------------------------------------------------------------------------

  it('parses a valid JSON availability object (legacy boolean-map format)', () => {
    const json = JSON.stringify({ monday: true, wednesday: true, friday: false });
    expect(parseAvail(json)).toEqual({ monday: true, wednesday: true, friday: false });
  });

  it('parses AvailabilitySelector JSON format {days:[...], time_window} into a boolean map', () => {
    const json = JSON.stringify({ days: ['Mon', 'Wed', 'Fri'], time_window: '09:00-17:00' });
    expect(parseAvail(json)).toEqual({ monday: true, wednesday: true, friday: true });
  });

  it('parses single-day AvailabilitySelector JSON', () => {
    expect(parseAvail(JSON.stringify({ days: ['Mon'], time_window: '09:00-17:00' }))).toEqual({ monday: true });
    expect(parseAvail(JSON.stringify({ days: ['Tue'], time_window: '09:00-17:00' }))).toEqual({ tuesday: true });
  });

  it('parses weekend-only AvailabilitySelector JSON', () => {
    const json = JSON.stringify({ days: ['Sat', 'Sun'], time_window: '10:00-18:00' });
    expect(parseAvail(json)).toEqual({ saturday: true, sunday: true });
  });

  it('parses full-week AvailabilitySelector JSON', () => {
    const json = JSON.stringify({ days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], time_window: '06:00-22:00' });
    expect(parseAvail(json)).toEqual(allTrue(ALL_DAYS));
  });

  it('treats invalid JSON as a plain string', () => {
    expect(parseAvail('Weekdays')).toEqual(allTrue(WEEKDAYS));
  });

  // -------------------------------------------------------------------------
  // "Available now / always" keywords
  // -------------------------------------------------------------------------

  it.each(['now', 'Now', 'NOW', 'immediately', 'Immediately', 'flexible', 'all', 'all days', 'any', 'anytime'])(
    '"%s" maps to all seven days',
    (raw) => expect(parseAvail(raw)).toEqual(allTrue(ALL_DAYS))
  );

  // -------------------------------------------------------------------------
  // Weekday keywords
  // -------------------------------------------------------------------------

  it.each(['weekdays', 'Weekdays', 'weekday', 'mon-fri', 'monday to friday', 'monday - friday'])(
    '"%s" maps to Monday–Friday',
    (raw) => expect(parseAvail(raw)).toEqual(allTrue(WEEKDAYS))
  );

  // -------------------------------------------------------------------------
  // Weekend keywords
  // -------------------------------------------------------------------------

  it.each(['weekends', 'Weekends', 'weekend', 'sat-sun', 'saturday and sunday'])(
    '"%s" maps to Saturday and Sunday',
    (raw) => expect(parseAvail(raw)).toEqual({ saturday: true, sunday: true })
  );

  // -------------------------------------------------------------------------
  // Single-day full names
  // -------------------------------------------------------------------------

  it.each(ALL_DAYS)('full name "%s" maps to that day only', (day) => {
    expect(parseAvail(day)).toEqual({ [day]: true });
    expect(parseAvail(day[0].toUpperCase() + day.slice(1))).toEqual({ [day]: true });
  });

  // -------------------------------------------------------------------------
  // Single-day abbreviations
  // -------------------------------------------------------------------------

  it.each([
    ['mon',   'monday'],
    ['tue',   'tuesday'],
    ['tues',  'tuesday'],
    ['wed',   'wednesday'],
    ['thu',   'thursday'],
    ['thur',  'thursday'],
    ['thurs', 'thursday'],
    ['fri',   'friday'],
    ['sat',   'saturday'],
    ['sun',   'sunday'],
  ])('abbreviation "%s" maps to %s', (abbr, full) => {
    expect(parseAvail(abbr)).toEqual({ [full]: true });
  });

  // -------------------------------------------------------------------------
  // Comma-separated lists
  // -------------------------------------------------------------------------

  it('parses "Tues, Wed, Thurs"', () => {
    expect(parseAvail('Tues, Wed, Thurs')).toEqual({
      tuesday: true, wednesday: true, thursday: true,
    });
  });

  it('parses "Mon, Wed, Fri"', () => {
    expect(parseAvail('Mon, Wed, Fri')).toEqual({
      monday: true, wednesday: true, friday: true,
    });
  });

  it('parses "Saturday, Sunday"', () => {
    expect(parseAvail('Saturday, Sunday')).toEqual({ saturday: true, sunday: true });
  });

  // -------------------------------------------------------------------------
  // Slash / ampersand / space separators
  // -------------------------------------------------------------------------

  it('parses "Mon/Wed/Fri"', () => {
    expect(parseAvail('Mon/Wed/Fri')).toEqual({
      monday: true, wednesday: true, friday: true,
    });
  });

  it('parses "Mon & Wed"', () => {
    expect(parseAvail('Mon & Wed')).toEqual({ monday: true, wednesday: true });
  });

  it('parses "Tues Wed Thurs" (space-separated)', () => {
    expect(parseAvail('Tues Wed Thurs')).toEqual({
      tuesday: true, wednesday: true, thursday: true,
    });
  });

  it('parses "Monday+Friday"', () => {
    expect(parseAvail('Monday+Friday')).toEqual({ monday: true, friday: true });
  });

  // -------------------------------------------------------------------------
  // Unrecognised strings
  // -------------------------------------------------------------------------

  it('returns {} for a completely unrecognised string', () => {
    expect(parseAvail('call to arrange')).toEqual({});
  });

  it('returns {} for a numeric string', () => {
    expect(parseAvail('12345')).toEqual({});
  });
});
