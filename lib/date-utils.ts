// Lightweight Date Utility Library for ElioEstudio OS
// Eliminates the need for 'date-fns' or 'moment' to keep the bundle size small and execution fast.

export const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const getMonthName = (date: Date) => months[date.getMonth()];

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export const formatDateISO = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const isDateInRange = (date: Date, startStr: string, endStr?: string) => {
  const checkTime = date.getTime();
  const start = new Date(startStr);
  start.setHours(0,0,0,0);
  const startTime = start.getTime();

  if (!endStr) {
    // Single day check
    const current = new Date(date);
    current.setHours(0,0,0,0);
    return current.getTime() === startTime;
  }

  const end = new Date(endStr);
  end.setHours(23,59,59,999);
  const endTime = end.getTime();

  return checkTime >= startTime && checkTime <= endTime;
};

export const addMonths = (date: Date, monthsToAdd: number) => {
  const newDate = new Date(date);
  newDate.setMonth(date.getMonth() + monthsToAdd);
  return newDate;
};

// Generates the grid array for the calendar view
export const generateCalendarGrid = (currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // 0 = Sunday
  
  // Adjust for Monday start (Spanish standard)
  // standard: 0(Sun) 1(Mon) ... 6(Sat)
  // desired: 0(Mon) 1(Tue) ... 6(Sun)
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const prevMonthDays = getDaysInMonth(year, month - 1);
  
  const days = [];

  // Previous month filler
  for (let i = adjustedFirstDayIndex; i > 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i + 1),
      isCurrentMonth: false
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Next month filler (to complete 42 cells grid usually, or 35)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  return days;
};