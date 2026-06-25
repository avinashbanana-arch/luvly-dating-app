import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { countryOptions } from "../../lib/countries";

interface FilterOptions {
  ageRange: [number, number];
  distance: number;
  region: string;
  country: string;
}

interface DiscoverFiltersProps {
  filters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
}

export function DiscoverFilters({ filters, onApply }: DiscoverFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  const handleApply = () => {
    onApply(tempFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      ageRange: [18, 80],
      distance: 25,
      region: "",
      country: "",
    };
    setTempFilters(defaultFilters);
  };

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <SlidersHorizontal className="w-6 h-6 text-gray-700" />
      </button>

      {/* Filter Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl">Filters</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                {/* Age Range */}
                <div>
                  <label className="text-sm text-gray-600 mb-3 block">
                    Age Range: {tempFilters.ageRange[0]} - {tempFilters.ageRange[1]}
                  </label>
                  <div className="space-y-2">
                    <div>
                      <input
                        type="range"
                        min="18"
                        max="80"
                        value={tempFilters.ageRange[0]}
                        onChange={(e) =>
                          setTempFilters({
                            ...tempFilters,
                            ageRange: [
                              parseInt(e.target.value),
                              tempFilters.ageRange[1],
                            ],
                          })
                        }
                        className="w-full accent-pink-500"
                      />
                    </div>
                    <div>
                      <input
                        type="range"
                        min="18"
                        max="80"
                        value={tempFilters.ageRange[1]}
                        onChange={(e) =>
                          setTempFilters({
                            ...tempFilters,
                            ageRange: [
                              tempFilters.ageRange[0],
                              parseInt(e.target.value),
                            ],
                          })
                        }
                        className="w-full accent-pink-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>18</span>
                    <span>80</span>
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <label className="text-sm text-gray-600 mb-3 block">
                    Maximum Distance: {tempFilters.distance} miles
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={tempFilters.distance}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        distance: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 mi</span>
                    <span>100 mi</span>
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    Country
                  </label>
                  <select
                    value={tempFilters.country}
                    onChange={(e) =>
                      setTempFilters({ ...tempFilters, country: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500 bg-white"
                  >
                    <option value="">Any country</option>
                    {countryOptions.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    City or region
                  </label>
                  <input
                    type="text"
                    value={tempFilters.region}
                    onChange={(e) =>
                      setTempFilters({ ...tempFilters, region: e.target.value })
                    }
                    placeholder="e.g., California, Delhi, London"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* Quick Filters */}
                <div>
                  <label className="text-sm text-gray-600 mb-3 block">
                    Quick Filters
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setTempFilters({
                          ...tempFilters,
                          ageRange: [18, 25],
                        })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-full hover:border-pink-500 hover:bg-pink-50 transition-colors text-sm"
                    >
                      18-25
                    </button>
                    <button
                      onClick={() =>
                        setTempFilters({
                          ...tempFilters,
                          ageRange: [26, 35],
                        })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-full hover:border-pink-500 hover:bg-pink-50 transition-colors text-sm"
                    >
                      26-35
                    </button>
                    <button
                      onClick={() =>
                        setTempFilters({
                          ...tempFilters,
                          ageRange: [36, 50],
                        })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-full hover:border-pink-500 hover:bg-pink-50 transition-colors text-sm"
                    >
                      36-50
                    </button>
                    <button
                      onClick={() =>
                        setTempFilters({
                          ...tempFilters,
                          distance: 10,
                        })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-full hover:border-pink-500 hover:bg-pink-50 transition-colors text-sm"
                    >
                      Nearby (10mi)
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
