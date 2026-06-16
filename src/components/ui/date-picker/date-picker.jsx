"use client";

import { useState, useRef, useEffect } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import AdminButton from "../button/button";
import styles from "./date-picker.module.css";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "custom", label: "Custom range" },
];

export default function CustomDatePicker({ value, onRangeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(value || "last_week");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Custom manual range dates
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  const containerRef = useRef(null);

  // Close popover when clicking outside the boundary canvas
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePresetClick = (preset) => {
    setActivePreset(preset.value);
    if (preset.value !== "custom") {
      onRangeChange({ preset: preset.value, start: null, end: null });
      setIsOpen(false);
    }
  };

  // Quick helper to generate days for the calendar display grid matrix
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad preceding empty slots
    for (let i = 0; i < startDay; i++) days.push(null);
    // Fill numeric slot counts
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    
    return days;
  };

  const handleDateClick = (date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setStartDate(date);
      } else {
        setEndDate(date);
        onRangeChange({ preset: "custom", start: startDate, end: date });
      }
    }
  };

  const changeMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + direction)));
  };

  const formatButtonLabel = () => {
    const activeObj = PRESETS.find(p => p.value === activePreset);
    if (activePreset === "custom" && startDate) {
      const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endStr = endDate ? endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "...";
      return `${startStr} – ${endStr}`;
    }
    return activeObj ? activeObj.label : "Select date";
  };

  const daysGrid = getDaysInMonth(currentMonth);

  return (
    <div className={styles.pickerContainer} ref={containerRef}>
      <AdminButton 
        icon={FiCalendar} 
        variant="secondary" 
        onClick={() => setIsOpen(!isOpen)}
        isActive={isOpen}
      >
        {formatButtonLabel()}
      </AdminButton>

      {isOpen && (
        <div className={styles.popoverSheet}>
          {/* LEFT SIDE PANEL: Polaris Quick Presets List */}
          <div className={styles.presetsSidebar}>
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`${styles.presetItem} ${activePreset === preset.value ? styles.presetActive : ""}`}
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* RIGHT SIDE PANEL: Dedicated Calendar Matrix Control */}
          <div className={`${styles.calendarWorkspace} ${activePreset !== "custom" ? styles.disabledWorkspace : ""}`}>
            <header className={styles.calendarHeader}>
              <button type="button" onClick={() => changeMonth(-1)} className={styles.navMonthBtn} disabled={activePreset !== "custom"}>
                <FiChevronLeft />
              </button>
              <span className={styles.monthLabel}>
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button type="button" onClick={() => changeMonth(1)} className={styles.navMonthBtn} disabled={activePreset !== "custom"}>
                <FiChevronRight />
              </button>
            </header>

            <div className={styles.weekDaysRow}>
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            <div className={styles.daysGrid}>
              {daysGrid.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className={styles.emptyDayCell} />;
                
                const isSelectedStart = startDate && date.toDateString() === startDate.toDateString();
                const isSelectedEnd = endDate && date.toDateString() === endDate.toDateString();
                const isInRange = startDate && endDate && date > startDate && date < endDate;
                const isHoverRange = startDate && !endDate && hoverDate && date > startDate && date <= hoverDate;

                let dayClass = styles.dayCell;
                if (isSelectedStart) dayClass += ` ${styles.daySelectedStart}`;
                if (isSelectedEnd) dayClass += ` ${styles.daySelectedEnd}`;
                if (isInRange || isHoverRange) dayClass += ` ${styles.dayInRange}`;

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={dayClass}
                    onClick={() => activePreset === "custom" && handleDateClick(date)}
                    onMouseEnter={() => activePreset === "custom" && setHoverDate(date)}
                    disabled={activePreset !== "custom"}
                  >
                    <span>{date.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {activePreset === "custom" && (
              <footer className={styles.calendarFooter}>
                <AdminButton variant="primary" onClick={() => setIsOpen(false)} disabled={!startDate || !endDate}>
                  Apply Range
                </AdminButton>
              </footer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}