// components/DatePicker.jsx
import React, { useState, useEffect, useRef } from 'react';

const DatePicker = ({
  label = "Date",
  value = "",
  onChange,
  error = null,
  className = "",
  required = false,
  readOnly = false,
  disabled = false,
  placeholder = "DD/MM/YYYY",
  id = `datepicker-${Math.random().toString(36).substr(2, 9)}`,
  compact = true
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const calendarRef = useRef(null);

  // Format YYYY-MM-DD to MM/DD/YYYY for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Format MM/DD/YYYY to YYYY-MM-DD for storage
  const formatDateForStorage = (displayDate) => {
    if (!displayDate) return "";
    try {
      const cleaned = displayDate.replace(/[^\d/]/g, '');
      const parts = cleaned.split('/').filter(part => part !== '');
      
      if (parts.length === 3) {
        let [month, day, year] = parts;
        month = month.padStart(2, '0');
        day = day.padStart(2, '0');
        
        if (year.length === 2) {
          year = `20${year}`;
        }
        
        return `${year}-${month}-${day}`;
      }
      return displayDate;
    } catch (error) {
      return displayDate;
    }
  };

  // Initialize display value from prop
  useEffect(() => {
    setDisplayValue(formatDateForDisplay(value));
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Handle display input change
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    const sanitized = inputValue.replace(/[^\d/]/g, '');
    
    let formatted = sanitized;
    if (sanitized.length > 2 && sanitized.length <= 4) {
      formatted = `${sanitized.substring(0, 2)}/${sanitized.substring(2)}`;
    } else if (sanitized.length > 4) {
      formatted = `${sanitized.substring(0, 2)}/${sanitized.substring(2, 4)}/${sanitized.substring(4, 8)}`;
    }
    
    setDisplayValue(formatted);
    
    if (formatted.length === 10) {
      const storageValue = formatDateForStorage(formatted);
      if (onChange) {
        onChange(storageValue);
      }
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (day, month, year) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${monthStr}-${dayStr}`;
    
    setDisplayValue(formatDateForDisplay(dateString));
    if (onChange) {
      onChange(dateString);
    }
    setShowCalendar(false);
  };

  // Generate calendar days
  const generateCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    
    // Previous month days
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true
      });
    }
    
    // Next month days
    const totalCells = 42;
    for (let i = days.length; i < totalCells; i++) {
      days.push({
        day: i - daysInMonth - firstDay + 1,
        month: currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Navigate months
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Select today
  const selectToday = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setDisplayValue(formatDateForDisplay(todayStr));
    if (onChange) {
      onChange(todayStr);
    }
    setShowCalendar(false);
  };

  // Clear date - FIXED VERSION
  const clearDate = () => {
    setDisplayValue("");
    if (onChange) {
      onChange(""); // Just pass empty string, not event
    }
    setShowCalendar(false);
  };

  // Check if a date is today
  const isToday = (day, month, year) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Check if a date is selected
  const isSelected = (day, month, year) => {
    if (!value) return false;
    try {
      const [selectedYear, selectedMonth, selectedDay] = value.split('-').map(Number);
      return day === selectedDay && 
             (month + 1) === selectedMonth && 
             year === selectedYear;
    } catch {
      return false;
    }
  };

  const calendarDays = generateCalendar();
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];

  // Main color #6aab9c
  const mainGreenColor = '#6aab9c';
  const lightGreenColor = '#e8f4f1'; // Light version of #6aab9c
  const darkGreenColor = '#4d7e72'; // Darker version for hover/borders

  return (
    <div 
      ref={calendarRef}
      style={{ position: 'relative' }}
    >
      {label && (
        <label 
          htmlFor={id} 
          className={`form-label ${compact ? 'mb-1' : 'fw-bold'} ${required ? 'required' : ''}`}
          style={{ fontSize: compact ? '0.85rem' : '0.9rem', display: 'block' }}
        >
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          id={id}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={displayValue}
          onChange={handleInputChange}
          onClick={() => !readOnly && !disabled && setShowCalendar(!showCalendar)}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          maxLength={10}
          style={{
            backgroundColor: readOnly ? '#f5f5f5' : 'white',
            paddingRight: '2rem',
            padding: compact ? '0.25rem 0.5rem' : '0.3rem 0.5rem',
            fontSize: compact ? '0.8rem' : '0.85rem',
            height: compact ? 'calc(1.5em + 0.5rem)' : 'calc(1.5em + 0.75rem)',
            borderRadius: '0.2rem'
          }}
        />
        
        <button
          type="button"
          onClick={() => !readOnly && !disabled && setShowCalendar(!showCalendar)}
          disabled={readOnly || disabled}
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: mainGreenColor, // Using the green color for icon
            cursor: 'pointer',
            fontSize: compact ? '0.8rem' : '0.9rem',
            padding: 0,
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}
        >
          📅
        </button>
        
        {showCalendar && !readOnly && !disabled && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 9999,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '3px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              padding: compact ? '8px' : '10px',
              width: compact ? '220px' : '250px',
              marginTop: '2px',
              fontSize: compact ? '0.75rem' : '0.8rem'
            }}
          >
            {/* Calendar Header - #6aab9c background */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '6px',
              fontSize: compact ? '0.8rem' : '0.85rem',
              backgroundColor: mainGreenColor, // #6aab9c
              color: 'white',
              padding: '6px 8px',
              borderRadius: '3px'
            }}>
              <button 
                type="button"
                onClick={prevMonth}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: compact ? '0.9rem' : '1rem', 
                  cursor: 'pointer', 
                  color: 'white',
                  padding: '0 4px'
                }}
              >
                ‹
              </button>
              
              <span style={{ fontWeight: '600' }}>
                {monthNames[currentMonth]}, {currentYear}
              </span>
              
              <button 
                type="button"
                onClick={nextMonth}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: compact ? '0.9rem' : '1rem', 
                  cursor: 'pointer', 
                  color: 'white',
                  padding: '0 4px'
                }}
              >
                ›
              </button>
            </div>
            
            {/* Weekdays */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '1px', 
              marginBottom: compact ? '3px' : '5px',
              textAlign: 'center'
            }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div 
                  key={day}
                  style={{ 
                    fontWeight: '600', 
                    color: '#666', 
                    padding: compact ? '2px 0' : '3px 0', 
                    fontSize: compact ? '0.7rem' : '0.75rem' 
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '1px' 
            }}>
              {calendarDays.map((dateObj, index) => {
                const today = isToday(dateObj.day, dateObj.month, dateObj.year);
                const selected = isSelected(dateObj.day, dateObj.month, dateObj.year);
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => dateObj.isCurrentMonth && handleDateSelect(dateObj.day, dateObj.month, dateObj.year)}
                    disabled={!dateObj.isCurrentMonth}
                    style={{
                      width: compact ? '26px' : '28px',
                      height: compact ? '26px' : '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: dateObj.isCurrentMonth ? 'pointer' : 'default',
                      fontSize: compact ? '0.7rem' : '0.75rem',
                      backgroundColor: selected ? mainGreenColor : // #6aab9c for selected
                                     today ? lightGreenColor : // Light #6aab9c for today
                                     'transparent',
                      color: selected ? 'white' : 
                            !dateObj.isCurrentMonth ? '#ccc' : 
                            today ? darkGreenColor : '#333', // Dark green text for today
                      border: today && !selected ? `1px solid ${mainGreenColor}` : 'none',
                      fontWeight: selected || today ? 'bold' : 'normal',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (dateObj.isCurrentMonth && !selected && !today) {
                        e.target.style.backgroundColor = '#f0f7f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (dateObj.isCurrentMonth && !selected && !today) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {dateObj.day}
                  </button>
                );
              })}
            </div>
            
            {/* Clear and Today buttons */}
            <div style={{ 
              marginTop: compact ? '6px' : '8px', 
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <button
                type="button"
                onClick={clearDate} // Fixed function
                style={{
                  padding: compact ? '2px 6px' : '3px 8px',
                  fontSize: compact ? '0.7rem' : '0.75rem',
                  borderRadius: '2px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  color: '#333',
                  cursor: 'pointer',
                  minWidth: '60px'
                }}
              >
                Clear
              </button>
              
              <button
                type="button"
                onClick={selectToday}
                style={{
                  padding: compact ? '2px 6px' : '3px 8px',
                  fontSize: compact ? '0.7rem' : '0.75rem',
                  borderRadius: '2px',
                  backgroundColor: mainGreenColor, // #6aab9c for Today button
                  border: `1px solid ${mainGreenColor}`,
                  color: 'white',
                  cursor: 'pointer',
                  minWidth: '60px',
                  fontWeight: 'bold'
                }}
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>
      
      {error && <div className="invalid-feedback" style={{ fontSize: '0.75rem' }}>{error}</div>}
    </div>
  );
};

export default DatePicker;