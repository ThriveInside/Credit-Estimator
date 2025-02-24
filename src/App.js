import React, { useState } from 'react';

const CreditCalculator = () => {
  const [currentEPRD, setCurrentEPRD] = useState('');
  const [mccPerYear, setMccPerYear] = useState('');
  const [racPerYear, setRacPerYear] = useState('');
  const [education, setEducation] = useState([]);
  const [dateError, setDateError] = useState('');

  const TODAY = new Date('2025-02-17');

  const EMC_PROGRAMS = [
    { id: 'ged', name: 'GED/High School Diploma', days: 180, monthsToComplete: 6 },
    { id: 'aa', name: "Associate's Degree", days: 180, monthsToComplete: 18 },
    { id: 'ba', name: "Bachelor's Degree", days: 180, monthsToComplete: 18 },
    { id: 'ma', name: "Master's Degree", days: 180, monthsToComplete: 18 },
    { id: 'omcp', name: 'OMCP', days: 180, monthsToComplete: 12 },
    { id: 'plmp', name: 'PLMP', days: 90, monthsToComplete: 12 }
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTimeSaved = (originalDate, newDate) => {
    const diffTime = Math.abs(originalDate - newDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const remainingDays = diffDays % 365;
    const months = Math.floor(remainingDays / 30);

    let timeString = '';
    if (years > 0) {
      timeString += `${years} year${years !== 1 ? 's' : ''}`;
    }
    if (months > 0) {
      if (timeString) timeString += ' and ';
      timeString += `${months} month${months !== 1 ? 's' : ''}`;
    }
    if (!timeString) timeString = 'Less than 1 month';
    return timeString;
  };

  const handleDateChange = (e) => {
    const inputDate = e.target.value;
    setCurrentEPRD(inputDate);
    if (!inputDate) {
      setDateError('Please enter a date');
      return;
    }
    const selectedDate = new Date(inputDate);
    if (isNaN(selectedDate.getTime())) {
      setDateError('Please enter a valid date');
    } else if (selectedDate < TODAY) {
      setDateError('Date cannot be in the past');
    } else {
      setDateError('');
    }
  };

  const handleNumberInput = (value, setter, max) => {
    if (value === '') {
      setter('');
      return;
    }
    const num = parseInt(value);
    if (isNaN(num)) {
      setter('');
    } else {
      setter(Math.min(Math.max(0, num), max));
    }
  };

  const calculateRelease = () => {
    if (!currentEPRD) return null;
    const eprdDate = new Date(currentEPRD);
    if (isNaN(eprdDate.getTime())) return null;

    const educationDays = education.reduce((acc, edu) => {
      const program = EMC_PROGRAMS.find(p => p.id === edu);
      return acc + (program?.days || 0);
    }, 0);

    let projectedDate = new Date(eprdDate);
    projectedDate.setDate(projectedDate.getDate() - educationDays);

    const yearlyMCCDays = Math.min(Math.max(0, parseInt(mccPerYear) || 0), 12) * 7;
    const yearlyRACDays = Math.min(Math.max(0, parseInt(racPerYear) || 0), 4) * 10;
    const yearlyCredits = [];
    let totalMCCDays = 0;
    let totalRACDays = 0;

    let currentDate = new Date(TODAY);
    let year = currentDate.getFullYear();

    while (currentDate < projectedDate) {
      const remainingDays = (projectedDate - currentDate) / (1000 * 60 * 60 * 24);
      if (remainingDays < 60) break;

      yearlyCredits.push({
        year,
        mccDays: yearlyMCCDays,
        racDays: yearlyRACDays,
        totalDays: yearlyMCCDays + yearlyRACDays
      });

      projectedDate.setDate(projectedDate.getDate() - (yearlyMCCDays + yearlyRACDays));
      totalMCCDays += yearlyMCCDays;
      totalRACDays += yearlyRACDays;

      year++;
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }

    if (projectedDate < TODAY) {
      projectedDate = new Date(TODAY);
    }

    return {
      originalDate: eprdDate,
      newDate: projectedDate,
      timeSaved: calculateTimeSaved(eprdDate, projectedDate),
      breakdown: {
        mccDays: totalMCCDays,
        racDays: totalRACDays,
        educationDays,
        yearlyCredits
      }
    };
  };

  const result = calculateRelease();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-gray-900">Thrive Inside Credit Estimator</h1>
          </div>
          {result && (
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Current Release Date</div>
                  <div className="text-lg font-medium">{formatDate(result.originalDate)}</div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="text-sm text-green-600">New Projected Release</div>
                  <div className="text-lg font-bold text-green-600">{formatDate(result.newDate)}</div>
                </div>
              </div>
              <div className="text-center border-t mt-2 pt-2">
                <div className="text-sm text-gray-600">Time Saved</div>
                <div className="text-lg font-bold text-gray-900">{result.timeSaved}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your Earliest Possible Release Date (EPRD)
              </label>
              <input
                type="date"
                value={currentEPRD}
                onChange={handleDateChange}
                className={`w-full p-2 border rounded ${dateError ? 'border-red-500' : 'border-gray-300'}`}
              />
              {dateError && <div className="text-red-500 text-sm mt-1">{dateError}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Milestone Completion Credits per Year (0-12)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={mccPerYear}
                  onChange={(e) => handleNumberInput(e.target.value, setMccPerYear, 12)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter MCC (0-12)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rehabilitative Achievement Credits per Year (0-4)
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={racPerYear}
                  onChange={(e) => handleNumberInput(e.target.value, setRacPerYear, 4)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter RAC (0-4)"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Educational Merit Credits</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EMC_PROGRAMS.map((program) => {
                const isSelected = education.includes(program.id);
                return (
                  <button
                    key={program.id}
                    onClick={() => setEducation(prev =>
                      isSelected ? prev.filter(id => id !== program.id) : [...prev, program.id]
                    )}
                    className={`p-3 rounded text-left ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'border border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    <div className="font-medium">{program.name}</div>
                    <div className="text-sm text-gray-600">
                      {program.days} days • {program.monthsToComplete} months
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {result && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">Credit Breakdown</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-medium text-blue-600">EMC Credits</div>
                    <div className="text-lg font-bold">{result.breakdown.educationDays}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-medium text-blue-600">MCC Credits</div>
                    <div className="text-lg font-bold">{result.breakdown.mccDays}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-medium text-blue-600">RAC Credits</div>
                    <div className="text-lg font-bold">{result.breakdown.racDays}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-medium text-blue-600">Total Credits</div>
                    <div className="text-lg font-bold">
                      {result.breakdown.educationDays + result.breakdown.mccDays + result.breakdown.racDays}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Credits by Year</div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    {result.breakdown.yearlyCredits.map((credit, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-600">{credit.year}</div>
                        <div className="text-xs">
                          MCC: {credit.mccDays}<br/>
                          RAC: {credit.racDays}<br/>
                          <span className="font-medium">Total: {credit.totalDays}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return <CreditCalculator />;
};

export default App;