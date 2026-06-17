import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  category?: string;
  type?: string;
  disabled?: boolean;
}

interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  showCategories?: boolean;
  filterType?: string;
  filterTypes?: string[];
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
}

export default function Dropdown<T = string>({
  options,
  value,
  onChange,
  showCategories = false,
  filterType,
  filterTypes,
  searchable = false,
  placeholder,
  disabled = false,
  className = "",
  menuClassName = "",
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuUp, setMenuUp] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const filteredOptions = useMemo(() => {
    let result = options;
    if (filterType) {
      result = result.filter((o) => o.type === filterType);
    } else if (filterTypes && filterTypes.length > 0) {
      const s = new Set(filterTypes);
      result = result.filter((o) => o.type && s.has(o.type));
    }
    if (searchQuery && searchable) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) => o.label.toLowerCase().includes(q));
    }
    return result;
  }, [options, filterType, filterTypes, searchQuery, searchable]);

  const hasCat = showCategories && filteredOptions.some((o) => o.category);

  const groups = useMemo(() => {
    if (!hasCat) return [["", filteredOptions] as [string, DropdownOption<T>[]]];
    return Object.entries(
      filteredOptions.reduce<Record<string, DropdownOption<T>[]>>((acc, o) => {
        const cat = o.category ?? "";
        (acc[cat] ??= []).push(o);
        return acc;
      }, {}),
    );
  }, [filteredOptions, hasCat]);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? String(value);

  useEffect(() => {
    setHighlightIdx(-1);
    setSearchQuery("");
  }, [filteredOptions.length, filteredOptions.map((o) => o.value).join(",")]);

  useEffect(() => {
    if (!open) {
      setHighlightIdx(-1);
      setSearchQuery("");
      return;
    }
    const rect = ref.current!.getBoundingClientRect();
    const menuH = menuRef.current?.scrollHeight ?? 220;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    setMenuUp(menuH > spaceBelow && spaceAbove > spaceBelow);
    if (searchable) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      triggerRef.current?.focus();
    }
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback(
    (val: T) => {
      onChange(val);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const toggleCategory = useCallback((cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const scrollToMatch = useCallback(
    (prefix: string) => {
      if (!prefix) return;
      const idx = filteredOptions.findIndex((o) =>
        o.label.toLowerCase().startsWith(prefix.toLowerCase()),
      );
      if (idx < 0) return;
      const cat = filteredOptions[idx].category ?? "";
      setCollapsed((prev) => {
        if (prev.has(cat)) {
          const next = new Set(prev);
          next.delete(cat);
          return next;
        }
        return prev;
      });
      setHighlightIdx(idx);
      const items = menuRef.current?.querySelectorAll<HTMLElement>(".cselect-item");
      if (items?.[idx]) items[idx].scrollIntoView({ block: "nearest" });
    },
    [filteredOptions],
  );

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      e.stopPropagation();
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const items = filteredOptions;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Tab") {
        setOpen(false);
        triggerRef.current?.focus();
        if (e.key === "Tab") e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((prev) => {
          const next = prev < items.length - 1 ? prev + 1 : 0;
          const el = menuRef.current?.querySelectorAll<HTMLElement>(".cselect-item");
          if (el?.[next]) el[next].scrollIntoView({ block: "nearest" });
          return next;
        });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((prev) => {
          const next = prev > 0 ? prev - 1 : items.length - 1;
          const el = menuRef.current?.querySelectorAll<HTMLElement>(".cselect-item");
          if (el?.[next]) el[next].scrollIntoView({ block: "nearest" });
          return next;
        });
        return;
      }
      if (e.key === "Enter" && highlightIdx >= 0) {
        const opt = items[highlightIdx];
        if (!opt.disabled) {
          e.preventDefault();
          handleSelect(opt.value);
        }
        return;
      }
      if (!searchable && e.key.length === 1) {
        typeaheadRef.current += e.key;
        scrollToMatch(typeaheadRef.current);
        clearTimeout(typeaheadTimerRef.current);
        typeaheadTimerRef.current = setTimeout(() => {
          typeaheadRef.current = "";
        }, 500);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(typeaheadTimerRef.current);
    };
  }, [open, filteredOptions, highlightIdx, handleSelect, scrollToMatch, searchable]);

  const renderGroup = ([cat, items]: [string, DropdownOption<T>[]]) => {
    const isCollapsed = collapsed.has(cat);
    const startIdx = filteredOptions.indexOf(items[0]);
    return (
      <li key={cat || "__root"}>
        {hasCat && cat && (
          <button
            className={`cselect-category${isCollapsed ? " collapsed" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCategory(cat);
            }}
          >
            <span className="cselect-cat-arrow">{isCollapsed ? "▶" : "▼"}</span>
            <span className="cselect-cat-label">{cat}</span>
          </button>
        )}
        {(!hasCat || !isCollapsed || !cat) && (
          <ul className="cselect-group-items">
            {items.map((opt, j) => {
              const idx = startIdx + j;
              return (
                <li
                  key={String(opt.value)}
                  className={`cselect-item${opt.value === value ? " selected" : ""}${highlightIdx === idx ? " highlighted" : ""}${opt.disabled ? " disabled" : ""}`}
                  onClick={() => {
                    if (!opt.disabled) handleSelect(opt.value);
                  }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className={`cselect${disabled ? " disabled" : ""} ${className}`}
      ref={ref}
    >
      <button
        ref={triggerRef}
        className="cselect-trigger"
        onClick={() => {
          if (!disabled) setOpen((p) => !p);
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{displayLabel}</span>
        <span className="cselect-arrow">ᛏ</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={menuRef}
            className={`cselect-menu${menuUp ? " menu-up" : ""} ${menuClassName}`}
            role="listbox"
            aria-activedescendant={highlightIdx >= 0 ? `cselect-opt-${highlightIdx}` : undefined}
            initial={{ opacity: 0, y: menuUp ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: menuUp ? 4 : -4 }}
            transition={{ duration: 0.12 }}
            onKeyDown={handleMenuKeyDown}
          >
            {searchable && (
              <li>
                <input
                  ref={searchInputRef}
                  className="cselect-search"
                  type="text"
                  placeholder="filter..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightIdx(-1);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </li>
            )}
            {filteredOptions.length === 0 ? (
              <li className="cselect-item cselect-empty">no matches</li>
            ) : (
              groups.map(renderGroup)
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
