"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pilih tanggal", className }: DatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const formattedValue = value ? value.toISOString().split("T")[0] : "";

  const handleButtonClick = () => {
    if (inputRef.current) {
      try {
        if (typeof inputRef.current.showPicker === "function") {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
          inputRef.current.click();
        }
      } catch (e) {
        inputRef.current.focus();
        inputRef.current.click();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split("-").map(Number);
      const newDate = new Date(year, month - 1, day);
      onChange(newDate);
    } else {
      onChange(undefined);
    }
  };

  const getDisplayString = () => {
    if (!value) return placeholder;
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const day = value.getDate();
    const month = months[value.getMonth()];
    const year = value.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="date"
        value={formattedValue}
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        className={cn(
          "w-full justify-start text-left font-normal h-10 rounded-xl text-xs bg-background/50 hover:bg-muted border-muted-foreground/15 text-foreground transition-all cursor-pointer",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>{getDisplayString()}</span>
      </Button>
    </div>
  )
}

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()

  return (
    <DatePicker value={date} onChange={setDate} placeholder="Pick a date" className="w-[212px]" />
  )
}
