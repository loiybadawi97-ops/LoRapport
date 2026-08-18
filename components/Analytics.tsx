import React, { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import { ViewState } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Stats {
  archetype: {
    name: string;
    desc: string;
    icon: string;
    color: string;
  } | null;
}

export function Analytics({ setView }: { setView: (view: ViewState) => void }) {
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ archetype: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!auth.currentUser) return;
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setIsPro(userSnap.data().isPro || false);
        }

        const q = query(
          collection(db, 'users', auth.currentUser.uid, 'sessions'),
          orderBy('createdAt', 'asc'),
          limit(30)
        );
        const querySnapshot = await getDocs(q);
        const data: any[] = [];
        
        let totalC = 0, totalH = 0, totalE = 0;
        let count = 0;

        querySnapshot.forEach((docSnap) => {
          const docData = docSnap.data();
          if (docData.createdAt) {
            const date = new Date(docData.createdAt.toDate());
            
            const conf = docData.confidence || 0;
            const hum = docData.humor || 0;
            const eng = docData.engagement || 0;
            
            totalC += conf;
            totalH += hum;
            totalE += eng;
            count++;

            data.push({
              name: `${date.getMonth() + 1}/${date.getDate()}`,
              Score: docData.score || 0,
              Confidence: conf,
              Humor: hum,
              Engagement: eng,
            });
          }
        });
        
        if (count > 0) {
          const avgC = totalC / count;
          const avgH = totalH / count;
          const avgE = totalE / count;
          const maxScore = Math.max(avgC, avgH, avgE);
          
          let archetype = { name: "The Apprentice", desc: "Just starting your journey.", icon: "school", color: "text-slate-500" };
          
          if (count > 2) {
            if (maxScore < 50) {
              archetype = { name: "The Observer", desc: "Learning to project more energy.", icon: "visibility", color: "text-blue-500" };
            } else if (maxScore === avgC && avgC > avgH + 10 && avgC > avgE + 10) {
              archetype = { name: "The Commander", desc: "High confidence and authority in speech.", icon: "gavel", color: "text-emerald-600" };
            } else if (maxScore === avgH && avgH > avgC + 5 && avgH > avgE + 5) {
              archetype = { name: "The Entertainer", desc: "Uses humor and charm to disarm people.", icon: "theater_comedy", color: "text-purple-500" };
            } else if (maxScore === avgE && avgE > avgC + 5 && avgE > avgH + 5) {
              archetype = { name: "The Empath", desc: "Highly engaging and focused on the listener.", icon: "favorite", color: "text-rose-500" };
            } else {
              archetype = { name: "The Diplomat", desc: "A balanced, well-rounded conversationalist.", icon: "balance", color: "text-amber-500" };
            }
          }
          setStats({ archetype });
        }

        setSessionData(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!isPro) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-surface flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
        </div>
        <h2 className="font-headline text-2xl font-bold text-primary mb-2">Advanced Analytics</h2>
        <p className="text-secondary font-body mb-8 max-w-xs">Unlock detailed progress tracking, historical charts, and personalized insights with Social Gym PRO.</p>
        <button 
          onClick={() => setView('paywall')}
          className="w-full max-w-xs py-4 bg-primary text-on-primary rounded-2xl font-headline font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
          <Crown className="" />
          Unlock PRO
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-surface custom-scrollbar pb-6">
      <header className="mb-8">
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">Analytics</h2>
        <p className="text-secondary font-body mt-1">Track your communication growth over time.</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : sessionData.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-tertiary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>query_stats</span>
          <h3 className="font-headline text-xl font-bold text-primary mb-2">No Data Yet</h3>
          <p className="text-secondary font-body text-sm mb-6">Complete some practice sessions to see your progress charts here.</p>
          <button 
            onClick={() => setView('scenario_selection')}
            className="px-6 py-3 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm shadow-md hover:bg-primary/90 active:scale-95 transition-all">
            Start Practice
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {stats.archetype && (
            <section className="bg-gradient-to-br from-surface-container-lowest to-surface-container-high border border-outline-variant/20 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <span className={`material-symbols-outlined text-8xl ${stats.archetype.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stats.archetype.icon}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2">Your Communication Archetype</p>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center border border-outline-variant/10 shadow-inner`}>
                  <span className={`material-symbols-outlined text-3xl ${stats.archetype.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stats.archetype.icon}</span>
                </div>
                <div>
                  <h3 className={`font-headline font-extrabold text-2xl ${stats.archetype.color}`}>{stats.archetype.name}</h3>
                  <p className="text-secondary text-sm leading-tight pr-4">{stats.archetype.desc}</p>
                </div>
              </div>
            </section>
          )}

          <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-4 shadow-sm">
            <h3 className="font-headline text-lg font-bold text-primary mb-4 px-2">Overall Score Trend</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006A60" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#006A60" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="Score" stroke="#006A60" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-4 shadow-sm">
            <h3 className="font-headline text-lg font-bold text-primary mb-4 px-2">Detailed Metrics</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Confidence" stroke="#006A60" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Humor" stroke="#FFB4A4" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Engagement" stroke="#4A6360" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
