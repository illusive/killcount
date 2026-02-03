import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

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
    const [error, setError] = useState<string>('');
    const [skipDailyUpdate, setSkipDailyUpdate] = useState<boolean>(false);

    // Get the current date at 5AM threshold
    const getCurrentDate = (): string => {
        const now = new Date();
        const hour = now.getHours();

        // If it's before 5AM, use yesterday's date
        if (hour < 5) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().split('T')[0];
        }

        return now.toISOString().split('T')[0];
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Fire confetti from multiple positions
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffd700']
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffd700']
            });
        }, 250);
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
            setError('Please enter a valid number');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Calculate kills added since last update
        const killsAdded = newTotal - totalKills;

        // Show error if the new total is not greater than current total (unless skipping daily update)
        if (killsAdded <= 0 && !skipDailyUpdate) {
            setError(`Total kills must be greater than ${totalKills}`);
            setTimeout(() => setError(''), 3000);
            setInputValue('');
            return;
        }

        const currentDate = getCurrentDate();
        let newDailyKills = dailyKills;

        // Only update daily kills if not skipping
        if (!skipDailyUpdate && killsAdded > 0) {
            newDailyKills = dailyKills + killsAdded;
        }

        const newData: KillData = {
            total: newTotal,
            date: currentDate,
            dailyKills: newDailyKills,
            history: history
        };

        localStorage.setItem('killCounter', JSON.stringify(newData));
        setTotalKills(newTotal);
        setDailyKills(newDailyKills);

        // Update record if today's kills beat it (only when not skipping)
        if (!skipDailyUpdate && newDailyKills > record) {
            setRecord(newDailyKills);
            // Trigger confetti celebration!
            triggerConfetti();
        }

        // Clear any errors
        setError('');

        // Trigger animation (only when not skipping)
        if (!skipDailyUpdate) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 600);
        }

        setInputValue('');
        setSkipDailyUpdate(false); // Reset checkbox
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

    const handleResetRecord = () => {
        if (window.confirm('Are you sure you want to reset your record? This cannot be undone.')) {
            setRecord(0);
            const savedData = localStorage.getItem('killCounter');
            if (savedData) {
                const data: KillData = JSON.parse(savedData);
                // Clear history to reset record
                data.history = {};
                localStorage.setItem('killCounter', JSON.stringify(data));
                setHistory({});
            }
        }
    };

    const handleResetEverything = () => {
        if (window.confirm('Are you sure you want to reset EVERYTHING? This will delete all your data and cannot be undone.')) {
            localStorage.removeItem('killCounter');
            setTotalKills(0);
            setDailyKills(0);
            setRecord(0);
            setHistory({});
            setIsInitialSetup(true);
        }
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

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
                            <div className="flex flex-col md:flex-row gap-4">
                                <input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Enter total kills"
                                    className={`flex-1 px-6 py-4 text-xl bg-white/5 border-2 ${error ? 'border-red-500/50 animate-error-shake' : 'border-purple-500/30'} rounded-xl text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all backdrop-blur-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                    min="0"
                                />
                                <button
                                    type="submit"
                                    className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/50 active:translate-y-0 transition-all uppercase tracking-wide"
                                >
                                    Update
                                </button>
                            </div>

                            {/* Checkbox for correction */}
                            <label className="flex items-center justify-center gap-3 text-purple-300 text-sm cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={skipDailyUpdate}
                                        onChange={(e) => setSkipDailyUpdate(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-purple-500/40 rounded bg-white/5 peer-checked:bg-gradient-to-br peer-checked:from-purple-500 peer-checked:to-pink-500 peer-checked:border-transparent transition-all duration-200 flex items-center justify-center">
                                        <svg
                                            className={`w-3 h-3 text-white transition-all duration-200 ${skipDailyUpdate ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="group-hover:text-purple-200 transition-colors">
                  Just update total (don't count toward today)
                </span>
                            </label>
                        </form>

                        {/* Error message */}
                        {error && (
                            <div className="mb-8 -mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-error-shake">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-4 px-6 py-5 bg-white/5 rounded-xl border border-white/10 mb-6">
                            <span className="text-xl text-purple-200 font-medium">Total Kills:</span>
                            <span className="text-3xl font-bold text-purple-400">{totalKills}</span>
                        </div>

                        {/* Reset buttons */}
                        <div className="flex items-center justify-center gap-6 text-xs text-purple-300/50">
                            <button
                                onClick={handleResetRecord}
                                className="hover:text-purple-300 transition-colors underline"
                            >
                                Reset Record
                            </button>
                            <span>•</span>
                            <button
                                onClick={handleResetEverything}
                                className="hover:text-red-400 transition-colors underline"
                            >
                                Reset Everything
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
