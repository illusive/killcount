import { useState, useEffect } from 'react';

interface KillData {
    total: number;
    date: string;
    dailyKills: number;
    history: Record<string, number>; // date -> kills on that day
}

function App() {
    const [totalKills, setTotalKills] = useState<number>(0);
    const [dailyKills, setDailyKills] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [record, setRecord] = useState<number>(0);
    const [history, setHistory] = useState<Record<string, number>>({});
    const [isInitialSetup, setIsInitialSetup] = useState<boolean>(false);

    // Get the current date at 3AM threshold
    const getCurrentDate = (): string => {
        const now = new Date();
        const hour = now.getHours();

        // If it's before 3AM, use yesterday's date
        if (hour < 3) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().split('T')[0];
        }

        return now.toISOString().split('T')[0];
    };

    // Load data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('killCounter');
        if (savedData) {
            const data: KillData = JSON.parse(savedData);
            const currentDate = getCurrentDate();

            // Ensure history exists (for backward compatibility)
            const dataHistory = data.history || {};

            // Check if it's a new day
            if (data.date !== currentDate) {
                // Save previous day's kills to history if there were any
                if (data.dailyKills > 0) {
                    dataHistory[data.date] = data.dailyKills;
                }

                // New day - reset daily kills
                const newData: KillData = {
                    total: data.total,
                    date: currentDate,
                    dailyKills: 0,
                    history: dataHistory
                };
                localStorage.setItem('killCounter', JSON.stringify(newData));
                setTotalKills(data.total);
                setDailyKills(0);
                setHistory(dataHistory);

                // Calculate record
                const recordKills = Math.max(...Object.values(dataHistory), 0);
                setRecord(recordKills);
            } else {
                // Same day - load existing data
                setTotalKills(data.total);
                setDailyKills(data.dailyKills);
                setHistory(dataHistory);

                // Calculate record
                const recordKills = Math.max(...Object.values(dataHistory), 0);
                setRecord(recordKills);
            }
            setIsInitialSetup(false);
        } else {
            // New user - show initial setup
            setIsInitialSetup(true);
            setHistory({});
            setRecord(0);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newTotal = parseInt(inputValue);

        if (isNaN(newTotal) || newTotal < 0) {
            return;
        }

        // Calculate kills added since last update
        const killsAdded = newTotal - totalKills;

        // Only update if kills were actually added
        if (killsAdded <= 0) {
            setInputValue('');
            return;
        }

        const newDailyKills = dailyKills + killsAdded;
        const currentDate = getCurrentDate();

        const newData: KillData = {
            total: newTotal,
            date: currentDate,
            dailyKills: newDailyKills,
            history: history
        };

        localStorage.setItem('killCounter', JSON.stringify(newData));
        setTotalKills(newTotal);
        setDailyKills(newDailyKills);

        // Update record if today's kills beat it
        if (newDailyKills > record) {
            setRecord(newDailyKills);
        }

        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);

        setInputValue('');
    };

    const handleInitialSetup = (e: React.FormEvent) => {
        e.preventDefault();

        const initialTotal = parseInt(inputValue);

        if (isNaN(initialTotal) || initialTotal < 0) {
            return;
        }

        const currentDate = getCurrentDate();
        const newData: KillData = {
            total: initialTotal,
            date: currentDate,
            dailyKills: 0,
            history: {}
        };

        localStorage.setItem('killCounter', JSON.stringify(newData));
        setTotalKills(initialTotal);
        setDailyKills(0);
        setIsInitialSetup(false);
        setInputValue('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-5">
            <div className="w-full max-w-lg text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-12 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent tracking-wider uppercase">
                    Kill Counter
                </h1>

                {isInitialSetup ? (
                    /* Initial Setup Screen */
                    <div className="bg-white/5 border-2 border-purple-500/30 rounded-3xl p-8 backdrop-blur-lg shadow-2xl">
                        <div className="mb-6">
                            <div className="text-2xl font-bold text-purple-200 mb-3">Welcome!</div>
                            <div className="text-purple-300/80">Enter your current total kill count to get started</div>
                        </div>

                        <form onSubmit={handleInitialSetup} className="flex flex-col gap-4">
                            <input
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Current total kills"
                                className="px-6 py-4 text-xl bg-white/5 border-2 border-purple-500/30 rounded-xl text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all backdrop-blur-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="0"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/50 active:translate-y-0 transition-all uppercase tracking-wide"
                            >
                                Start Tracking
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Main App Screen */
                    <>
                        <div
                            className={`
                bg-white/5 border-2 border-purple-500/30 rounded-3xl p-8 mb-8 backdrop-blur-lg shadow-2xl
                ${isAnimating ? 'animate-pulse-scale' : ''}
              `}
                        >
                            <div className="text-lg text-purple-200 mb-4 tracking-widest uppercase font-medium">
                                Today's Kills
                            </div>
                            <div
                                className={`
                  text-7xl md:text-8xl font-extrabold bg-gradient-to-r from-pink-400 to-red-500 bg-clip-text text-transparent
                  ${isAnimating ? 'animate-shake' : ''}
                `}
                            >
                                {dailyKills}
                            </div>

                            {/* Mini line graph */}
                            {Object.keys(history).length > 0 && (
                                <div className="mt-6 pt-6 border-t border-purple-500/20">
                                    <div className="flex items-end justify-center gap-1 h-16 mb-2">
                                        {Object.entries(history)
                                            .slice(-7) // Last 7 days
                                            .map(([date, kills]) => {
                                                const maxKills = Math.max(...Object.values(history), dailyKills, 1);
                                                const height = (kills / maxKills) * 100;
                                                return (
                                                    <div
                                                        key={date}
                                                        className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                                        title={`${date}: ${kills} kills`}
                                                    />
                                                );
                                            })}
                                        {/* Current day bar */}
                                        {(() => {
                                            const maxKills = Math.max(...Object.values(history), dailyKills, 1);
                                            const height = dailyKills > 0 ? (dailyKills / maxKills) * 100 : 4;
                                            return (
                                                <div
                                                    className="flex-1 bg-gradient-to-t from-pink-400 to-red-400 rounded-t opacity-75"
                                                    style={{ height: `${height}%`, minHeight: '4px' }}
                                                    title={`Today: ${dailyKills} kills`}
                                                />
                                            );
                                        })()}
                                    </div>
                                    <div className="text-xs text-purple-300/60 text-center">Last 7 days</div>
                                </div>
                            )}

                            {/* Record display */}
                            {record > 0 && (
                                <div className="mt-4 text-sm text-purple-300/80">
                                    Record: <span className="font-bold text-yellow-400">{record}</span> kills
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-8">
                            <input
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Enter total kills"
                                className="flex-1 px-6 py-4 text-xl bg-white/5 border-2 border-purple-500/30 rounded-xl text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all backdrop-blur-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="0"
                            />
                            <button
                                type="submit"
                                className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/50 active:translate-y-0 transition-all uppercase tracking-wide"
                            >
                                Update
                            </button>
                        </form>

                        <div className="flex items-center justify-center gap-4 px-6 py-5 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-xl text-purple-200 font-medium">Total Kills:</span>
                            <span className="text-3xl font-bold text-purple-400">{totalKills}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
