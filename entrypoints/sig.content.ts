const daysMapping = {
  2: 'SEG',
  3: 'TER',
  4: 'QUA',
  5: 'QUI',
  6: 'SEX',
  7: 'SAB'
} as const;

const hoursMapping = {
  'M1': {inicio: '08:00', fim: '08:50'},
  'M2': {inicio: '08:55', fim: '09:50'},
  'M3': {inicio: '10:00', fim: '10:55'},
  'M4': {inicio: '10:55', fim: '11:50'},
  'M5': {inicio: '12:00', fim: '12:55'},
  'T1': {inicio: '12:55', fim: '13:50'},
  'T2': {inicio: '14:00', fim: '14:55'},
  'T3': {inicio: '14:55', fim: '15:50'},
  'T4': {inicio: '16:00', fim: '16:55'},
  'T5': {inicio: '16:55', fim: '17:50'},
  'T6': {inicio: '18:00', fim: '18:55'},
  'T7': {inicio: '18:55', fim: '19:50'},
  'N1': {inicio: '19:00', fim: '19:50'},
  'N2': {inicio: '19:50', fim: '21:00'},
  'N3': {inicio: '21:00', fim: '21:50'},
  'N4': {inicio: '21:00', fim: '23:00'},
  'N5': {inicio: '22:10', fim: '23:00'}
} as const;

type DAY_POS = keyof typeof daysMapping;
type HOUR_POS = keyof typeof hoursMapping;

const sigPattern = /\b([2-7])([MTN])([1-7]{1,2})\b/;

const transformItinerary = (match: string) => {
  const [, day, period, hours] = match.match(sigPattern) || [];
  if (!day || !period || !hours) return match;

  const weekDay = daysMapping[day as DAY_POS];
  const startHour = hoursMapping[`${period}${hours[0]}` as HOUR_POS].inicio;
  const endHour = hoursMapping[`${period}${hours[hours.length - 1]}` as HOUR_POS].fim;

  return `${weekDay} ${startHour}-${endHour}`;
};

const sortAndDeduplicate = (txt: string) => {
  const schedules = txt.match(/\b[2-7][MTN][1-7]{1,2}\b/g) || [];
  const uniqueSchedules = Array.from(new Set(schedules));
  return uniqueSchedules.sort((a, b) => {
    const dayA = a[0];
    const dayB = b[0];
    return dayA < dayB ? -1 : dayA > dayB ? 1 : 0;
  }).join(' ');
};

const formatSchedule = (scheduleString: string) => {
  let formattedSchedule = sortAndDeduplicate(scheduleString);
  formattedSchedule = formattedSchedule.replace(/\b[2-7][MTN][1-7]{1,2}\b/g, transformItinerary);
  return formattedSchedule;
};

const processNode = (node: Text) => {
  if (node.textContent) {
    let content = node.textContent;
    content = formatSchedule(content);
    node.textContent = content;
  }
};

const walkTree = (root: Node) => {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) =>
        /\b[2-7][MTN][1-7]{1,2}\b/.test(node.textContent || '')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
    }
  );

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    processNode(node);
  }
};

export default defineContentScript({
  main(ctx) {
    const turmasPortal = document.querySelector('#turmas-portal');
    if (turmasPortal) {
      walkTree(turmasPortal);
    }

    const allTables = Array.from(document.querySelectorAll("thead tr"));
    const itinerary = allTables.filter((col) =>
      col.textContent?.includes("Horário")
    );
    for (const $el of itinerary) {
      ($el as HTMLTableRowElement).style.width = "18%";
    }
  },
  runAt: 'document_end',
  matches: ['https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf']
});