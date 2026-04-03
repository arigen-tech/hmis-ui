/**
 * Checks if a result value is within the specified normal range
 * @param {string|number} result - The result value to check
 * @param {string} normalRange - The normal range string (e.g., "70 - 80", "Negative", "0-100", ">5", "<10", "Reactive", "Non-Reactive")
 * @returns {boolean|null} - Returns true if in range, false if out of range, null if cannot determine
 */
export const checkInRange = (result, normalRange) => {
  // If result is empty or normalRange is empty, return null
  if (!result || !normalRange) return null;
  
  // Convert result to string for comparison
  const resultStr = String(result).trim();
  const rangeStr = String(normalRange).trim();
  
  // Check if the normal range is a string value (contains only letters, spaces, hyphens, commas, parentheses, etc.)
  // This pattern matches: letters, spaces, hyphens, commas, parentheses, forward slashes, periods, and underscores
  const isStringRange = /^[a-zA-Z\s\-\(\)\/\.,]+$/.test(rangeStr) && !/[\d><=]/.test(rangeStr);
  
  if (isStringRange) {
    // For string values, check if they match exactly (case insensitive)
    // Split by comma if there are multiple possible values (e.g., "Negative, Non-Reactive")
    const possibleValues = rangeStr.split(',').map(v => v.trim().toLowerCase());
    return possibleValues.includes(resultStr.toLowerCase());
  }
  
  // Handle numeric ranges
  // Remove any whitespace and convert to lowercase for consistent parsing
  const cleanRange = rangeStr.replace(/\s/g, '').toLowerCase();
  
  // Handle ranges with dash (e.g., "70-80", "70 - 80")
  if (cleanRange.includes('-')) {
    const parts = cleanRange.split('-');
    if (parts.length === 2) {
      const min = parseFloat(parts[0]);
      const max = parseFloat(parts[1]);
      const numResult = parseFloat(resultStr);
      
      if (!isNaN(min) && !isNaN(max) && !isNaN(numResult)) {
        return numResult >= min && numResult <= max;
      }
    }
  }
  
  // Handle greater than (e.g., ">5", "> 5")
  if (cleanRange.startsWith('>')) {
    const value = parseFloat(cleanRange.substring(1));
    const numResult = parseFloat(resultStr);
    
    if (!isNaN(value) && !isNaN(numResult)) {
      return numResult > value;
    }
  }
  
  // Handle greater than or equal (e.g., ">=5", ">= 5")
  if (cleanRange.startsWith('>=')) {
    const value = parseFloat(cleanRange.substring(2));
    const numResult = parseFloat(resultStr);
    
    if (!isNaN(value) && !isNaN(numResult)) {
      return numResult >= value;
    }
  }
  
  // Handle less than (e.g., "<10", "< 10")
  if (cleanRange.startsWith('<')) {
    const value = parseFloat(cleanRange.substring(1));
    const numResult = parseFloat(resultStr);
    
    if (!isNaN(value) && !isNaN(numResult)) {
      return numResult < value;
    }
  }
  
  // Handle less than or equal (e.g., "<=10", "<= 10")
  if (cleanRange.startsWith('<=')) {
    const value = parseFloat(cleanRange.substring(2));
    const numResult = parseFloat(resultStr);
    
    if (!isNaN(value) && !isNaN(numResult)) {
      return numResult <= value;
    }
  }
  
  // Handle ranges with "to" (e.g., "70 to 80")
  if (cleanRange.includes('to')) {
    const parts = cleanRange.split('to');
    if (parts.length === 2) {
      const min = parseFloat(parts[0]);
      const max = parseFloat(parts[1]);
      const numResult = parseFloat(resultStr);
      
      if (!isNaN(min) && !isNaN(max) && !isNaN(numResult)) {
        return numResult >= min && numResult <= max;
      }
    }
  }
  
  // Handle single numeric value (e.g., "75")
  const singleNum = parseFloat(cleanRange);
  const numResult = parseFloat(resultStr);
  
  if (!isNaN(singleNum) && !isNaN(numResult)) {
    return numResult === singleNum;
  }
  
  // If we can't determine, return null
  return null;
};

/**
 * Returns the appropriate text style based on whether the result is in range
 * @param {boolean|null} inRange - The result of checkInRange
 * @returns {Object} - Style object for the text
 */
export const getResultTextStyle = (inRange) => {
  if (inRange === true) {
    return { fontWeight: 'bold', color: 'green' };
  } else if (inRange === false) {
    return { fontWeight: 'bold', color: 'red' };
  }
  return {}; // Return empty style for unknown/undefined cases
};