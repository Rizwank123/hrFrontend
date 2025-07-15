 
 
import  { useState, useEffect } from "react";
import api from "../lib/axios"; // Use your axios.ts instance

const PublicHolidayComponent = () => {
  interface Holiday {
    name: string;
    description: string;
    type: string[];
    date: {
      iso: string;
    };
  }

  const [holidays, setHolidays] = useState<Holiday[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState("Public");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("en-US", { month: "long" }).toUpperCase()
  );

  const options = ["Public", "Optional", "Restricted"];
  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  useEffect(() => {
    fetchHolidays();
  }, [selectedOption, selectedMonth]);

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/leave/holidays?option=${selectedOption}&month=${selectedMonth}`);
      setHolidays(response.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white shadow-md rounded-lg mb-6">
      <div className="p-4 md:p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Public Holidays</h2>

        {/* Dropdowns */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
          {/* Holiday Type Dropdown */}
          <div className="w-full md:w-auto">
            <label className="block text-gray-700 font-medium mb-2">Holiday Type:</label>
            <select
              className="w-full md:w-48 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              {options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Month Dropdown */}
          <div className="w-full md:w-auto">
            <label className="block text-gray-700 font-medium mb-2">Month:</label>
            <select
              className="w-full md:w-48 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Holiday List */}
        {!loading && !error && holidays && holidays.length > 0 && (
          <div className="space-y-4">
            {holidays.map((holiday, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{holiday.name}</h3>
                <p className="text-gray-600 mb-2">{holiday.description}</p>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                  <p className="text-gray-700"><span className="font-medium">Type:</span> {holiday.type.join(", ")}</p>
                  <p className="text-gray-700"><span className="font-medium">Date:</span> <span className="font-medium text-green-600">{new Date(holiday.date.iso).toDateString()}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Holidays Message */}
        {!loading && !error && holidays && holidays.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No holidays found for {selectedMonth.toLowerCase()} in {selectedOption.toLowerCase()} category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicHolidayComponent;
