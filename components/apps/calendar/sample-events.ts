import { CalendarEvent } from "./types";

// Date night restaurants (cycled through on Saturdays)
export const DATE_NIGHT_RESTAURANTS = [
  { name: "3rd Cousin", address: "919 Cortland Ave, SF", url: "https://www.3rdcousinsf.com/" },
  { name: "Foreign Cinema", address: "2534 Mission St, SF", url: "https://foreigncinema.com/" },
  { name: "Flour + Water", address: "2401 Harrison St, SF", url: "https://www.flourandwater.com/" },
  { name: "Frances", address: "3870 17th St, SF", url: "https://www.frances-sf.com/" },
  { name: "Friends Only", address: "1501 California St, SF", url: "https://www.exploretock.com/friendsonly/" },
  { name: "Itria", address: "3266 24th St, SF", url: "https://www.itriasf.com/" },
  { name: "Kokkari", address: "200 Jackson St, SF", url: "https://kokkari.com/" },
  { name: "Lupa Trattoria", address: "4109 24th St, SF", url: "https://www.lupatrattoria.com/" },
  { name: "La Ciccia", address: "291 30th St, SF", url: "http://www.laciccia.com/" },
  { name: "Rich Table", address: "199 Gough St, SF", url: "https://www.richtablesf.com/" },
  { name: "Routier", address: "2801 California St, SF", url: "https://www.routiersf.com/" },
  { name: "Sorrel", address: "3228 Sacramento St, SF", url: "https://www.sorrelrestaurant.com/" },
  { name: "Verjus", address: "550 Washington St, SF", url: "https://www.verjuscave.com/" },
  { name: "Via Aurelia", address: "300 Toni Stone Xing, SF", url: "https://www.viaaureliasf.com/" },
  { name: "Zuni Cafe", address: "1658 Market St, SF", url: "http://zunicafe.com/" },
];

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Helper to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper to get the day of week (0 = Sunday, 6 = Saturday)
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

// Helper to check if a day is a weekday
function isWeekday(date: Date): boolean {
  const day = getDayOfWeek(date);
  return day >= 1 && day <= 5;
}

// Helper to check if a day is Saturday
function isSaturday(date: Date): boolean {
  return getDayOfWeek(date) === 6;
}

// Helper to check if a day is Sunday
function isSunday(date: Date): boolean {
  return getDayOfWeek(date) === 0;
}

// Get a consistent restaurant for a given Saturday (based on week number)
function getRestaurantForSaturday(date: Date): typeof DATE_NIGHT_RESTAURANTS[0] {
  // Use the week of the year to cycle through restaurants
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.floor((date.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const index = weekNumber % DATE_NIGHT_RESTAURANTS.length;
  return DATE_NIGHT_RESTAURANTS[index];
}

// Generate sample events for a range of days around today
export function generateSampleEvents(daysRange: number = 365): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate events for daysRange days before and after today
  for (let i = -daysRange; i <= daysRange; i++) {
    const date = addDays(today, i);
    const dateStr = formatDate(date);
    const dayOfWeek = getDayOfWeek(date);

    // exercise - 7-8am every day
    events.push({
      id: `sample-exercise-${dateStr}`,
      title: "exercise",
      startDate: dateStr,
      endDate: dateStr,
      startTime: "07:00",
      endTime: "08:00",
      isAllDay: false,
      calendarId: "exercise",
    });

    // focus time - 9am-1pm every day
    events.push({
      id: `sample-focus-${dateStr}`,
      title: "focus time",
      startDate: dateStr,
      endDate: dateStr,
      startTime: "09:00",
      endTime: "13:00",
      isAllDay: false,
      calendarId: "focus",
    });

    // Afternoon meetings
    if (isWeekday(date)) {
      // weekdays: 3 meetings at 1:30, 3:00, 4:30
      events.push({
        id: `sample-meeting1-${dateStr}`,
        title: "busy",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "13:30",
        endTime: "14:30",
        isAllDay: false,
        calendarId: "meetings",
      });
      events.push({
        id: `sample-meeting2-${dateStr}`,
        title: "busy",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "15:00",
        endTime: "16:00",
        isAllDay: false,
        calendarId: "meetings",
      });
      events.push({
        id: `sample-meeting3-${dateStr}`,
        title: "busy",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "16:30",
        endTime: "17:30",
        isAllDay: false,
        calendarId: "meetings",
      });

      // weeknight dinner at 6:30pm
      events.push({
        id: `sample-dinner-${dateStr}`,
        title: "dinner",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "18:30",
        endTime: "19:30",
        isAllDay: false,
        calendarId: "dinner",
      });
    } else {
      // weekends: 2 meetings at 2:00, 3:30
      events.push({
        id: `sample-meeting1-${dateStr}`,
        title: "busy",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "14:00",
        endTime: "15:00",
        isAllDay: false,
        calendarId: "meetings",
      });
      events.push({
        id: `sample-meeting2-${dateStr}`,
        title: "busy",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "15:30",
        endTime: "16:30",
        isAllDay: false,
        calendarId: "meetings",
      });

      if (isSaturday(date)) {
        // date night on saturday
        const restaurant = getRestaurantForSaturday(date);
        events.push({
          id: `sample-datenight-${dateStr}`,
          title: `date night`,
          startDate: dateStr,
          endDate: dateStr,
          startTime: "18:30",
          endTime: "21:00",
          isAllDay: false,
          calendarId: "dinner",
          location: `${restaurant.name.toLowerCase()}, ${restaurant.address.toLowerCase()}`,
        });
      } else if (isSunday(date)) {
        // steak sunday
        events.push({
          id: `sample-steaksunday-${dateStr}`,
          title: "steak sunday",
          startDate: dateStr,
          endDate: dateStr,
          startTime: "18:30",
          endTime: "20:00",
          isAllDay: false,
          calendarId: "dinner",
          location: "home",
        });
      }
    }
  }

  return events;
}
