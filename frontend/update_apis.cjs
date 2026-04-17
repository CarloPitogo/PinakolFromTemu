const fs = require('fs');

let content = fs.readFileSync('src/app/pages/Dashboard.tsx', 'utf8');

// 1. Add states
const stateSearch = `const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);`;
const stateReplace = `const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [news, setNews] = useState<any[] | null>(null);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const fetchExternalData = async () => {
      try {
        const [newsRes, weatherRes] = await Promise.all([
          fetch(\`https://newsdata.io/api/1/news?apikey=\${import.meta.env.VITE_NEWSDATA_API_KEY}&language=en&category=technology,education\`),
          fetch(\`https://api.openweathermap.org/data/2.5/weather?lat=14.2764&lon=121.1233&appid=\${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric\`)
        ]);
        
        if (newsRes.ok) {
           const nData = await newsRes.json();
           setNews(nData.results || []);
        } else {
           setNews([]);
        }
        if (weatherRes.ok) {
           const wData = await weatherRes.json();
           setWeather(wData);
        }
      } catch (e) {
        console.error('External API error:', e);
        setNews([]);
      }
    };
    fetchExternalData();
  }, []);`;
content = content.replace(stateSearch, stateReplace);

// 2. Replace announcements hardcode
const annSearch = `const announcements = [
    { title: "Project Defense 2026", content: "Capstone defense schedules are now final.", date: "Apr 25", author: "Dean Office" },
    { title: "Tech Fest Night", content: "Celebration night for CCS students at the Gym.", date: "May 5", author: "Student Council" },
    { title: "System Outage", content: "Expected downtime this coming weekend for DB sync.", date: "May 10", author: "IT Admin" }
  ];`;
const annReplace = `const fallbackAnnouncements = [
    { title: "Project Defense 2026", content: "Capstone defense schedules are now final.", date: "Apr 25", author: "Dean Office" },
    { title: "Tech Fest Night", content: "Celebration night for CCS students at the Gym.", date: "May 5", author: "Student Council" },
    { title: "System Outage", content: "Expected downtime this coming weekend for DB sync.", date: "May 10", author: "IT Admin" }
  ];

  const displayNews = useMemo(() => {
    if (news && news.length > 0) {
      return news.slice(0, 3).map(n => ({
        title: n.title,
        content: n.description || "Click to read full coverage on this story directly from the source.",
        date: new Date(n.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        author: n.source_id,
        link: n.link
      }));
    }
    return fallbackAnnouncements;
  }, [news]);`;
content = content.replace(annSearch, annReplace);

// 3. Replace Student Tech Symposium with Weather Widget
const eventSearch = `<Card className="rounded-[2.5rem] border-none shadow-xl bg-gray-900 text-white p-8 overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div>
                             <PartyPopper className="w-8 h-8 text-[#FF7F11] mb-4" />
                             <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Tech Symposium 2026</h3>
                             <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">May 12, 2026 • Grand Hall, Main Campus</p>
                             <div className="flex items-center gap-4">
                                <Button className="bg-[#FF7F11] hover:bg-orange-600 rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95">Secure Your Ticket</Button>
                                <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest">Learn More</Button>
                             </div>
                          </div>
                       </div>
                    </Card>`;
const eventReplace = `<Card className="rounded-[2.5rem] border-none shadow-xl bg-gray-900 text-white p-8 overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sky-500/20 to-transparent pointer-events-none" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div>
                             <p className="text-sky-400 text-[10px] font-black uppercase tracking-widest mb-1">Live Conditions</p>
                             <h3 className="text-3xl font-black uppercase tracking-tight mb-2">Cabuyao City</h3>
                             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
                               {weather ? weather.weather[0].description : 'Fetching local weather...'}
                             </p>
                             <div className="flex items-center gap-4">
                                {weather ? (
                                   <>
                                      <div className="text-5xl font-black">{Math.round(weather.main.temp)}°C</div>
                                      <div className="flex flex-col gap-1 border-l border-white/10 pl-4 ml-2">
                                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Feels like {Math.round(weather.main.feels_like)}°C</span>
                                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Humidity {weather.main.humidity}%</span>
                                      </div>
                                   </>
                                ) : (
                                   <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                                )}
                             </div>
                          </div>
                          {weather && (
                             <img 
                               src={\`https://openweathermap.org/img/wn/\${weather.weather[0].icon}@4x.png\`} 
                               alt="weather icon" 
                               className="w-32 h-32 opacity-90 drop-shadow-2xl hidden md:block mix-blend-screen"
                             />
                          )}
                       </div>
                    </Card>`;
content = content.replace(eventSearch, eventReplace);

// 4. Replace Faculty Mixer with Weather Widget
const facultyEventSearch = `<Card className="rounded-[2.5rem] border-none shadow-xl bg-gray-900 text-white p-8 overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div>
                             <PartyPopper className="w-8 h-8 text-[#FF7F11] mb-4" />
                             <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Faculty Mixer Event</h3>
                             <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">May 12, 2026 • Faculty Lounge</p>
                             <Button className="bg-[#FF7F11] hover:bg-orange-600 rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95">RSVP Now</Button>
                          </div>
                       </div>
                    </Card>`;
content = content.replace(facultyEventSearch, eventReplace);

// 5. Replace Announcements Map logic globally (Student & Faculty)
const mapSearch = `{announcements.map((ann, i) => (
                            <div key={i} className="group cursor-pointer">
                               <p className="text-xs font-black text-gray-900 uppercase group-hover:text-[#FF7F11] transition-colors">{ann.title}</p>
                               <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase">{ann.date} • {ann.author}</p>
                               <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                               {i < announcements.length - 1 && <div className="h-px bg-gray-50 mt-4" />}
                            </div>
                          ))}`;
const mapReplace = `{!news && <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-[#FF7F11]" /></div>}
                          {displayNews.map((ann: any, i) => (
                            <a key={i} href={ann.link || '#'} target={ann.link ? "_blank" : "_self"} rel="noreferrer" className="block group cursor-pointer">
                               <p className="text-xs font-black text-gray-900 uppercase group-hover:text-[#FF7F11] transition-colors line-clamp-2 leading-tight">{ann.title}</p>
                               <p className="text-[10px] text-gray-400 font-bold my-1 uppercase">{ann.date} • {ann.author}</p>
                               <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-1">{ann.content}</p>
                               {i < displayNews.length - 1 && <div className="h-px bg-gray-50 mt-4" />}
                            </a>
                          ))}`;

content = content.split(mapSearch).join(mapReplace);

fs.writeFileSync('src/app/pages/Dashboard.tsx', content);
console.log('Update Complete');
