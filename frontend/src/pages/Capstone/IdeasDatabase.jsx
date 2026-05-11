import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Lightbulb, GraduationCap, Calendar, X, BookOpen,
  FileText, Code, BrainCircuit, FlaskConical,
  Database, Shield, BarChart3, Film, Flower2, Dumbbell,
  UtensilsCrossed, Gamepad2, HeartPulse, ShoppingBag, Wifi, Car,
  Music, Smartphone, HeartHandshake, PawPrint, Camera, Shirt,
  Building, MapPin, Trophy, Palette, Wrench, Monitor,
  Sprout, Moon, Star
} from 'lucide-react';
import projectsRaw from './CSC_499_Projects_All_Semesters.txt?raw';

// ─── Parse the text file into structured data ────────────
const parseProjects = (raw) => {
  const lines = raw.split('\n');
  const projects = [];
  let currentSemester = '';
  let currentTitle = '';
  let currentDesc = '';

  for (const line of lines) {
    const semesterMatch = line.match(/──\s*(FALL|SPRING)\s*(\d{4})\s*──/i);
    if (semesterMatch) {
      currentSemester = `${semesterMatch[2]} ${semesterMatch[1]}`;
      continue;
    }

    const titleMatch = line.match(/^\s*\d+\.\s+(.+?)\s*$/);
    if (titleMatch) {
      // Save previous project if exists
      if (currentTitle && currentDesc) {
        projects.push({ semester: currentSemester, title: currentTitle, description: currentDesc });
      }
      currentTitle = titleMatch[1].trim();
      currentDesc = '';
      continue;
    }

    const descMatch = line.match(/^\s{4}(.+)$/);
    if (descMatch && currentTitle) {
      currentDesc = descMatch[1].trim();
      continue;
    }
  }

  // Push last project
  if (currentTitle && currentDesc) {
    projects.push({ semester: currentSemester, title: currentTitle, description: currentDesc });
  }

  return projects;
};

const IdeasDatabase = () => {
  const [ideas, setIdeas] = useState([]);
  const [ideaSearch, setIdeaSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Map each project title to a relevant icon based on its domain/theme
  const getIdeaIcon = (title) => {
    const t = (title || '').toLowerCase();

    // ── Movies / Film / Cinema ──────────────────────────────
    if (t.includes('movie') || t.includes('film') || t.includes('cinema'))
      return <Film size={16} />;

    // ── Flowers / Plants / Gardening / Greenhouse ───────────
    if (t.includes('flower') || t.includes('blooming') || t.includes('plant') ||
        t.includes('green') || t.includes('greenhouse') || t.includes('garden') ||
        t.includes('greenity') || t.includes('bloom'))
      return <Flower2 size={16} />;

    // ── Gym / Fitness / Workout / Diet ──────────────────────
    if (t.includes('gym') || t.includes('fitness') || t.includes('workout') ||
        t.includes('muscle') || t.includes('diet') || t.includes('fit'))
      return <Dumbbell size={16} />;

    // ── Food / Restaurant / Cooking / Bakery ───────────────
    if (t.includes('food') || t.includes('restaurant') || t.includes('grilled') ||
        t.includes('taste') || t.includes('cook') || t.includes('bite') ||
        t.includes('meal') || t.includes('mama') || t.includes('plate') ||
        t.includes('foodie') || t.includes('mango') || t.includes('frozy') ||
        t.includes('zad') || t.includes('recipe'))
      return <UtensilsCrossed size={16} />;

    // ── Books / Library / Reading / Literature ──────────────
    if (t.includes('book') || t.includes('library') || t.includes('reading') ||
        t.includes('booknest') || t.includes('bookclub') || t.includes('story') ||
        t.includes('marionette'))
      return <BookOpen size={16} />;

    // ── Cars / Vehicles / Transport / Parking ───────────────
    if (t.includes('car') || t.includes('vehicle') || t.includes('truck') ||
        t.includes('carmart') || t.includes('parking') || t.includes('traket') ||
        t.includes('van') || t.includes('ride') || t.includes('carpool') ||
        t.includes('bus') || t.includes('uav') || t.includes('drone') ||
        t.includes('navigation') || t.includes('tareeq') || t.includes('marsa') ||
        t.includes('maritime') || t.includes('vessel') || t.includes('logistics') ||
        t.includes('mart') || !t.includes('super') && t.includes('mart'))
      return <Car size={16} />;

    // ── Games / Gaming / Video Games ───────────────────────
    if (t.includes('game') || t.includes('gaming') || t.includes('npc') ||
        t.includes('horror') || t.includes('pedia') || t.includes('gamepedia') ||
        t.includes('next gen'))
      return <Gamepad2 size={16} />;

    // ── Healthcare / Medical / Clinic / Hospital ───────────
    if (t.includes('health') || t.includes('medical') || t.includes('disease') ||
        t.includes('patient') || t.includes('clinical') || t.includes('hospital') ||
        t.includes('doctor') || t.includes('doctoleb') || t.includes('dentist') ||
        t.includes('cancer') || t.includes('parkinson') || t.includes('vaccine') ||
        t.includes('vax') || t.includes('prescription') || t.includes('prescripto') ||
        t.includes('med') || t.includes('care') || t.includes('cedars') ||
        t.includes('vertu') || t.includes('vero') || t.includes('medlab') ||
        t.includes('skincare') || t.includes('naturio') || t.includes('life') ||
        t.includes('nabd') || t.includes('heart') || t.includes('vital') ||
        t.includes('wellness') || t.includes('aura'))
      return <HeartPulse size={16} />;

    // ── AI / Machine Learning / Chatbot / Intelligence ──────
    if (t.includes('ai') && !t.includes('plantcare') || t.includes('machine learning') ||
        t.includes('deep learning') || t.includes('neural') || t.includes('llm') ||
        t.includes('nlp') || t.includes('chatbot') || t.includes('intelligent') ||
        t.includes('intelligram') || t.includes('plantcare'))
      return <BrainCircuit size={16} />;

    // ── E-commerce / Store / Shop / Marketplace ────────────
    if (t.includes('store') || t.includes('shop') || t.includes('e-com') ||
        t.includes('ecommerce') || t.includes('outlet') || t.includes('commerce') ||
        t.includes('khalil') || t.includes('bazaar') || t.includes('market') ||
        t.includes('mycommerce') || t.includes('tech life') || t.includes('home-made') ||
        t.includes('craft') || t.includes('craftella') || t.includes('sou2na') ||
        t.includes('essentially'))
      return <ShoppingBag size={16} />;

    // ── School / Education / University / Tutoring ─────────
    if (t.includes('school') || (t.includes('education') && !t.includes('physical')) ||
        t.includes('university') || t.includes('tutoring') || t.includes('tutor') ||
        t.includes('tutopia') || t.includes('course') || t.includes('math') ||
        t.includes('learn') || t.includes('teach') || t.includes('classroom') ||
        t.includes('student') || t.includes('academy') || t.includes('campus') ||
        t.includes('ums') || t.includes('curriculum') || t.includes('academic') ||
        t.includes('teaching') || t.includes('mentor') || t.includes('course') ||
        t.includes('pathwise') || t.includes('skills') || t.includes('skillhub') ||
        t.includes('opportu') || t.includes('intern') || t.includes('portfolio') ||
        t.includes('rising minds') || t.includes('career'))
      return <GraduationCap size={16} />;

    // ── Security / Cyber / Penetration Testing ─────────────
    if (t.includes('security') || t.includes('privacy') || t.includes('cyber') ||
        t.includes('encryption') || t.includes('pentest') || t.includes('intrusion') ||
        t.includes('guard') || t.includes('benchmark') || t.includes('anomaly'))
      return <Shield size={16} />;

    // ── IoT / Sensors / Smart Systems ──────────────────────
    if (t.includes('iot') || t.includes('sensor') || t.includes('smart') ||
        t.includes('embedded') || t.includes('meeting room'))
      return <Wifi size={16} />;

    // ── Code / Programming / Software Development ──────────
    if (t.includes('code') || t.includes('programming') || t.includes('software') ||
        t.includes('algorithm') || t.includes('forge') || t.includes('developer') ||
        t.includes('dev') || t.includes('platform') || t.includes('nexus') ||
        t.includes('taskflow') || t.includes('forge') || t.includes('temple'))
      return <Code size={16} />;

    // ── Data / Analytics / Dashboard / Insights ────────────
    if (t.includes('data') || t.includes('analytics') || t.includes('dashboard') ||
        t.includes('visualization') || t.includes('insight') || t.includes('edinsights') ||
        t.includes('benchmark'))
      return <BarChart3 size={16} />;

    // ── Database / Repository ──────────────────────────────
    if (t.includes('database') || t.includes('big data') || t.includes('sql') ||
        t.includes('nosql') || t.includes('repository') || t.includes('archive'))
      return <Database size={16} />;

    // ── Science / Chemistry / Research ─────────────────────
    if (t.includes('chemistry') || t.includes('drug') || t.includes('molecule') ||
        t.includes('research') || t.includes('sci') || t.includes('groundwater') ||
        t.includes('water') || t.includes('electrical') || t.includes('conductivity'))
      return <FlaskConical size={16} />;

    // ── Music / Audio / Voice / Recording ──────────────────
    if (t.includes('music') || t.includes('audio') || t.includes('voice') ||
        t.includes('recording') || t.includes('voicera') || t.includes('podcast'))
      return <Music size={16} />;

    // ── Mobile / Phone App ─────────────────────────────────
    if ((t.includes('mobile') || t.includes('app')) &&
        !t.includes('health') && !t.includes('smart'))
      return <Smartphone size={16} />;

    // ── Charity / Donation / Fundraising / Volunteering ────
    if (t.includes('charity') || t.includes('donation') || t.includes('fundraising') ||
        t.includes('fillia') || t.includes('sakan') || t.includes('share the') ||
        t.includes('sharek') || t.includes('volunteer') || t.includes('rebuild') ||
        t.includes('organ') || t.includes('blood'))
      return <HeartHandshake size={16} />;

    // ── Pets / Animals / Veterinary ────────────────────────
    if (t.includes('pet') || t.includes('paw') || t.includes('dog') ||
        t.includes('cat') || t.includes('veterinary') || t.includes('chick') ||
        t.includes('chickaid') || t.includes('animal'))
      return <PawPrint size={16} />;

    // ── Camera / Vision / Image Processing / Scanning ──────
    if (t.includes('camera') || t.includes('vision') || t.includes('image') ||
        t.includes('scan') || t.includes('detection') || t.includes('gesture') ||
        t.includes('hand') || (t.includes('recognition') && !t.includes('voice')) ||
        t.includes('scansage'))
      return <Camera size={16} />;

    // ── Fashion / Clothing / Jewelry / Crafts ──────────────
    if (t.includes('fashion') || t.includes('clothing') || t.includes('hijab') ||
        t.includes('jewelry') || t.includes('gem') || t.includes('crochet') ||
        t.includes('craftella') || t.includes('beiroutique') || t.includes('zaytuna') ||
        t.includes('anarava'))
      return <Shirt size={16} />;

    // ── Building / Construction / Real Estate / Renovation ─
    if (t.includes('building') || t.includes('construction') || t.includes('housing') ||
        t.includes('renov') || t.includes('architect') || t.includes('arcemi') ||
        t.includes('real estate') || t.includes('property') || t.includes('estate'))
      return <Building size={16} />;

    // ── Travel / Tourism / Navigation / Explore ────────────
    if (t.includes('travel') || t.includes('tourism') || t.includes('explore') ||
        t.includes('lebanon') || t.includes('beirut') || t.includes('beiroutique'))
      return <MapPin size={16} />;

    // ── Sports / Athletics / Karate / Swimming ─────────────
    if (t.includes('sport') || t.includes('karate') || t.includes('swim') ||
        t.includes('stadium') || t.includes('pitch') || t.includes('pitchpal') ||
        t.includes('sportify') || t.includes('trophy'))
      return <Trophy size={16} />;

    // ── Design / Art / Creative ────────────────────────────
    if (t.includes('design') || t.includes('artist') || t.includes('gallery') ||
        t.includes('creative') || t.includes('palette') || t.includes('designers'))
      return <Palette size={16} />;

    // ── Maintenance / Repair / Services ────────────────────
    if (t.includes('maintenance') || t.includes('repair') || t.includes('wrench') ||
        t.includes('fix') || t.includes('service') || t.includes('fixperts') ||
        t.includes('fix masters') || t.includes('yallaservice'))
      return <Wrench size={16} />;

    // ── Computer / PC / Hardware / Tech ────────────────────
    if (t.includes('pc') || t.includes('computer') || t.includes('hardware') ||
        t.includes('monitor') || t.includes('tech') || t.includes('techhub'))
      return <Monitor size={16} />;

    // ── Plant / Nature / Sustainability ────────────────────
    if (t.includes('sustainability') || t.includes('green') || t.includes('nature') ||
        t.includes('environment') || t.includes('greenity'))
      return <Sprout size={16} />;

    // ── Islamic / Prayer / Religious ───────────────────────
    if (t.includes('prayer') || t.includes('tahajjad') || t.includes('islam') ||
        t.includes('mosque') || t.includes('hawzat') || t.includes('shajara') ||
        t.includes('sadah') || t.includes('martyr') || t.includes('mahdi') ||
        t.includes('baqiyat') || t.includes('allah') || t.includes('tayeba') ||
        t.includes('scout') || t.includes('scouts'))
      return <Moon size={16} />;

    // ── Social / Community / Networking ────────────────────
    if (t.includes('social') || t.includes('community') || t.includes('network') ||
        t.includes('connect') || t.includes('muconnect') || t.includes('mu connect') ||
        t.includes('uniconnect') || t.includes('along the way') || t.includes('sawa'))
      return <Star size={16} />;

    // ── Point of Sale / Retail / POS ───────────────────────
    if (t.includes('pos') || t.includes('point of sale') || t.includes('retail'))
      return <ShoppingBag size={16} />;

    // ── Default fallback ───────────────────────────────────
    return <FileText size={16} />;
  };

  // Parse on mount
  useEffect(() => {
    try {
      const parsed = parseProjects(projectsRaw);
      setIdeas(parsed);
    } catch (err) {
      console.error('Failed to parse projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get unique semesters
  const semesters = useMemo(() => {
    const s = new Set(ideas.map(p => p.semester).filter(Boolean));
    return Array.from(s);
  }, [ideas]);

  // Filter by search + semester
  const filteredIdeas = useMemo(() => {
    let result = ideas;
    if (ideaSearch.trim()) {
      const q = ideaSearch.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    if (selectedSemester) {
      result = result.filter(p => p.semester === selectedSemester);
    }
    return result;
  }, [ideas, ideaSearch, selectedSemester]);

  return (
    <div className="cs-panel">
      {/* Panel Header */}
      <div className="cs-panel-header">
        <div className="cs-panel-title-row">
          <div className="cs-panel-icon ideas"><Lightbulb size={22} /></div>
          <div>
            <h2 className="cs-panel-title">Ideas Database</h2>
            <p className="cs-panel-subtitle">{ideas.length} real projects from Faculty of Sciences — CSC 499</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cs-toolbar">
        <div className="cs-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={ideaSearch}
            onChange={(e) => setIdeaSearch(e.target.value)}
          />
          {ideaSearch && (
            <button className="cs-search-clear" onClick={() => setIdeaSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="cs-faculty-filter">
          <BookOpen size={15} />
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="cs-result-count">{filteredIdeas.length} project{filteredIdeas.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Ideas Grid */}
      <div className="cs-ideas-grid">
        {isLoading && (
          <div className="cs-loading">Loading projects...</div>
        )}
        {!isLoading && filteredIdeas.length === 0 && (
          <div className="cs-empty">
            <Lightbulb size={48} />
            <h3>No projects found</h3>
            <p>Try adjusting your search or semester filter.</p>
          </div>
        )}
        {filteredIdeas.map((idea, idx) => (
          <div key={idx} className="cs-idea-card">
            <div className="cs-idea-header">
              <div className="cs-idea-title-row">
                <span className="cs-idea-card-icon">{getIdeaIcon(idea.title)}</span>
                <h4 className="cs-idea-title">{idea.title}</h4>
              </div>
              <div className="cs-idea-meta">
                {idea.semester && (
                  <span className="cs-idea-year">
                    <Calendar size={12} />
                    {idea.semester}
                  </span>
                )}
              </div>
            </div>
            <p className="cs-idea-desc">{idea.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IdeasDatabase;