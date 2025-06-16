import React from 'react';
import { Search, Filter, X } from 'lucide-react';

const SearchAndFilter = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  children,
  placeholder = "Search...",
  className = ""
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 w-full lg:w-auto ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={onSearchChange}
          className="glass-input pl-10 pr-4 py-2 min-w-[250px] bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all duration-200"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange({ target: { value: '' } })}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={onToggleFilters}
        className={`glass-button flex items-center space-x-2 px-4 py-2 ${
          hasActiveFilters ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30' : 'bg-white/10'
        } hover:bg-white/20 transition-all duration-200`}
      >
        <Filter className="h-5 w-5" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-1 text-xs bg-cyan-400/20 text-cyan-300 rounded-full">
            Active
          </span>
        )}
      </button>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="glass-button px-4 py-2 text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 transition-all duration-200"
        >
          Clear All
        </button>
      )}

      {/* Filter Panel (rendered outside but controlled by this component) */}
      {showFilters && children && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
