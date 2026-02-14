
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  History, 
  Trash2, 
  Play, 
  StopCircle, 
  BrainCircuit, 
  Info,
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { analyzeScreen } from './services/geminiService';
import { HistoryEntry } from './types';

const App: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('intel_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('intel_history', JSON.stringify(history));
  }, [history]);

  const startStreaming = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
        } as any,
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      
      stream.getVideoTracks()[0].onended = () => {
        stopStreaming();
      };
    } catch (err: any) {
      console.error("Error sharing screen:", err);
      if (err.name === 'NotAllowedError' || err.message.includes('permissions policy')) {
        setError("عذراً، سياسة الأمان تمنع الوصول إلى تصوير الشاشة. تأكد من منح الصلاحيات.");
      } else {
        setError("فشل بدء مشاركة الشاشة.");
      }
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsStreaming(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      const result = await analyzeScreen(base64Image);
      
      if (result.question || result.answer) {
        const newEntry: HistoryEntry = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          screenshot: base64Image,
          question: result.question || "سؤال غير واضح",
          answer: result.answer || "إجابة غير متوفرة",
          selectedOption: result.selectedOption,
          language: 'ar'
        };
        setHistory(prev => [newEntry, ...prev]);
        setActiveTab('history');
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setError("حدث خطأ أثناء التحليل الذكي.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("حذف كل السجل؟")) setHistory([]);
  };

  const deleteEntry = (id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id));
  };

  const filteredHistory = history.filter(entry => 
    entry.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    entry.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-900 shadow-2xl overflow-hidden relative border-x border-slate-800">
      {/* Header */}
      <header className="p-4 bg-slate-800/50 backdrop-blur-md border-b border-slate-700 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">المساعد الذكي</h1>
            <p className="text-[10px] text-blue-400 font-medium uppercase tracking-widest">Screen Solver AI</p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab(activeTab === 'live' ? 'history' : 'live')}
          className="p-2 hover:bg-slate-700 rounded-full transition-colors relative"
        >
          {activeTab === 'live' ? <History className="w-6 h-6 text-slate-300" /> : <Play className="w-6 h-6 text-slate-300" />}
          {activeTab === 'live' && history.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'live' ? (
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex gap-3 items-center">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-[9/16] border-4 border-slate-800 flex flex-col items-center justify-center group shadow-2xl transition-all duration-500 hover:border-blue-500/30">
              {!isStreaming ? (
                <div className="text-center p-8 space-y-6">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                    <div className="relative bg-slate-800 w-full h-full rounded-full flex items-center justify-center border border-slate-700 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Camera className="w-12 h-12 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">جاهز لتحليل الشاشة</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                      افتح التطبيق الذي يحتوي على السؤال، ثم ارجع هنا واضغط على زر البدء.
                    </p>
                  </div>
                </div>
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
              )}
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6 text-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">جاري استخراج الخيارات...</h3>
                  <p className="text-slate-400 text-sm animate-pulse">يتم الآن تحديد الإجابة الصحيحة من الشاشة</p>
                </div>
              )}

              {isStreaming && !isAnalyzing && (
                <div className="absolute top-6 right-6 flex items-center gap-2 bg-blue-600/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-blue-500/30">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-[12px] text-blue-400 font-bold uppercase tracking-widest">مراقبة فعالة</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md py-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="ابحث في سجل الإجابات..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3 pr-12 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-right"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={clearHistory}
                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all active:scale-90"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-24 space-y-4 opacity-40">
                <History className="w-16 h-16 mx-auto" />
                <p className="text-lg font-medium">لا توجد عمليات تحليل سابقة</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredHistory.map((entry) => (
                  <div key={entry.id} className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl group hover:border-blue-500/40 transition-all">
                    <div className="relative h-56 overflow-hidden bg-slate-900">
                      <img src={entry.screenshot} alt="Capture" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                      
                      {entry.selectedOption && (
                        <div className="absolute top-4 left-4 right-4 animate-in zoom-in duration-500">
                           <div className="bg-green-500/20 backdrop-blur-xl border border-green-500/50 px-4 py-3 rounded-2xl flex items-center gap-3">
                             <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                             <div className="flex-1 overflow-hidden">
                               <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">الإجابة التي يجب اختيارها:</p>
                               <p className="text-sm font-bold text-white truncate">{entry.selectedOption}</p>
                             </div>
                           </div>
                        </div>
                      )}

                      <div className="absolute bottom-4 right-4 left-4 flex justify-between items-center">
                        <span className="text-[11px] bg-slate-900/90 px-3 py-1.5 rounded-xl text-slate-300 font-bold border border-slate-700">
                          {new Date(entry.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button 
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2.5 bg-red-500/20 hover:bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-5 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-right">السؤال من الشاشة</h4>
                        </div>
                        <p className="text-[15px] font-bold leading-relaxed text-slate-100 text-right">{entry.question}</p>
                      </div>
                      
                      <div className="h-px bg-slate-700/30"></div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-400">
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-right">الإجابة والتحليل</h4>
                        </div>
                        <div className="text-[14px] leading-relaxed text-slate-300 whitespace-pre-wrap text-right bg-slate-900/30 p-4 rounded-2xl border border-slate-700/30">
                          {entry.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-900/90 backdrop-blur-2xl border-t border-slate-800 p-6 pb-10 flex justify-center gap-4 z-50">
        {!isStreaming ? (
          <button 
            onClick={startStreaming}
            className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all w-full text-lg"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>بدء مراقبة التطبيقات</span>
          </button>
        ) : (
          <div className="flex gap-4 w-full">
            <button 
              onClick={captureAndAnalyze}
              disabled={isAnalyzing}
              className="flex-1 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white font-black py-4 px-6 rounded-2xl shadow-2xl shadow-green-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <BrainCircuit className={`w-6 h-6 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'جاري التحليل...' : 'اختر الإجابة الآن'}</span>
            </button>
            <button 
              onClick={stopStreaming}
              className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-2xl border border-slate-700 transition-all shrink-0 shadow-xl active:scale-90"
              title="إيقاف"
            >
              <StopCircle className="w-8 h-8 text-red-500" />
            </button>
          </div>
        )}
      </footer>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
