import { useState, useEffect } from "react";
import { Brain, Star, CheckCircle, RefreshCcw, TrendingUp, AlertTriangle, ShieldCheck, HeartPulse } from "lucide-react";

interface AIRecommendation {
  category: string;
  title: string;
  detail: string;
}

interface AITrend {
  topic: string;
  count: number;
  trendState: "Rising" | "Declining" | "Stagnant";
  advice: string;
}

export default function AISuggestionsTab() {
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [trends, setTrends] = useState<AITrend[]>([]);
  const [isSimulatedInsights, setIsSimulatedInsights] = useState(false);

  async function fetchInsights() {
    setLoadingInsights(true);
    try {
      const resp = await fetch("/api/ai/hospital-insights");
      const d = await resp.json();
      setRecommendations(d.recommendations || []);
      setIsSimulatedInsights(d.isSimulated || false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  }

  async function fetchTrends() {
    setLoadingTrends(true);
    try {
      const resp = await fetch("/api/ai/trend-analysis");
      const d = await resp.json();
      setTrends(d.trends || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrends(false);
    }
  }

  useEffect(() => {
    fetchInsights();
    fetchTrends();
  }, []);

  return (
    <div className="space-y-6" id="ai-suggestions-tab">
      {/* Intro Banner */}
      <div className="bg-radial from-blue-900 to-blue-950 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-full border border-blue-500/30">
            Powered by Google Gemini 3.5 Flash
          </span>
          <h2 className="text-xl font-bold mt-3">Smart Clinical Decision Support Suite</h2>
          <p className="text-xs text-blue-200 mt-2 leading-relaxed">
            Harness real-time clinical analysis, patient diagnostic logs scanning, inventory recommendation alerts, and resource triage optimizations powered securely through Google Gemini full-stack pipelines.
          </p>
        </div>
        <div className="absolute right-6 bottom-4 opacity-10 pointer-events-none">
          <Brain className="w-48 h-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Triage Recommendations column */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="font-bold text-gray-950">Administrative Hospital Insights</h3>
              </div>
              <button
                type="button"
                onClick={fetchInsights}
                disabled={loadingInsights}
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition disabled:opacity-50"
                title="Refresh AI Insights"
              >
                <RefreshCcw className={`w-4 h-4 ${loadingInsights ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>

            {loadingInsights ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500">Querying Gemini AI diagnostics logs...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No insights available. Click refresh above to query.</div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50/70 border border-gray-100 rounded-xl relative hover:border-blue-200 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{item.category}</span>
                      <div className="flex gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                      </div>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-650 leading-relaxed mt-1.5">{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isSimulatedInsights && (
            <div className="bg-amber-50 text-amber-800 text-[11px] p-3 rounded-lg border border-amber-100 mt-4 leading-normal">
              ⚠️ <strong>Demo Notice:</strong> Running on simulated clinical backup intelligence. To enable active Gemini AI connections, ensure your secret API key is declared in <strong>Settings → Secrets</strong>.
            </div>
          )}
        </div>

        {/* Clinical Diagnostics Trends Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-gray-950">Active Clinical Trend Analysis</h3>
              </div>
              <button
                type="button"
                onClick={fetchTrends}
                disabled={loadingTrends}
                className="p-1 text-gray-500 hover:text-teal-600 hover:bg-gray-50 rounded-lg transition"
                title="Refresh Trends"
              >
                <RefreshCcw className={`w-4 h-4 ${loadingTrends ? "animate-spin text-teal-600" : ""}`} />
              </button>
            </div>

            {loadingTrends ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-teal-650 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500">Compiling active diagnostic matrices...</p>
              </div>
            ) : trends.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No clinical statistics parsed at this time.</div>
            ) : (
              <div className="space-y-4">
                {trends.map((t, idx) => (
                  <div key={idx} className="p-4 bg-teal-50/20 border border-teal-100/40 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-900">{t.topic}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.trendState === "Rising" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {t.trendState}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-center">
                        <span className="block text-xl font-bold text-teal-800">{t.count}</span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest">Active Cases</span>
                      </div>
                      <div className="flex-1 bg-white p-2.5 rounded-lg border border-teal-100/50">
                        <p className="text-xs text-gray-700 leading-relaxed"><strong className="text-[10px] text-teal-900 uppercase">Clinical Advice:</strong> {t.advice}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 mt-4 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>AI recommendation advice is configured for medical triage screening only and does not substitute professional on-site clinician supervision.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
