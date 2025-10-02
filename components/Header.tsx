"use client";

export default function Header() {
    return (
        <div className="w-full border-b border-slate-200 bg-white">
            <div className="mx-auto p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                        <button
                            className="text-xl sm:text-2xl font-bold text-slate-800 hover:text-slate-600 transition-colors cursor-pointer"
                            onClick={() => {
                                const clearFn = (
                                    window as Window & { clearDiffLab?: () => void }
                                ).clearDiffLab;
                                if (clearFn) clearFn();
                            }}
                        >
                            DiffLab
                        </button>
                        <a
                            href="https://lcsamyam.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-600 hover:text-slate-800 underline underline-offset-4"
                        >
                            by lcsamyam
                        </a>
                    </div>
                    <div
                        id="diff-controls"
                        className="flex flex-wrap items-center gap-2 sm:gap-4"
                    >
                        {/* Controls will be rendered here by DiffChecker */}
                    </div>
                </div>
            </div>
        </div>
    );
}
