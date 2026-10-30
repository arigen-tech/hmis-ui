export const formatDateForDisplay = (dateString, fallback = "N/A") => {
    if (!dateString) return fallback;
    try {
        if (typeof dateString === 'string') {
            const trimmed = dateString.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                const [year, month, day] = trimmed.split('-');
                return `${day}/${month}/${year}`;
            }
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return fallback;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return fallback;
    }
};

export const formatDateTimeForDisplay = (dateTimeString, fallback = "N/A") => {
    if (!dateTimeString) return fallback;
    try {
        if (typeof dateTimeString === 'string') {
            const trimmed = dateTimeString.trim();
            if (!trimmed.includes(':')) {
                return formatDateForDisplay(trimmed, fallback);
            }
        }
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return fallback;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error("Error formatting date time:", error);
        return fallback;
    }
};

export const formatDateTimeWithSecondsForDisplay = (dateTimeString, fallback = "N/A") => {
    if (!dateTimeString) return fallback;
    try {
        if (typeof dateTimeString === 'string') {
            const trimmed = dateTimeString.trim();
            if (!trimmed.includes(':')) {
                return formatDateForDisplay(trimmed, fallback);
            }
        }
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return fallback;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error("Error formatting date time with seconds:", error);
        return fallback;
    }
};