// Wallet creation progress component - shows step-by-step progress

interface WalletCreationProgressProps {
  step: 'idle' | 'initializing' | 'generating' | 'connecting' | 'claiming' | 'finalizing' | 'complete';
  message?: string;
  chainId?: string;
  address?: string;
}

export function WalletCreationProgress({ step, message, chainId, address }: WalletCreationProgressProps) {
  const steps = [
    { id: 'initializing', label: 'Initializing Linera Client', icon: '⚙️' },
    { id: 'generating', label: 'Generating Keypair', icon: '🔑' },
    { id: 'connecting', label: 'Connecting to Faucet', icon: '🌐' },
    { id: 'claiming', label: 'Claiming Microchain', icon: '⛓️' },
    { id: 'finalizing', label: 'Finalizing Setup', icon: '✨' },
  ];

  const getStepIndex = () => {
    const order = ['initializing', 'generating', 'connecting', 'claiming', 'finalizing'];
    return order.indexOf(step);
  };

  const currentStepIndex = getStepIndex();

  if (step === 'idle') return null;

  return (
    <div className="bg-black/95 backdrop-blur-xl rounded-xl p-8 max-w-md mx-auto border border-slate-800/50 shadow-2xl">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl ring-2 ring-orange-500/30">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Creating Your Microchain</h2>
        <p className="text-sm text-slate-400">Setting up your Linera wallet...</p>
      </div>

      <div className="space-y-3">
        {steps.map((stepItem, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div
              key={stepItem.id}
              className={`flex items-center gap-4 p-3.5 rounded-lg transition-all border ${
                isActive
                  ? 'bg-orange-500/20 border-orange-500/40 shadow-lg'
                  : isCompleted
                  ? 'bg-emerald-500/20 border-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800/50'
              }`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-slate-500 text-sm">{stepItem.icon}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    isActive ? 'text-orange-300' : isCompleted ? 'text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  {stepItem.label}
                </p>
                {isActive && message && (
                  <p className="text-xs text-slate-400 mt-0.5">{message}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {step === 'generating' && address && (
        <div className="mt-6 p-4 bg-slate-900/60 border border-slate-800/50 rounded-lg">
          <div>
            <p className="text-xs text-slate-400 mb-1">Wallet Address</p>
            <p className="text-xs font-mono text-slate-300 break-all">{address}</p>
          </div>
        </div>
      )}
      
      {step === 'claiming' && chainId && (
        <div className="mt-6 p-4 bg-slate-900/60 border border-orange-500/30 rounded-lg">
          <div>
            <p className="text-xs text-slate-400 mb-1">Microchain ID</p>
            <p className="text-xs font-mono text-slate-300 break-all">{chainId}</p>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Chain claimed successfully
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

