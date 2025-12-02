import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

// Các loại khoảng thời gian
export const TIME_RANGE_TYPES = {
  DAY: 'day',
  WEEK: 'week', 
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom'
};

// Tính toán quý thủ công
const getQuarter = (date) => {
  const month = date.month() + 1; // dayjs month() trả về 0-11
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
};

// Tính toán start và end của quý
const getQuarterRange = (date, offset = 0) => {
  const targetDate = date.add(offset, 'quarter');
  const quarter = getQuarter(targetDate);
  const year = targetDate.year();
  
  let startMonth;
  switch (quarter) {
    case 1: startMonth = 0; break; // January
    case 2: startMonth = 3; break; // April
    case 3: startMonth = 6; break; // July
    case 4: startMonth = 9; break; // October
    default: startMonth = 0;
  }
  
  const start = dayjs().year(year).month(startMonth).startOf('month');
  const end = start.add(2, 'month').endOf('month');
  
  return { start, end };
};

// Tạo label cho khoảng thời gian
export const generateTimeRangeLabel = (startDate, endDate, type) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  switch (type) {
    case TIME_RANGE_TYPES.DAY:
      return start.format('DD/MM/YYYY');
      
    case TIME_RANGE_TYPES.WEEK:
      const weekNumber = start.week();
      const month = start.format('MM');
      const year = start.format('YYYY');
      return `Tuần ${weekNumber} tháng ${month}/${year}`;
      
    case TIME_RANGE_TYPES.MONTH:
      return start.format('Tháng MM/YYYY');
      
    case TIME_RANGE_TYPES.QUARTER:
      const quarterNumber = getQuarter(start);
      return `Quý ${quarterNumber} năm ${start.format('YYYY')}`;
      
    case TIME_RANGE_TYPES.YEAR:
      return `Năm ${start.format('YYYY')}`;
      
    case TIME_RANGE_TYPES.CUSTOM:
      if (start.isSame(end, 'day')) {
        return start.format('DD/MM/YYYY');
      }
      return `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`;
      
    default:
      return `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`;
  }
};

// Tính toán khoảng thời gian dựa trên type và offset
export const calculateTimeRange = (type, offset = 0, customStart = null, customEnd = null) => {
  const now = dayjs();
  let start, end;
  
  switch (type) {
    case TIME_RANGE_TYPES.DAY:
      start = now.add(offset, 'day').startOf('day');
      end = now.add(offset, 'day').endOf('day');
      break;
      
    case TIME_RANGE_TYPES.WEEK:
      start = now.add(offset, 'week').startOf('week');
      end = now.add(offset, 'week').endOf('week');
      break;
      
    case TIME_RANGE_TYPES.MONTH:
      start = now.add(offset, 'month').startOf('month');
      end = now.add(offset, 'month').endOf('month');
      break;
      
    case TIME_RANGE_TYPES.QUARTER:
      const quarterRange = getQuarterRange(now, offset);
      start = quarterRange.start;
      end = quarterRange.end;
      break;
      
    case TIME_RANGE_TYPES.YEAR:
      start = now.add(offset, 'year').startOf('year');
      end = now.add(offset, 'year').endOf('year');
      break;
      
    case TIME_RANGE_TYPES.CUSTOM:
      if (customStart && customEnd) {
        start = dayjs(customStart).startOf('day');
        end = dayjs(customEnd).endOf('day');
      } else {
        start = now.subtract(30, 'day').startOf('day');
        end = now.endOf('day');
      }
      break;
      
    default:
      start = now.startOf('day');
      end = now.endOf('day');
  }
  
  return {
    startDate: start.toDate(),
    endDate: end.toDate(),
    label: generateTimeRangeLabel(start, end, type)
  };
};

// Tạo các options cho dropdown
export const generateTimeRangeOptions = () => {
  const options = [];
  
  // Tuần hiện tại và các tuần trước
  for (let i = -4; i <= 0; i++) {
    const range = calculateTimeRange(TIME_RANGE_TYPES.WEEK, i);
    options.push({
      key: `week_${i}`,
      label: range.label,
      value: {
        type: TIME_RANGE_TYPES.WEEK,
        offset: i,
        ...range
      }
    });
  }
  
  // Tháng hiện tại và các tháng trước
  for (let i = -6; i <= 0; i++) {
    const range = calculateTimeRange(TIME_RANGE_TYPES.MONTH, i);
    options.push({
      key: `month_${i}`,
      label: range.label,
      value: {
        type: TIME_RANGE_TYPES.MONTH,
        offset: i,
        ...range
      }
    });
  }
  
  // Quý hiện tại và các quý trước
  for (let i = -2; i <= 0; i++) {
    const range = calculateTimeRange(TIME_RANGE_TYPES.QUARTER, i);
    options.push({
      key: `quarter_${i}`,
      label: range.label,
      value: {
        type: TIME_RANGE_TYPES.QUARTER,
        offset: i,
        ...range
      }
    });
  }
  
  // Năm hiện tại và năm trước
  for (let i = -1; i <= 0; i++) {
    const range = calculateTimeRange(TIME_RANGE_TYPES.YEAR, i);
    options.push({
      key: `year_${i}`,
      label: range.label,
      value: {
        type: TIME_RANGE_TYPES.YEAR,
        offset: i,
        ...range
      }
    });
  }
  
  return options;
};

// Kiểm tra xem khoảng thời gian đã được phân tích chưa
export const isTimeRangeAnalyzed = (existingAnalyses, timeRange) => {
  return existingAnalyses.some(analysis => 
    analysis.time_range_type === timeRange.type &&
    dayjs(analysis.start_date).isSame(dayjs(timeRange.startDate), 'day') &&
    dayjs(analysis.end_date).isSame(dayjs(timeRange.endDate), 'day')
  );
};

// Format thời gian xử lý
export const formatProcessingTime = (ms) => {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
}; 