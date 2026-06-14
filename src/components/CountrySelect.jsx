import { useState, useRef, useEffect } from 'react';

const COUNTRIES = [
  'Germany','Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Azerbaijan',
  'Bangladesh','Belarus','Belgium','Bolivia','Bosnia and Herzegovina','Brazil','Bulgaria',
  'Cambodia','Cameroon','Canada','Chile','China','Colombia','Croatia','Czech Republic',
  'Denmark','Ecuador','Egypt','Ethiopia','Finland','France','Georgia','Ghana','Greece',
  'Guatemala','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
  'Japan','Jordan','Kazakhstan','Kenya','South Korea','Kosovo','Kuwait','Kyrgyzstan',
  'Lebanon','Libya','Malaysia','Mexico','Moldova','Mongolia','Montenegro','Morocco',
  'Myanmar','Nepal','Netherlands','New Zealand','Nigeria','North Macedonia','Norway',
  'Pakistan','Palestine','Peru','Philippines','Poland','Portugal','Romania','Russia',
  'Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa',
  'Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
  'Tanzania','Thailand','Tunisia','Turkey','Turkmenistan','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uzbekistan','Venezuela',
  'Vietnam','Yemen','Zimbabwe',
];

/**
 * CountrySelect — searchable country picker
 *
 * Props:
 *   value        string  — current value (country name or '')
 *   onChange     fn(val) — called with new country string or ''
 *   placeholder  string  — input placeholder
 *   allOption    bool    — show "All countries" as first option (for event targeting)
 *   label        string  — field label (rendered outside if provided)
 *   required     bool
 */
export default function CountrySelect({
  value,
  onChange,
  placeholder = 'Search country…',
  allOption = false,
  required = false,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Displayed text in the input box
  const displayValue = open ? query : (value || '');

  const filtered = COUNTRIES.filter(c =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleFocus() {
    setQuery('');
    setOpen(true);
  }

  function select(country) {
    onChange(country);
    setQuery('');
    setOpen(false);
  }

  function clear(e) {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">
          {value ? '🌍' : '🔍'}
        </span>
        <input
          ref={inputRef}
          type="text"
          required={required && !value}
          readOnly={!open}
          value={open ? query : (value || '')}
          onFocus={handleFocus}
          onChange={e => setQuery(e.target.value)}
          placeholder={open ? 'Type to search…' : (value || placeholder)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-8 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 cursor-pointer"
        />
        {/* Clear / chevron */}
        {value ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">
            ▾
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {/* All countries option */}
            {allOption && (
              <button
                type="button"
                onClick={() => select('')}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors border-b border-gray-700 ${
                  value === '' ? 'bg-brand-700/40 text-brand-300' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>🌍</span>
                <span className="font-medium">All countries</span>
                <span className="text-xs text-gray-500 ml-auto">everyone sees this</span>
              </button>
            )}

            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">No countries match "{query}"</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => select(c)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    value === c
                      ? 'bg-brand-700/40 text-brand-300 font-medium'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
