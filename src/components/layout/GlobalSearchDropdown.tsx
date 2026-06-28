import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Inbox, Users, Bot, PhoneCall, ArrowRight, Sparkles } from 'lucide-react';
import { useGlobalSearch, type SearchResultItem } from '@/hooks/useGlobalSearch';

export interface GlobalSearchHandle {
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

interface GlobalSearchDropdownProps {
  query: string;
  onQueryChange: (q: string) => void;
  isOpen: boolean;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const GlobalSearchDropdown = forwardRef<GlobalSearchHandle, GlobalSearchDropdownProps>(
  function GlobalSearchDropdown({ query, onQueryChange, isOpen, onClose, inputRef }, ref) {
    const navigate = useNavigate();
    const { results, totalCount, loading } = useGlobalSearch(query);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Flatten items for keyboard navigation
    const flatItems = results.flatMap((g) => g.items);

    // Reset selection on results change
    useEffect(() => {
      setSelectedIndex(-1);
    }, [query, results]);

    // Click outside to close
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
            inputRef.current && !inputRef.current.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose, inputRef]);

    const handleSelect = useCallback((item: SearchResultItem) => {
      onClose();
      onQueryChange('');
      navigate(item.href, { state: item.leadId ? { openLeadId: item.leadId } : undefined });
    }, [onClose, onQueryChange, navigate]);

    // Expose keyboard handler via ref so parent input can call it
    useImperativeHandle(ref, () => ({
      handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen || flatItems.length === 0) return;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
              handleSelect(flatItems[selectedIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
        }
      },
    }), [isOpen, flatItems, selectedIndex, handleSelect, onClose]);

    function highlightText(text: string, q: string) {
      if (!q.trim()) return text;
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(' + escaped + ')', 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => {
        const isMatch = new RegExp(escaped, 'i').test(part);
        return isMatch ? (
          <mark key={i} className="bg-accent/30 text-accent-foreground rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        );
      });
    }

    const categoryIcons: Record<string, React.ReactNode> = {
      conversations: <Inbox className="w-3.5 h-3.5" />,
      leads: <Users className="w-3.5 h-3.5" />,
      automations: <Bot className="w-3.5 h-3.5" />,
      voice: <PhoneCall className="w-3.5 h-3.5" />,
    };

    const categoryColors: Record<string, string> = {
      conversations: 'border-l-blue-400',
      leads: 'border-l-emerald-400',
      automations: 'border-l-amber-400',
      voice: 'border-l-violet-400',
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] backdrop-blur-sm border border-transparent rounded-[16px] shadow-2xl shadow-black/40 overflow-hidden z-30"
          >
            {/* Loading State */}
            {loading && (
              <div className="flex items-center gap-3 px-5 py-6 text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-sm">Searching...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && query.trim() && totalCount === 0 && (
              <div className="px-5 py-10 text-center text-slate-300">
                <Search className="w-8 h-8 mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-300 mb-1">No results found</p>
                <p className="text-xs text-slate-400">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {/* Results */}
            {!loading && totalCount > 0 && (
              <>
                <div className="px-5 py-2 border-b border-transparent flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-accent" />
                  <span className="text-xs font-medium text-slate-300">
                    {totalCount} result{totalCount !== 1 ? 's' : ''} found
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto py-2" tabIndex={-1}>
                  {results.map((group) => (
                    <div key={group.category}>
                      <div className="px-5 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {categoryIcons[group.category]}
                        {group.label}
                      </div>

                      {group.items.map((item) => {
                        const flatIdx = flatItems.indexOf(item);
                        const isSelected = flatIdx === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(flatIdx)}
                            className={`w-full text-left px-5 py-2.5 flex items-start gap-3 border-l-2 transition-colors duration-150 ${
                              categoryColors[item.category] || 'border-l-transparent'
                            } ${
                              isSelected
                                ? 'bg-white/6 border-l-accent'
                                : 'hover:bg-white/6'
                            } text-white`}
                          >
                            <div className="w-8 h-8 rounded-full shrink-0 grid place-items-center text-[10px] font-bold overflow-hidden">
                              {item.category === 'conversations' ? (
                                <img
                                  src={item.icon || '/placeholder.svg'}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.textContent = item.label.split(' ').map(n => n[0]).join('').slice(0, 2);
                                    }
                                  }}
                                />
                              ) : item.category === 'leads' ? (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 text-emerald-400 grid place-items-center text-[10px] font-bold">
                                  {item.icon}
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 grid place-items-center">
                                  {categoryIcons[item.category]}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate text-white">
                                {highlightText(item.label, query)}
                              </div>
                              <div className="text-xs text-slate-300 truncate mt-0.5">
                                {highlightText(item.subtitle, query)}
                              </div>
                            </div>

                            <ArrowRight className={`w-3.5 h-3.5 mt-1 shrink-0 transition-transform ${
                              isSelected ? 'text-accent translate-x-0.5' : 'text-slate-400'
                            }`} />
                          </button>
                        );
                      })}

                      {results.indexOf(group) < results.length - 1 && (
                        <div className="mx-5 my-1 border-t border-border/20" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-5 py-2 border-t border-border/30 flex items-center gap-4 text-xs text-muted-foreground/50">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-border/40 bg-white/5 text-[10px] font-mono">&uarr;</kbd>
                    <kbd className="px-1.5 py-0.5 rounded border border-border/40 bg-white/5 text-[10px] font-mono">&darr;</kbd>
                    <span className="ml-1">Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-border/40 bg-white/5 text-[10px] font-mono">&crarr;</kbd>
                    <span className="ml-1">Open</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-border/40 bg-white/5 text-[10px] font-mono">Esc</kbd>
                    <span className="ml-1">Close</span>
                  </span>
                </div>
              </>
            )}

            {/* Initial state - no query yet */}
            {!loading && !query.trim() && (
              <div className="px-5 py-8 text-center">
                <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/60 mb-1">Type to start searching</p>
                <p className="text-xs text-muted-foreground/40">
                  Search across conversations, leads, automations, and calls
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
