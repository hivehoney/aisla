"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  value = {
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999))
  },
  onChange,
  className
}) {
  const [date, setDate] = React.useState(value)

  // value prop이 변경되면 내부 상태도 업데이트
  // 깊은 비교를 통해 값이 실제로 변경되었을 때만 상태를 업데이트합니다
  React.useEffect(() => {
    if (!datesAreEqual(date, value)) {
      setDate(value)
    }
  }, [value])

  // 두 날짜 객체가 동일한지 비교하는 함수
  const datesAreEqual = (date1, date2) => {
    if (!date1 || !date2) return false
    
    const from1 = date1.from ? new Date(date1.from).getTime() : null
    const to1 = date1.to ? new Date(date1.to).getTime() : null
    const from2 = date2.from ? new Date(date2.from).getTime() : null
    const to2 = date2.to ? new Date(date2.to).getTime() : null
    
    return from1 === from2 && to1 === to2
  }

  // 날짜 변경 시 상위 컴포넌트에 알림
  const handleDateChange = (newDate) => {
    setDate(newDate)
    if (onChange) {
      onChange(newDate)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[320px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "yyyy년 MM월 dd일", { locale: ko })} -{" "}
                  {format(date.to, "yyyy년 MM월 dd일", { locale: ko })}
                </>
              ) : (
                format(date.from, "yyyy년 MM월 dd일", { locale: ko })
              )
            ) : (
              <span>날짜 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
            locale={ko}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 