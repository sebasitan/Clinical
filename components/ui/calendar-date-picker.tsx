"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
    startOfDay,
    format,
} from "date-fns";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const multiSelectVariants = cva(
    "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground text-background",
                link: "text-primary underline-offset-4 hover:underline text-background",
                blue: "bg-blue-600 text-white hover:bg-blue-700",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface CalendarDatePickerProps
    extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
    id?: string;
    className?: string;
    date: Date | undefined;
    closeOnSelect?: boolean;
    yearsRange?: number;
    onDateSelect: (date: Date | undefined) => void;
    placeholder?: string;
}

export const CalendarDatePickerContent = ({
    id,
    date,
    onDateSelect,
    yearsRange = 10,
    calendarProps,
    className,
}: {
    id: string;
    date: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
    yearsRange?: number;
    calendarProps?: any;
    className?: string;
}) => {
    const [month, setMonth] = React.useState<Date | undefined>(
        date || new Date()
    );
    const [year, setYear] = React.useState<number | undefined>(
        (date || new Date()).getFullYear()
    );
    const [highlightedPart, setHighlightedPart] = React.useState<string | null>(
        null
    );

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const normalizedDate = startOfDay(selectedDate);
            onDateSelect(normalizedDate);
            setMonth(normalizedDate);
            setYear(normalizedDate.getFullYear());
        } else {
            onDateSelect(undefined);
        }
    };

    const handleMonthChange = (newMonthIndex: number) => {
        const currentYear = year || new Date().getFullYear();
        const newMonth = new Date(currentYear, newMonthIndex, 1);
        setMonth(newMonth);
    };

    const handleYearChange = (newYear: number) => {
        const currentMonth = month ? month.getMonth() : new Date().getMonth();
        const newMonth = new Date(newYear, currentMonth, 1);
        setYear(newYear);
        setMonth(newMonth);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const years = Array.from(
        { length: yearsRange + 1 },
        (_, i) => today.getFullYear() + i
    );

    return (
        <div className={cn("flex flex-col p-3 bg-card", className)}>
            <div className="flex items-center gap-2 mb-4 justify-center">
                <Select
                    onValueChange={(value) => {
                        handleMonthChange(months.indexOf(value));
                    }}
                    value={month ? months[month.getMonth()] : undefined}
                >
                    <SelectTrigger className="w-[150px] focus:ring-0 focus:ring-offset-0 font-bold bg-slate-50 border-slate-200 rounded-xl h-10">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.slice(today.getMonth()).map((m) => (
                            <SelectItem key={m} value={m}>
                                {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(value) => {
                        handleYearChange(Number(value));
                    }}
                    value={year ? year.toString() : undefined}
                >
                    <SelectTrigger className="w-[100px] focus:ring-0 focus:ring-offset-0 font-bold bg-slate-50 border-slate-200 rounded-xl h-10">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y, idx) => (
                            <SelectItem key={idx} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    month={month}
                    onMonthChange={setMonth}
                    fromDate={today}
                    initialFocus
                    className="rounded-xl border-none p-0"
                    {...calendarProps}
                />
            </div>
        </div>
    );
};

export const CalendarDatePicker = React.forwardRef<
    HTMLButtonElement,
    CalendarDatePickerProps
>(
    (
        {
            id = "calendar-date-picker",
            className,
            date,
            closeOnSelect = true,
            yearsRange = 10,
            onDateSelect,
            variant = "outline",
            placeholder = "Pick a date",
            ...props
        },
        ref
    ) => {
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
        const [highlightedPart, setHighlightedPart] = React.useState<string | null>(
            null
        );

        const handleClose = () => setIsPopoverOpen(false);
        const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

        const handleMouseOver = (part: string) => {
            setHighlightedPart(part);
        };

        const handleMouseLeave = () => {
            setHighlightedPart(null);
        };

        return (
            <>
                <style>
                    {`
            .date-part {
              touch-action: none;
            }
          `}
                </style>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id={id}
                            ref={ref}
                            variant={variant}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground",
                                className
                            )}
                            onClick={handleTogglePopover}
                            suppressHydrationWarning
                            {...props}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>
                                {date ? (
                                    <>
                                        <span
                                            id={`day-${id}`}
                                            className={cn(
                                                "date-part",
                                                highlightedPart === "day" && "underline font-bold"
                                            )}
                                            onMouseOver={() => handleMouseOver("day")}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {format(date, "dd")}
                                        </span>
                                        {" "}
                                        <span
                                            id={`month-${id}`}
                                            className={cn(
                                                "date-part",
                                                highlightedPart === "month" && "underline font-bold"
                                            )}
                                            onMouseOver={() => handleMouseOver("month")}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {format(date, "MMM")}
                                        </span>
                                        {", "}
                                        <span
                                            id={`year-${id}`}
                                            className={cn(
                                                "date-part",
                                                highlightedPart === "year" && "underline font-bold"
                                            )}
                                            onMouseOver={() => handleMouseOver("year")}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {format(date, "yyyy")}
                                        </span>
                                    </>
                                ) : (
                                    <span>{placeholder}</span>
                                )}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    {isPopoverOpen && (
                        <PopoverContent
                            className="w-auto p-0"
                            align="start"
                            avoidCollisions={false}
                            onInteractOutside={handleClose}
                            onEscapeKeyDown={handleClose}
                            style={{
                                maxHeight: "var(--radix-popover-content-available-height)",
                                overflowY: "auto",
                            }}
                        >
                            <CalendarDatePickerContent
                                id={id}
                                date={date}
                                onDateSelect={(d) => {
                                    onDateSelect(d);
                                    if (closeOnSelect) setIsPopoverOpen(false);
                                }}
                                yearsRange={yearsRange}
                                className="border rounded-lg shadow-sm"
                            />
                        </PopoverContent>
                    )}
                </Popover>
            </>
        );
    }
);

CalendarDatePicker.displayName = "CalendarDatePicker";
