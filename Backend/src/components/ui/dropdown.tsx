import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from "@/utils";

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  value?: string;
  placeholder?: string;
  onSelect: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  value,
  placeholder = 'Seleccionar...',
  onSelect,
  className,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(item => item.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (itemValue: string) => {
    onSelect(itemValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-left",
          "border border-gray-300 rounded-md shadow-sm bg-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-colors duration-200",
          disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "hover:border-gray-400"
        )}
      >
        <div className="flex items-center">
          {selectedItem?.icon && (
            <span className="mr-2">{selectedItem.icon}</span>
          )}
          <span className={selectedItem ? "text-gray-900" : "text-gray-500"}>
            {selectedItem?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen ? "rotate-180" : "rotate-0"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {items.map((item) => (
              <button
                key={item.value}
                onClick={() => !item.disabled && handleSelect(item.value)}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-left text-sm",
                  "transition-colors duration-150",
                  item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-900 hover:bg-gray-100",
                  value === item.value && "bg-blue-50 text-blue-700"
                )}
              >
                {item.icon && (
                  <span className="mr-2">{item.icon}</span>
                )}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;