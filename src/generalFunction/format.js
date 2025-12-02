export function formatMoney(value) {
    try {
        if (typeof value !== 'number') {
            value = parseFloat(value);
        }
        if (isNaN(value) || value === 0) return '-';

        return value.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
    } catch (error) {
        console.error('Error in formatMoney:', error.message);
        return '-';
    }
}

export const formatCurrency = (num) => {
    try {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || '0';
    }
    catch (e) {
        console.log(e)
    }
};

export const getEmailPrefix = (email) => {
    if (typeof email !== 'string') return '';
    const parts = email.split('@');
    return parts[0] || '';
}


export const formatDateTimestamp = (dateString)=> {
    const date = new Date(dateString);
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // Tháng bắt đầu từ 0
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
}



export const  formatCurrencyString = (value)=> {
    if (typeof value !== 'string') {
        return '-'
    } else {
        return  value;
    }
}

export function parseCurrencyInput(input) {
    let sanitizedInput =  String(input).replace(/,/g, '');
    let number = parseFloat(sanitizedInput);
    if (isNaN(number)) {
        return 0;
    }
    return number;
}

export function generateFormNameFromNow() {
    const date = new Date(); // lấy giờ theo máy tính

    const pad = (num) => String(num).padStart(2, '0');

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `Form ${day}/${month}/${year}  ${hours}:${minutes}`;
}


export function createTimestamp() {
    try {
        const today = new Date();

        // Chuyển đổi giờ hiện tại sang múi giờ Việt Nam (Asia/Ho_Chi_Minh)
        const vietnamTime = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

        // Chuyển thời gian Việt Nam về UTC và trả về định dạng ISO
        const localTimestamp = new Date(vietnamTime.getTime() - vietnamTime.getTimezoneOffset() * 60000).toISOString();

        return localTimestamp; // Trả về timestamp theo giờ Việt Nam (UTC+7) dưới định dạng ISO
    } catch (error) {
        console.error('Error in createTimestamp:', error.message);
        return '-';
    }
}



export function getCurrentDate() {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, '0'); // Lấy ngày, thêm 0 nếu chỉ có một chữ số
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Lấy tháng (tháng bắt đầu từ 0, nên cộng thêm 1)
    const year = today.getFullYear(); // Lấy năm
    return `${day}/${month}/${year}`; // Trả về ngày theo định dạng dd/mm/yyyy
}

export function createDateOnly  () {
    const today = new Date();
    const dateOnly = today.toLocaleDateString('en-GB');
    return dateOnly.split('/').reverse().join('-');
}


export function formatDateISO(dateStr) {
    try {
        const date = new Date(dateStr);  // Tạo đối tượng Date từ chuỗi YYYY-MM-DD
        const day = String(date.getDate()).padStart(2, '0');   // Lấy ngày và thêm 0 ở đầu nếu < 10
        const month = String(date.getMonth() + 1).padStart(2, '0');  // Tháng từ 0 -> 11, cộng thêm 1
        const year = date.getFullYear();   // Lấy năm

        return `${day}/${month}/${year}`;  // Trả về định dạng DD/MM/YYYY
    } catch (error) {
        console.error('Error in formatDateISO:', error.message);
        return '-';
    }
}

export function formatDateFromDateObject(dateObj) {
    try {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');  // Tháng từ 0-11
        const year = dateObj.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error in formatDateFromDateObject:', error.message);
        return '-';
    }
}

export function formatDateMMDDYYYY(dateStr) {
    try {
        const [month, day, year] = dateStr.split('/'); // Tách chuỗi theo dấu "/"
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;  // Đổi vị trí tháng và ngày
    } catch (error) {
        console.error('Error in formatDateMMDDYYYY:', error.message);
        return '-';
    }
}

export function parseDateFromDDMMYYYY(dateStr) {
    try {
        const [day, month, year] = dateStr?.split('/').map(Number);  // Tách chuỗi theo dấu "/"
        return {day, month, year};  // Trả về đối tượng chứa ngày, tháng, năm
    } catch (error) {
        console.error('Error in parseDateFromDDMMYYYY:', error.message);
        return null;  // Trả về null nếu có lỗi trong quá trình tách chuỗi
    }
}

export function getMonthFromISOString(dateStr) {
    const date = new Date(dateStr);
    return date.getMonth() + 1;  // getMonth() trả về tháng từ 0 đến 11, nên cần cộng thêm 1
}

export function formatDateChangeDash(dateStr) {
    try {
        const [day, month, year] = dateStr.split('-');
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    } catch (error) {
        console.error('Error in formatDateChangeDash:', error.message);
        return '-';
    }
}

export function formatDateFromTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');  // Tháng từ 0-11
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error in formatDateFromTimestamp:', error.message);
        return '-';
    }
}


export function formatDateToDDMMYYYY(dateString) {
    if (!dateString || dateString === '-' || !dateString.includes('-')) {
        return '-';
    }
    const [year, month, day] = dateString.split('T')[0].split('-');
    const [hour, minute] = dateString.split('T')[1]?.split(':') || [0, 0];

    return `${hour}:${minute} ${day}/${parseInt(month)}/${year}`;
}


export function formatDateToDDMMYYYY2(dateString) {
    if (!dateString || dateString === '-' || !dateString.includes('-')) {
        return '-';
    }
    const [year, month, day] = dateString.split('T')[0].split('-');

    return `${day}/${parseInt(month)}/${year}`;
}



export default function formatValue(number) {
    if (number) return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    else return 0
}
