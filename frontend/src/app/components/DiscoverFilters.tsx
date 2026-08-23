import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { countryOptions, getCityOptionsForCountry, isValidCityForCountry } from "../../lib/countries";

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
  const [error, setError] = useState("");
  const cityOptions = getCityOptionsForCountry(tempFilters.country);
  const quickFilterButtonClass =
    "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors";

  const handleApply = () => {
    if (
      tempFilters.country &&
      tempFilters.region &&
      cityOptions.length > 0 &&
      !isValidCityForCountry(tempFilters.country, tempFilters.region)
    ) {
      setError("Select a city that belongs to the chosen country.");
      return;
    }
    setError("");
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
    setError("");
  };

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 border border-[#d89075]/45 bg-[#090912] rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <SlidersHorizontal className="w-6 h-6 text-[#ffd9aa]" />
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
              className="flex w-full max-w-md max-h-[calc(100svh-2rem)] flex-col overflow-hidden rounded-t-3xl border border-[#d89075]/45 bg-[#080912] text-white sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[#ffe1ae]">Filters</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#ffd9aa]" />
                </button>
              </div>

              {/* Content */}
              <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
                {/* Age Range */}
                <div>
                  <label className="text-sm text-white/70 mb-3 block">
                    Age Range: {tempFilters.ageRange[0]} - {tempFilters.ageRange[1]}
                  </label>
                  {error && <p className="text-sm text-[#ff9caf] mb-3">{error}</p>}
                  <div className="space-y-2">
                    <div>
                      <input
                        type="range"
                        min="18"
                        max="80"
                        value={tempFilters.ageRange[0]}
                        onChange={(e) => {
                          const nextMinAge = Math.min(parseInt(e.target.value), tempFilters.ageRange[1] - 1);
                          setTempFilters({
                            ...tempFilters,
                            ageRange: [
                              nextMinAge,
                              tempFilters.ageRange[1],
                            ],
                          });
                          setError("");
                        }}
                        className="w-full accent-[#ff3f7f]"
                      />
                    </div>
                    <div>
                      <input
                        type="range"
                        min="18"
                        max="80"
                        value={tempFilters.ageRange[1]}
                        onChange={(e) => {
                          const nextMaxAge = Math.max(parseInt(e.target.value), tempFilters.ageRange[0] + 1);
                          setTempFilters({
                            ...tempFilters,
                            ageRange: [
                              tempFilters.ageRange[0],
                              nextMaxAge,
                            ],
                          });
                          setError("");
                        }}
                        className="w-full accent-[#ff3f7f]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-white/45 mt-1">
                    <span>18</span>
                    <span>80</span>
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <label className="text-sm text-white/70 mb-3 block">
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
                    className="w-full accent-[#ff3f7f]"
                  />
                  <div className="flex justify-between text-xs text-white/45 mt-1">
                    <span>1 mi</span>
                    <span>100 mi</span>
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="text-sm text-white/70 mb-2 block">
                    Country
                  </label>
                  <select
                    value={tempFilters.country}
                    onChange={(e) => {
                      setTempFilters({ ...tempFilters, country: e.target.value, region: "" });
                      setError("");
                    }}
                    className="w-full px-4 py-3 border border-white/10 rounded-2xl focus:outline-none focus:border-[#ff4f86] bg-white/95 text-[#171019]"
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
                  <label className="text-sm text-white/70 mb-2 block">
                    City
                  </label>
                  {cityOptions.length > 0 ? (
                    <select
                    value={tempFilters.region}
                    onChange={(e) => {
                      setTempFilters({ ...tempFilters, region: e.target.value });
                      setError("");
                    }}
                    disabled={!tempFilters.country}
                    className="w-full px-4 py-3 border border-white/10 rounded-2xl focus:outline-none focus:border-[#ff4f86] bg-white/95 text-[#171019] disabled:bg-white/30 disabled:text-white/40"
                  >
                    <option value="">{tempFilters.country ? "Any city" : "Select country first"}</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                    </select>
                  ) : (
                    <input
                      value={tempFilters.region}
                      onChange={(e) => {
                        setTempFilters({ ...tempFilters, region: e.target.value });
                        setError("");
                      }}
                      disabled={!tempFilters.country}
                      placeholder={tempFilters.country ? "Any city" : "Select country first"}
                      className="w-full px-4 py-3 border border-white/10 rounded-2xl focus:outline-none focus:border-[#ff4f86] bg-white/95 text-[#171019] disabled:bg-white/30 disabled:text-white/40"
                    />
                  )}
                </div>

                {/* Quick Filters */}
                <div>
                  <label className="text-sm text-white/70 mb-3 block">
                    Quick Filters
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTempFilters({
                          ...tempFilters,
                          ageRange: [18, 25],
                        })
                      }
                      aria-pressed={tempFilters.ageRange[0] === 18 && tempFilters.ageRange[1] === 25}
                      className={`${quickFilterButtonClass} ${
                        tempFilters.ageRange[0] === 18 && tempFilters.ageRange[1] === 25
                          ? "border-[#ff3f7f] bg-[#ff3f7f] text-white"
                          : "border-[#d89075]/45 text-white hover:border-[#ff3f7f] hover:bg-[#ff3f7f]/10"
                      }`}
                    >
                      18-25
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTempFilters({
                          ...tempFilters,
                          ageRange: [26, 35],
                        })
                      }
                      aria-pressed={tempFilters.ageRange[0] === 26 && tempFilters.ageRange[1] === 35}
                      className={`${quickFilterButtonClass} ${
                        tempFilters.ageRange[0] === 26 && tempFilters.ageRange[1] === 35
                          ? "border-[#ff3f7f] bg-[#ff3f7f] text-white"
                          : "border-[#d89075]/45 text-white hover:border-[#ff3f7f] hover:bg-[#ff3f7f]/10"
                      }`}
                    >
                      26-35
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTempFilters({
                          ...tempFilters,
                          ageRange: [36, 50],
                        })
                      }
                      aria-pressed={tempFilters.ageRange[0] === 36 && tempFilters.ageRange[1] === 50}
                      className={`${quickFilterButtonClass} ${
                        tempFilters.ageRange[0] === 36 && tempFilters.ageRange[1] === 50
                          ? "border-[#ff3f7f] bg-[#ff3f7f] text-white"
                          : "border-[#d89075]/45 text-white hover:border-[#ff3f7f] hover:bg-[#ff3f7f]/10"
                      }`}
                    >
                      36-50
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTempFilters({
                          ...tempFilters,
                          distance: 10,
                        })
                      }
                      aria-pressed={tempFilters.distance === 10}
                      className={`${quickFilterButtonClass} ${
                        tempFilters.distance === 10
                          ? "border-[#ff3f7f] bg-[#ff3f7f] text-white"
                          : "border-[#d89075]/45 text-white hover:border-[#ff3f7f] hover:bg-[#ff3f7f]/10"
                      }`}
                    >
                      Nearby (10mi)
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 gap-3 border-t border-white/10 bg-[#080912] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-12 flex-1 rounded-2xl border border-[#d89075]/45 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="min-h-12 flex-1 rounded-2xl bg-gradient-to-r from-[#f01c66] to-[#c9064f] py-3 font-semibold text-white hover:shadow-lg transition-shadow"
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
