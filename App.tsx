
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  LayoutGrid, RotateCcw, Sparkles, ChevronRight, ChevronLeft, BookOpen, 
  Compass, Target, Activity, Award, Key, Clock, Edit3, Dices, Zap, 
  MessageSquare, User, Sun, Moon, History, AlertCircle, LogOut, Mail, 
  ShieldCheck, Info, Wand2, HelpCircle, Anchor, X, AlertTriangle, 
  Brain, GitBranch, Layers, SearchCode, Loader2, Settings, ListFilter,
  ArrowRightLeft, MoveDiagonal, Heart, Briefcase, Stars, ChevronUp, ChevronDown,
  Eye, Maximize2, Minimize2, Menu, Save, Download, CreditCard,
  Book, GitMerge, RefreshCw, Scale, ZapOff, Trash2, Calendar, HardDrive, Smartphone, Globe, Share2,
  GraduationCap, PenTool, ClipboardList, BarChart3, Binary, MousePointer2, Plus, Monitor,
  Crosshair, Frame, CornerDownRight, CheckCircle2, Lightbulb, ZoomIn, ZoomOut
} from 'lucide-react';
import html2canvas from 'https://esm.sh/html2canvas@1.4.1';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

import { LENORMAND_CARDS, LENORMAND_HOUSES, FUNDAMENTALS_DATA, STUDY_BALLOONS } from './constants';
import { Polarity, Timing, LenormandCard, LenormandHouse, SpreadType, StudyLevel, ReadingTheme, StudyModeState, StudyBalloon, GeometryFilter } from './types';
import { getDetailedCardAnalysis } from './geminiService';
import * as Geometry from './geometryService';
import { CARD_IMAGES, FALLBACK_IMAGE, BASE64_FALLBACK } from './cardImages';

// ===============================
// Componentes de Interface
// ===============================
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; collapsed: boolean; onClick: () => void }> = ({ icon, label, active, collapsed, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'text-slate-900 hover:bg-slate-200 hover:text-indigo-950 font-bold'} ${collapsed ? 'justify-center px-0' : ''}`} title={collapsed ? label : ""}>
    <div className={`flex items-center justify-center shrink-0 w-6 h-6 ${collapsed ? 'scale-110' : ''}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { strokeWidth: 2.5, className: 'w-full h-full' }) : icon}
    </div>
    {!collapsed && <span className="font-medium text-[10px] uppercase font-bold tracking-widest whitespace-nowrap overflow-hidden">{label}</span>}
  </button>
);

const Balloon: React.FC<{ balloon: StudyBalloon; onDismiss: () => void }> = ({ balloon, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-full max-sm:px-4 max-w-sm p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-500 bg-white border-indigo-200 text-slate-900 shadow-indigo-500/20`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0"><Lightbulb size={18}/></div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest mb-1 text-indigo-600">{balloon.title}</h4>
          <p className="text-[13px] leading-relaxed">{balloon.text}</p>
        </div>
        <button onClick={onDismiss} className="ml-auto text-slate-500 hover:text-slate-900 transition-colors"><X size={14}/></button>
      </div>
    </div>
  );
};

const CardVisual: React.FC<{ 
  card: any; 
  houseId: number; 
  onClick: () => void; 
  isSelected: boolean; 
  isThemeCard: boolean; 
  themeColor?: string; 
  highlightType?: string | null; 
  isManualMode?: boolean;
  spreadType?: SpreadType;
  offsetX?: string;
  offsetY?: string;
  studyModeActive?: boolean;
  isAnimating?: boolean;
}> = ({ 
  card, 
  houseId, 
  onClick, 
  isSelected, 
  isThemeCard, 
  themeColor, 
  highlightType, 
  isManualMode,
  spreadType = 'mesa-real',
  offsetX = '0px',
  offsetY = '0px',
  studyModeActive = false,
  isAnimating = false
}) => {
  const highlightStyles: Record<string, string> = {
    mirror: 'ring-4 ring-cyan-500/60 border-cyan-400 scale-105 z-10',
    knight: 'ring-4 ring-fuchsia-500/60 border-fuchsia-400 scale-105 z-10',
    frame: 'border-amber-500/80 ring-2 ring-amber-500/40 animate-pulse',
    axis: 'ring-4 ring-indigo-500/60 border-indigo-400 scale-105 z-10',
    bridge: 'ring-4 ring-amber-400/80 border-amber-400 scale-110 z-30',
    veredito: 'ring-4 ring-emerald-500/60 border-emerald-400 scale-105 z-10',
    'diag-up': 'ring-4 ring-orange-500/60 border-orange-400 scale-105 z-10',
    'diag-down': 'ring-4 ring-indigo-500/60 border-indigo-400 scale-105 z-10',
    'center': 'ring-4 ring-amber-400 border-amber-400 scale-110 z-30',
    theme: 'ring-[6px] ring-white/40 border-white scale-110 z-40'
  };

  const animationClass = isAnimating ? (spreadType === 'mesa-real' ? 'animate-mesa-card' : 'animate-clock-card') : '';
  const animationDelay = `${(houseId % 36) * 0.04}s`;

  return (
    <div 
      onClick={onClick} 
      className={`relative group aspect-[3/4.2] rounded-xl border-2 cursor-pointer transition-all duration-500 overflow-visible shadow-xl ${isSelected ? 'border-indigo-400 ring-4 ring-indigo-400/30 scale-105 z-20' : isThemeCard ? 'border-transparent scale-105 z-20' : highlightType ? `${highlightStyles[highlightType]}` : 'border-slate-300 hover:border-slate-400 bg-slate-50'} ${animationClass} ${studyModeActive && !highlightType ? 'opacity-30 scale-95' : ''}`}
      style={{ 
        ...(isThemeCard ? { boxShadow: `0 0 30px ${themeColor}, inset 0 0 15px ${themeColor}` } : {}),
        animationDelay,
        ['--offset-x' as any]: offsetX,
        ['--offset-y' as any]: offsetY
      }}
    >
      <div className="card-visual-inner">
        {/* FACE FRONTAL */}
        <div className="card-face-front">
          {card && (
            <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
              <img src={CARD_IMAGES[card.id] || FALLBACK_IMAGE} className={`w-full h-full object-cover opacity-40 transition-opacity`} alt="" />
            </div>
          )}
          {!card && isManualMode && <div className="absolute inset-0 flex items-center justify-center"><Plus size={16} className={`opacity-30 text-slate-700`} /></div>}
          <div className="absolute top-1 left-1 z-20">
            <span className={`text-[7px] md:text-[8px] font-black uppercase bg-black/40 px-1 rounded-sm backdrop-blur-sm text-white`}>CASA {houseId}</span>
          </div>
          {card && (
            <div className="absolute inset-0 z-30 flex flex-col p-2 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent rounded-xl">
              <div className="flex-grow flex flex-col items-center justify-center text-center mt-2">
                <span className="text-[7px] md:text-[10px] font-cinzel font-bold text-white uppercase leading-tight tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{card.name}</span>
              </div>
              <div className="mt-auto flex justify-between items-center bg-black/30 -mx-2 -mb-2 px-2 py-0.5 rounded-b-xl">
                <span className="text-[8px] font-black text-white">{card.id}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${card.polarity === Polarity.POSITIVE ? 'bg-emerald-500' : card.polarity === Polarity.NEGATIVE ? 'bg-rose-500' : 'bg-slate-400'}`} />
              </div>
            </div>
          )}
        </div>
        <div className="card-face-back"></div>
      </div>
    </div>
  );
};

const ConceptAccordion: React.FC<{ 
  concept: { title: string; text: string; example?: string; details?: string; practiceTarget?: SpreadType; id?: string }; 
  isOpen: boolean;
  onToggle: () => void;
  onPractice?: () => void;
}> = ({ concept, isOpen, onToggle, onPractice }) => {
  return (
    <div className={`bg-white border-slate-200 shadow-sm border rounded-2xl overflow-hidden transition-all duration-300`}>
      <div 
        onClick={onToggle} 
        className={`p-6 cursor-pointer hover:bg-slate-800/10 flex flex-col`}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className={`text-xs font-bold uppercase tracking-widest text-indigo-800`}>{concept.title}</h4>
          <div className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </div>
        <p className={`text-sm leading-relaxed mb-2 text-slate-700`}>{concept.text}</p>
        {concept.example && <p className="text-xs text-slate-500 italic">Ex: {concept.example}</p>}
      </div>
      
      {isOpen && (
        <div className={`px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in fade-in duration-300`}>
          <div className={`text-[13px] leading-relaxed whitespace-pre-wrap mb-6 text-slate-600`}>
            {concept.details}
          </div>
          {onPractice && concept.practiceTarget && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPractice(); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
            >
              <Eye size={14} /> Ver na Prática
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ===============================
// App Principal
// ===============================
const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mentorPanelOpen, setMentorPanelOpen] = useState(false);
  
  // Forcing light mode for the whole app
  const darkMode = false;

  const [view, setView] = useState<'board' | 'fundamentals' | 'glossary' | 'profile' | 'study'>('board');
  const [spreadType, setSpreadType] = useState<SpreadType>('mesa-real');
  const [isManualMode, setIsManualMode] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<StudyLevel>('Iniciante');
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('Geral');
  
  const [board, setBoard] = useState<(number | null)[]>([]);
  const [firstDrawBoard, setFirstDrawBoard] = useState<(number | null)[] | null>(null);
  const [secondDrawBoard, setSecondDrawBoard] = useState<(number | null)[] | null>(null);
  const [isViewingFirstDraw, setIsViewingFirstDraw] = useState(false);

  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [geometryFilters, setGeometryFilters] = useState<Set<GeometryFilter>>(new Set(['nenhuma']));
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [cardAnalysis, setCardAnalysis] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.4));
  
  const handleResetZoom = useCallback(() => {
    if (boardRef.current && contentRef.current) {
      const container = boardRef.current;
      const content = contentRef.current;
      
      const originalTransform = content.style.transform;
      const originalTransition = content.style.transition;
      content.style.transform = 'none';
      content.style.transition = 'none';
      
      void content.offsetHeight;
      
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;
      
      content.style.transform = originalTransform;
      content.style.transition = originalTransition;

      const padding = 32;
      const scaleW = (containerWidth - padding) / contentWidth;
      const scaleH = (containerHeight - padding) / contentHeight;
      
      let fitScale = Math.min(scaleW, scaleH);
      fitScale = Math.max(0.3, Math.min(fitScale, 1.2));
      
      setZoomLevel(fitScale);
      setZoomMenuOpen(false);
    } else {
      setZoomLevel(1);
      setZoomMenuOpen(false);
    }
  }, [spreadType]);

  const [userName, setUserName] = useState('Estudante Lumina');
  const [isExcludingReadings, setIsExcludingReadings] = useState(false);
  const [savedReadings, setSavedReadings] = useState([
    { id: 1, title: 'Leitura de Janeiro', date: '05/02/2024', type: 'mesa-real' },
    { id: 2, title: 'Leitura de Destino', date: '05/02/2024', type: 'relogio' }
  ]);

  const handleDeleteReading = (id: number) => {
    setSavedReadings(prev => prev.filter(r => r.id !== id));
  };

  const [studyMode, setStudyMode] = useState<StudyModeState>({
    active: false,
    topicId: null,
    practiceTarget: null,
    splitView: false
  });
  const [activeBalloons, setActiveBalloons] = useState<StudyBalloon[]>([]);

  const [openConceptId, setOpenConceptId] = useState<string | null>(null);

  useEffect(() => {
    if (isManualMode) setBoard(new Array(36).fill(null));
    else handleShuffle();
    setSelectedHouse(null);
    setCardAnalysis(null);
    setZoomLevel(1);
  }, [spreadType, isManualMode]);

  const generateShuffledArray = (size: number, excludeIds: number[] = []) => {
    const ids = Array.from({length: 36}, (_, i) => i + 1).filter(id => !excludeIds.includes(id));
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids.slice(0, size);
  };

  const handleShuffle = () => {
    setIsAnimating(true);
    const newBoard = generateShuffledArray(36);
    setBoard(newBoard);
    setFirstDrawBoard(null);
    setSecondDrawBoard(null);
    setIsViewingFirstDraw(false);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const handleSecondDraw = () => {
    if (spreadType !== 'relogio') return;
    setIsAnimating(true);
    const currentDraw = board.slice(0, 13);
    setFirstDrawBoard([...currentDraw]);
    
    const usedIds = currentDraw.filter(id => id !== null) as number[];
    const nextDraw = generateShuffledArray(13, usedIds);
    
    const updatedBoard = [...nextDraw, ...new Array(23).fill(null)];
    setBoard(updatedBoard);
    setSecondDrawBoard(updatedBoard);
    setIsViewingFirstDraw(false);
    setSelectedHouse(null);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const handleClearSpread = () => {
    setBoard(new Array(36).fill(null));
    setFirstDrawBoard(null);
    setSecondDrawBoard(null);
    setIsViewingFirstDraw(false);
  };

  const handleToggleDraws = () => {
    if (!firstDrawBoard || !secondDrawBoard) return;
    setIsAnimating(true);
    if (isViewingFirstDraw) {
      setBoard([...secondDrawBoard]);
      setIsViewingFirstDraw(false);
    } else {
      const restored = [...firstDrawBoard, ...new Array(23).fill(null)];
      setBoard(restored);
      setIsViewingFirstDraw(true);
    }
    setSelectedHouse(null);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const selectedCard = useMemo(() => (selectedHouse !== null && board[selectedHouse]) ? LENORMAND_CARDS.find(c => c.id === board[selectedHouse]) : null, [selectedHouse, board]);
  
  const currentHouse = useMemo(() => {
    if (selectedHouse === null) return null;
    if (spreadType === 'relogio') {
      if (selectedHouse === 12) return { id: 113, name: "Tom da Leitura", theme: "Síntese Anual", technicalDescription: "A energia central que regula todo o ciclo anual de 12 meses." } as LenormandHouse;
      return LENORMAND_HOUSES.find(h => h.id === 101 + selectedHouse);
    }
    return LENORMAND_HOUSES[selectedHouse];
  }, [selectedHouse, spreadType]);

  const toggleFilter = (f: GeometryFilter) => {
    setGeometryFilters(prev => {
      const next = new Set(prev);
      if (f === 'nenhuma') { next.clear(); next.add('nenhuma'); }
      else if (f === 'todas') { next.clear(); next.add('todas'); }
      else { next.delete('nenhuma'); next.delete('todas'); if (next.has(f)) next.delete(f); else next.add(f); if (next.size === 0) next.add('nenhuma'); }
      return next;
    });
  };

  const handleHouseSelection = (index: number) => {
    setSelectedHouse(index);
    setMentorPanelOpen(true); 
    if (isManualMode) setShowCardPicker(true);
    else setCardAnalysis(null);
  };

  const handlePracticeMode = (topicId: string, target: SpreadType) => {
    setStudyMode({ active: true, topicId, practiceTarget: target, splitView: false });
    setSpreadType(target);
    setView('board');
    const isGlobal = topicId.includes('frame') || topicId.includes('moldura') || topicId.includes('veredict') || topicId.includes('veredito') || topicId.includes('clock') || topicId.includes('relogio');
    if (isGlobal) {
      setSelectedHouse(null);
    } else if (selectedHouse === null) {
      const occupiedIdx = board.findIndex(id => id !== null);
      if (occupiedIdx !== -1) setSelectedHouse(occupiedIdx);
    }
    
    const balloons = STUDY_BALLOONS[target];
    const matchingBalloon = balloons.find(b => topicId.includes(b.target));
    if (matchingBalloon) setActiveBalloons([matchingBalloon]);
  };

  const showDicas = () => {
    const balloons = STUDY_BALLOONS[spreadType];
    if (balloons && balloons.length > 0) {
      const randomBalloon = balloons[Math.floor(Math.random() * balloons.length)];
      setActiveBalloons([randomBalloon]);
    }
  };

  const exportToPDF = useCallback(async () => {
    if (!boardRef.current) return;
    try {
      const canvas = await html2canvas(boardRef.current, { backgroundColor: '#f8fafc', scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: spreadType === 'mesa-real' ? 'l' : 'p', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Lumina-Leitura-${new Date().getTime()}.pdf`);
    } catch (err) { console.error("Erro ao exportar PDF:", err); }
  }, [spreadType]);

  const getGeometryHighlight = (idx: number) => {
    if (!geometryFilters.has('nenhuma')) {
      const showAll = geometryFilters.has('todas');
      if ((showAll || geometryFilters.has('moldura')) && Geometry.getMoldura().includes(idx)) return 'frame';
      if ((showAll || geometryFilters.has('veredito')) && idx >= 32) return 'veredito';
      if (selectedHouse !== null) {
        if (showAll || geometryFilters.has('ponte')) {
          const targetId = selectedHouse + 1;
          const targetIdx = board.findIndex(id => id === (targetId));
          if (idx === targetIdx) return 'bridge';
        }
        if (showAll || geometryFilters.has('cavalo')) if (Geometry.getCavalo(selectedHouse).includes(idx)) return 'knight';
        if (showAll || geometryFilters.has('diagonais')) {
          if (Geometry.getDiagonaisSuperiores(selectedHouse).includes(idx)) return 'diag-up';
          if (Geometry.getDiagonaisInferiores(selectedHouse).includes(idx)) return 'diag-down';
        }
      }
    }

    if (studyMode.active && studyMode.topicId) {
      const topicId = studyMode.topicId;
      if ((topicId.includes('frame') || topicId.includes('moldura')) && Geometry.getMoldura().includes(idx)) return 'frame';
      if ((topicId.includes('veredict') || topicId.includes('veredito')) && idx >= 32) return 'veredito';
      if (selectedHouse !== null) {
        if (topicId.includes('ponte')) {
          const targetId = selectedHouse + 1;
          const targetIdx = board.findIndex(id => id === (targetId));
          if (idx === targetIdx) return 'bridge';
        }
        if (topicId.includes('knight') || topicId.includes('cavalo')) if (Geometry.getCavalo(selectedHouse).includes(idx)) return 'knight';
        if (topicId.includes('mirror') || topicId.includes('espelho')) if (Geometry.getEspelhamentos(selectedHouse).includes(idx)) return 'mirror';
        if (topicId.includes('diagonal-superior')) if (Geometry.getDiagonaisSuperiores(selectedHouse).includes(idx)) return 'diag-up';
        if (topicId.includes('diagonal-inferior')) if (Geometry.getDiagonaisInferiores(selectedHouse).includes(idx)) return 'diag-down';
        if (topicId.includes('diagonal') && !topicId.includes('-')) {
             if (Geometry.getDiagonaisSuperiores(selectedHouse).includes(idx)) return 'diag-up';
             if (Geometry.getDiagonaisInferiores(selectedHouse).includes(idx)) return 'diag-down';
        }
      }
      if (spreadType === 'relogio') {
        if (topicId.includes('center') || topicId.includes('centro')) if (idx === 12) return 'center';
        if (topicId.includes('house') || topicId.includes('casa')) return 'axis';
        if (topicId.includes('oposicao') || topicId.includes('opposition')) if (selectedHouse !== null && idx === Geometry.getOposicaoRelogio(selectedHouse)) return 'axis';
      }
    }

    if (spreadType === 'relogio' && !studyMode.active) {
      if (idx === 12) return 'center';
      if (selectedHouse !== null && idx === Geometry.getOposicaoRelogio(selectedHouse)) return 'axis';
    }
    return null;
  };

  const bridgeData = useMemo(() => {
    if (selectedHouse === null || spreadType !== 'mesa-real') return null;
    const targetIdx = board.findIndex(id => id === (selectedHouse + 1));
    return targetIdx !== -1 ? { card: LENORMAND_CARDS.find(c => c.id === board[targetIdx]), house: LENORMAND_HOUSES[targetIdx], houseId: targetIdx + 1 } : null;
  }, [selectedHouse, board, spreadType]);

  const knightData = useMemo(() => {
    if (selectedHouse === null || spreadType !== 'mesa-real') return [];
    return Geometry.getCavalo(selectedHouse).map(idx => ({ card: board[idx] ? LENORMAND_CARDS.find(c => c.id === board[idx]) : null, house: LENORMAND_HOUSES[idx], houseId: idx + 1 })).filter(i => i.card);
  }, [selectedHouse, board, spreadType]);

  const diagonalData = useMemo(() => {
    if (selectedHouse === null || spreadType !== 'mesa-real') return { up: [], down: [] };
    const mapper = (idx: number) => ({ card: board[idx] ? LENORMAND_CARDS.find(c => c.id === board[idx]) : null, houseId: idx + 1 });
    return { up: Geometry.getDiagonaisSuperiores(selectedHouse).map(mapper).filter(i => i.card), down: Geometry.getDiagonaisInferiores(selectedHouse).map(mapper).filter(i => i.card) };
  }, [selectedHouse, board, spreadType]);

  const axisDataRelogio = useMemo(() => {
    if (selectedHouse === null || spreadType !== 'relogio' || selectedHouse === 12) return null;
    const oppositeIdx = Geometry.getOposicaoRelogio(selectedHouse);
    return { axis: Geometry.getAxisDataRelogio(selectedHouse), oppositeCard: board[oppositeIdx] ? LENORMAND_CARDS.find(c => c.id === board[oppositeIdx]) : null, oppositeHouseId: oppositeIdx + 1 };
  }, [selectedHouse, board, spreadType]);

  const firstDrawHistoryData = useMemo(() => {
    if (!firstDrawBoard || spreadType !== 'relogio') return null;
    return firstDrawBoard.slice(0, 13).map((id, idx) => {
      const card = id ? LENORMAND_CARDS.find(c => c.id === id) : null;
      const house = idx === 12 ? { id: 113, name: "Tom da Leitura" } : LENORMAND_HOUSES.find(h => h.id === 101 + idx);
      return { card, house, houseId: idx + 1 };
    }).filter(item => item.card);
  }, [firstDrawBoard, spreadType]);

  const secondDrawHistoryData = useMemo(() => {
    if (!secondDrawBoard || spreadType !== 'relogio') return null;
    return secondDrawBoard.slice(0, 13).map((id, idx) => {
      const card = id ? LENORMAND_CARDS.find(c => c.id === id) : null;
      const house = idx === 12 ? { id: 113, name: "Tom da Leitura" } : LENORMAND_HOUSES.find(h => h.id === 101 + idx);
      return { card, house, houseId: idx + 1 };
    }).filter(item => item.card);
  }, [secondDrawBoard, spreadType]);

  const runMentorAnalysis = useCallback(async () => {
    if (selectedHouse === null || board[selectedHouse] === null) return;
    setIsAiLoading(true); setCardAnalysis(null);
    try {
      const result = await getDetailedCardAnalysis(board, selectedHouse, readingTheme, spreadType, difficultyLevel);
      setCardAnalysis(result);
    } catch (error) { setCardAnalysis("Erro de conexão com o Mentor."); }
    finally { setIsAiLoading(false); }
  }, [board, selectedHouse, readingTheme, spreadType, difficultyLevel]);

  const footerActions = [
    { label: 'Salvar', icon: <Save size={18} strokeWidth={2.5} className="w-full h-full"/>, onClick: undefined },
    { label: 'Exportar', icon: <Download size={18} strokeWidth={2.5} className="w-full h-full"/>, onClick: exportToPDF },
    { label: 'Perfil', icon: <User size={18} strokeWidth={2.5} className="w-full h-full"/>, onClick: () => setView('profile') }
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 transition-colors overflow-hidden font-inter`}>
      <aside className={`fixed md:sticky top-0 inset-y-0 left-0 flex flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-300 z-[60] h-screen ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <img 
               src="https://kehebufapvrmuzaovnzh.supabase.co/storage/v1/object/public/lenormand-cards/LOGO.png" 
               alt="L" 
               className={`object-contain transition-all ${sidebarCollapsed ? 'w-8 h-8 mx-auto' : 'w-5 h-5'} landscape:w-5 landscape:h-5`} 
             />
             {!sidebarCollapsed && (
               <h1 className={`text-xs font-bold font-cinzel text-indigo-950 landscape:text-[10px]`}>LUMINA</h1>
             )}
           </div>
           <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`p-2 rounded-lg text-slate-500 hover:text-slate-900`}>{sidebarCollapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}</button>
        </div>
        
        <nav className="px-2 space-y-2 overflow-y-auto custom-scrollbar shrink-0">
          <NavItem icon={<LayoutGrid size={18}/>} label="Mesa Real" active={view === 'board' && spreadType === 'mesa-real' && !studyMode.active} collapsed={sidebarCollapsed} onClick={() => {setView('board'); setSpreadType('mesa-real'); setIsManualMode(false); setStudyMode(prev => ({ ...prev, active: false }));}} />
          <NavItem icon={<Clock size={18}/>} label="Relógio" active={view === 'board' && spreadType === 'relogio' && !studyMode.active} collapsed={sidebarCollapsed} onClick={() => {setView('board'); setSpreadType('relogio'); setIsManualMode(false); setStudyMode(prev => ({ ...prev, active: false }));}} />
          <NavItem icon={<Book size={18}/>} label="Glossário" active={view === 'glossary'} collapsed={sidebarCollapsed} onClick={() => {setView('glossary'); setStudyMode(prev => ({ ...prev, active: false }));}} />
          <NavItem icon={<BookOpen size={18}/>} label="Fundamentos" active={view === 'fundamentals'} collapsed={sidebarCollapsed} onClick={() => {setView('fundamentals'); setStudyMode(prev => ({ ...prev, active: false }));}} />
          <NavItem icon={<Edit3 size={18}/>} label="Personalizada" active={view === 'board' && isManualMode} collapsed={sidebarCollapsed} onClick={() => {setView('board'); setIsManualMode(true); setStudyMode(prev => ({ ...prev, active: false }));}} />
          <NavItem icon={<GraduationCap size={18}/>} label="📘 Modo Estudo" active={view === 'study' || (view === 'board' && studyMode.active)} collapsed={sidebarCollapsed} onClick={() => {setView('study'); setStudyMode(prev => ({ ...prev, active: true }));}} />
        </nav>
        
        {/* Logo central (Desktop/Expanded) - Exibido entre MODO ESTUDO e os botões de ação */}
        {!sidebarCollapsed && (
          <div className="flex-grow flex flex-col items-center justify-center p-6 select-none pointer-events-none opacity-40 landscape:hidden">
             <img 
               src="https://kehebufapvrmuzaovnzh.supabase.co/storage/v1/object/public/lenormand-cards/LOGO.png" 
               alt="LUMINA" 
               className="w-32 h-32 object-contain"
             />
             <div className={`mt-4 text-[10px] font-cinzel font-black tracking-[0.4em] text-indigo-900`}>LUMINA</div>
          </div>
        )}

        <div className={`p-4 border-t border-slate-200 space-y-2 shrink-0`}>
          {footerActions.map((action, idx) => (
            <div key={idx} className="relative w-full">
              <button onClick={action.onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all text-indigo-950 bg-indigo-100 border border-indigo-300 hover:bg-indigo-600 hover:text-white ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
                <div className={`flex items-center justify-center shrink-0 w-5 h-5`}>
                   {action.icon}
                </div>
                {!sidebarCollapsed && <span className="text-[10px] uppercase tracking-widest">{action.label}</span>}
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-grow flex flex-col h-screen overflow-y-auto custom-scrollbar relative">
        <header className={`h-16 flex items-center justify-between px-10 border-b sticky top-0 z-20 backdrop-blur-md transition-colors bg-white/95 border-slate-200 shadow-sm`}>
          <h2 className={`font-cinzel text-sm font-black tracking-widest uppercase text-slate-900`}>
            {view === 'board' ? (studyMode.active ? 'Estudo Prático' : isManualMode ? 'Mesa Personalizada' : spreadType === 'mesa-real' ? 'Mesa Real' : 'Relógio') : view === 'glossary' ? 'Glossário' : view === 'fundamentals' ? 'Fundamentos' : view === 'profile' ? 'Perfil do Usuário' : view === 'study' ? 'Modo Estudo' : 'Estudo'}
          </h2>
          {view === 'board' && (
            <div className="flex items-center gap-2">
               {studyMode.active && (
                 <div className={`mr-4 px-4 py-1.5 rounded-full border flex items-center gap-3 bg-indigo-50 border-indigo-200 text-indigo-700`}>
                   <Brain size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Destaque: {studyMode.topicId?.split('-').join(' ')}</span>
                   <button onClick={() => setStudyMode(prev => ({ ...prev, active: false, topicId: null }))} className="hover:text-rose-500 transition-colors"><X size={14} /></button>
                 </div>
               )}
               <button onClick={showDicas} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white animate-pulse`}><Lightbulb size={14} /> DICAS</button>
               {!studyMode.active && (
                 <div className={`flex p-1 rounded-xl border bg-white border-slate-200 shadow-sm border shadow-sm`}>
                   {(['nenhuma', 'ponte', 'cavalo', 'moldura', 'veredito', 'diagonais', 'todas'] as any[]).map(f => (
                     <button key={f} onClick={() => toggleFilter(f as GeometryFilter)} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${geometryFilters.has(f as GeometryFilter) ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:text-slate-950'}`}>{f}</button>
                   ))}
                 </div>
               )}
               
               <div className="flex items-center gap-2 ml-4">
                 <button onClick={handleClearSpread} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all bg-slate-200 hover:bg-slate-300 text-slate-700`} title="Limpar todo o tabuleiro"><Trash2 size={14} /> LIMPAR</button>
                 
                 {spreadType === 'relogio' && firstDrawBoard && secondDrawBoard && (
                   <button onClick={handleToggleDraws} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl">
                     {isViewingFirstDraw ? <Stars size={14} /> : <RotateCcw size={14} />} 
                     {isViewingFirstDraw ? 'VOLTAR PARA 2ª TIRAGEM' : 'REVER 1ª TIRAGEM'}
                   </button>
                 )}
                 
                 {spreadType === 'relogio' && !firstDrawBoard && board.some(id => id !== null) && (
                    <button onClick={handleSecondDraw} className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl"><Stars size={14} /> SEGUNDA TIRAGEM</button>
                 )}

                 <button onClick={handleShuffle} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl"><RotateCcw size={14} /> {spreadType === 'relogio' ? 'NOVA TIRAGEM' : 'EMBARALHAR'}</button>
               </div>
            </div>
          )}
        </header>

        <div className="p-4 md:p-10 flex-grow flex flex-col min-h-0 relative">
          {activeBalloons.map((b, i) => <Balloon key={i} balloon={b} onDismiss={() => setActiveBalloons(prev => prev.filter(x => x !== b))} />)}
          
          {view === 'board' && (
            <>
              <div className="absolute bottom-10 right-10 flex flex-col items-end gap-3 z-50">
                <div className={`flex flex-col gap-3 transition-all duration-300 transform origin-bottom ${zoomMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                  <button onClick={handleZoomIn} title="Aumentar Zoom" className={`p-3 rounded-full border shadow-2xl transition-all hover:scale-110 active:scale-95 bg-white border-slate-200 text-indigo-700 hover:bg-indigo-600 hover:text-white`}><ZoomIn size={22} /></button>
                  <button onClick={handleZoomOut} title="Diminuir Zoom" className={`p-3 rounded-full border shadow-2xl transition-all hover:scale-110 active:scale-95 bg-white border-slate-200 text-indigo-700 hover:bg-indigo-600 hover:text-white`}><ZoomOut size={22} /></button>
                  <button onClick={handleResetZoom} title="Ajustar à Tela" className={`p-3 rounded-full border shadow-2xl transition-all hover:scale-110 active:scale-95 bg-white border-slate-200 text-indigo-700 hover:bg-indigo-600 hover:text-white`}><Maximize2 size={22} /></button>
                  <div className={`mt-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400`}>{Math.round(zoomLevel * 100)}%</div>
                </div>
                <button onClick={() => setZoomMenuOpen(!zoomMenuOpen)} className={`p-4 rounded-full border shadow-2xl transition-all hover:scale-105 active:scale-95 ${zoomMenuOpen ? 'bg-rose-600 border-rose-500' : 'bg-indigo-600 border-indigo-500'} text-white`}>{zoomMenuOpen ? <X size={24} /> : <ZoomIn size={24} />}</button>
              </div>

              <div ref={boardRef} className="flex-grow flex flex-col items-center justify-start md:justify-center min-h-0 w-full py-4 overflow-hidden">
                {spreadType === 'mesa-real' ? (
                  <div ref={contentRef} className="max-w-6xl w-full grid grid-cols-8 gap-1 md:gap-3 mx-auto origin-center transition-all duration-300 flex-grow-0" style={{ transform: `scale(${zoomLevel})` }}>
                    {board.slice(0, 32).map((id, i) => <CardVisual key={`real-${i}-${id}`} card={id ? LENORMAND_CARDS.find(c => c.id === id) : null} houseId={i + 1} isSelected={selectedHouse === i} isThemeCard={false} highlightType={getGeometryHighlight(i)} onClick={() => handleHouseSelection(i)} isManualMode={isManualMode} spreadType="mesa-real" studyModeActive={studyMode.active} isAnimating={isAnimating} />)}
                    <div className="col-span-8 flex justify-center py-2 md:py-4"><span className="text-[9px] md:text-[11px] font-cinzel font-black tracking-[0.6em] text-slate-500 uppercase opacity-60">VEREDITO</span></div>
                    <div className="col-span-2"></div>
                    {board.slice(32, 36).map((id, i) => <CardVisual key={`real-${i+32}-${id}`} card={id ? LENORMAND_CARDS.find(c => c.id === id) : null} houseId={i + 33} isSelected={selectedHouse === i+32} isThemeCard={false} highlightType={getGeometryHighlight(i+32)} onClick={() => handleHouseSelection(i+32)} isManualMode={isManualMode} spreadType="mesa-real" studyModeActive={studyMode.active} isAnimating={isAnimating} />)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-grow min-h-0 w-full landscape:scale-[0.6] sm:landscape:scale-[0.8] lg:landscape:scale-100 origin-center transition-all">
                    <div ref={contentRef} className={`relative w-[28rem] h-[28rem] md:w-[32rem] md:h-[32rem] border rounded-full flex items-center justify-center origin-center transition-all border-slate-200`} style={{ transform: `scale(${zoomLevel})` }}>
                      <div className="absolute w-28 z-20"><CardVisual key={`clock-center-${board[12]}`} card={board[12] ? LENORMAND_CARDS.find(c => c.id === board[12]) : null} houseId={13} isSelected={selectedHouse === 12} isThemeCard={false} highlightType={getGeometryHighlight(12)} onClick={() => handleHouseSelection(12)} isManualMode={isManualMode} spreadType="relogio" studyModeActive={studyMode.active} isAnimating={isAnimating} /></div>
                      {board.slice(0, 12).map((id, i) => {
                        const angle = (i * 30) - 90; const rad = angle * Math.PI / 180; const ox = 40 * Math.cos(rad); const oy = 40 * Math.sin(rad);
                        return (
                          <div key={`clock-house-${i}-${id}`} className="absolute w-24 aspect-[3/4.2] -translate-x-1/2 -translate-y-1/2 z-10 overflow-visible" style={{ left: `${50 + ox}%`, top: `${50 + oy}%` }}>
                            <CardVisual card={id ? LENORMAND_CARDS.find(c => c.id === id) : null} houseId={i + 1} isSelected={selectedHouse === i} isThemeCard={false} highlightType={getGeometryHighlight(i)} onClick={() => handleHouseSelection(i)} isManualMode={isManualMode} spreadType="relogio" offsetX={`${ox * 8}px`} offsetY={`${oy * 8}px`} studyModeActive={studyMode.active} isAnimating={isAnimating} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {view === 'glossary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {LENORMAND_CARDS.map(card => (
                <div key={card.id} className={`bg-white border-slate-200 text-slate-900 shadow-lg border rounded-2xl p-6 hover:border-indigo-500/50 transition-colors`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0"><img src={CARD_IMAGES[card.id] || FALLBACK_IMAGE} className="w-full h-full object-cover" alt="" /></div>
                    <div><h3 className="text-sm font-cinzel font-bold">{card.id}. {card.name}</h3><span className={`text-[8px] font-black uppercase ${card.polarity === Polarity.POSITIVE ? 'text-emerald-500' : 'text-rose-500'}`}>{card.polarity}</span></div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-4 italic">"{card.briefInterpretation}"</p>
                  <div className="flex flex-wrap gap-1">{card.keywords.map((k, i) => <span key={i} className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase bg-indigo-50 text-indigo-800 font-bold`}>{k}</span>)}</div>
                </div>
              ))}
            </div>
          )}

          {view === 'fundamentals' && (
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
              {FUNDAMENTALS_DATA.map(mod => (
                <div key={mod.id} className="space-y-6">
                  <div><h3 className={`text-xl font-cinzel font-bold text-indigo-950`}>{mod.title}</h3><p className="text-slate-400 text-sm">{mod.description}</p><p className="text-slate-500 text-xs mt-1 italic">{mod.content}</p></div>
                  <div className="grid gap-4">{mod.concepts.map((concept, i) => <ConceptAccordion key={`${mod.id}-c-${i}`} concept={concept} isOpen={openConceptId === `${mod.id}-c-${i}`} onToggle={() => setOpenConceptId(openConceptId === `${mod.id}-c-${i}` ? null : `${mod.id}-c-${i}`)} />)}</div>
                </div>
              ))}
            </div>
          )}

          {view === 'study' && (
            <div className="max-w-6xl mx-auto space-y-12 pb-20">
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500"><GraduationCap size={40} /></div>
                <h2 className={`text-3xl font-cinzel font-bold mb-4 text-indigo-950`}>Laboratório de Estudos LUMINA</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">Explore a teoria aplicada. Escolha um tópico abaixo para aprender a técnica e clique em "Ver na Prática" para visualizar os destaques nos tabuleiros reais.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {FUNDAMENTALS_DATA.map((mod) => (
                  <div key={`study-${mod.id}`} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-indigo-500/20 pb-4">
                      {mod.id === 'f_mesa_real' ? <LayoutGrid className="text-indigo-500" /> : <Clock className="text-indigo-500" />}
                      <h3 className={`text-xl font-cinzel font-bold text-indigo-950`}>{mod.title}</h3>
                    </div>
                    <div className="grid gap-4">
                      {mod.concepts.map((concept, i) => (
                        <ConceptAccordion 
                          key={`study-concept-${concept.id || i}`} 
                          concept={concept} 
                          isOpen={openConceptId === `study-${mod.id}-${i}`} 
                          onToggle={() => setOpenConceptId(openConceptId === `study-${mod.id}-${i}` ? null : `study-${mod.id}-${i}`)} 
                          onPractice={() => handlePracticeMode(concept.id || concept.title.toLowerCase().split(' ').join('-'), concept.practiceTarget || (mod.id === 'f_mesa_real' ? 'mesa-real' : 'relogio'))} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              <div className={`bg-white border-slate-200 shadow-xl border rounded-[2.5rem] p-10 text-center relative`}>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-cinzel font-bold shadow-2xl">L</div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h3 className={`text-2xl font-cinzel font-bold text-slate-950`}>{userName}</h3>
                  <button onClick={() => {}} className={`p-1.5 rounded-lg transition-colors text-slate-400 hover:text-indigo-600`}><Edit3 size={18} /></button>
                </div>
                <p className={`font-bold uppercase text-[10px] tracking-[0.3em] mt-1 text-indigo-600`}>Nível Iniciante • 12 Tiragens</p>
                <div className="grid grid-cols-3 gap-4 mt-10">
                  {[ { label: 'Tiragens', val: '12', icon: <History size={16}/> }, { label: 'Cartas Vistas', val: '36/36', icon: <Layers size={16}/> }, { label: 'Pontuação', val: '450', icon: <Award size={16}/> } ].map((stat, i) => (
                    <div key={i} className={`bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm`}><div className="text-indigo-600 mb-2 flex justify-center">{stat.icon}</div><div className={`text-lg font-bold text-slate-900`}>{stat.val}</div><div className="text-[8px] font-black uppercase text-slate-500">{stat.label}</div></div>
                  ))}
                </div>
              </div>
              <div className={`bg-white border-slate-200 shadow-lg border rounded-[2rem] p-8`}>
                 <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><ShieldCheck size={20}/></div><h4 className={`font-cinzel font-bold text-sm uppercase tracking-widest text-slate-900`}>Informações de Licença</h4></div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1"><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Tipo de Licença</span><div className={`text-sm font-bold text-indigo-700`}>Plano Vitalício (Premium)</div></div>
                    <div className="space-y-1"><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Data de Início</span><div className={`text-sm font-bold text-slate-700`}>15 de Dezembro, 2023</div></div>
                    <div className="space-y-1"><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">E-mail Cadastrado</span><div className={`text-sm font-bold text-slate-700`}>estudante@lumina.com</div></div>
                 </div>
              </div>
              <div className={`bg-white border-slate-200 shadow-lg border rounded-[2rem] p-8`}>
                 <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3"><div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><History size={20}/></div><h4 className={`font-cinzel font-bold text-sm uppercase tracking-widest text-slate-900`}>Minhas Tiragens Salvas</h4></div>
                   <div className="flex items-center gap-4">
                     <button onClick={() => setIsExcludingReadings(!isExcludingReadings)} className={`text-[10px] font-black uppercase transition-colors flex items-center gap-1.5 ${isExcludingReadings ? 'text-rose-500' : 'text-indigo-500'} hover:underline`}>{isExcludingReadings ? <><CheckCircle2 size={12}/> Concluir</> : <><Edit3 size={12}/> Editar</>}</button>
                     <button className="text-[10px] font-black uppercase text-indigo-500 hover:underline">Ver todas</button>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedReadings.map(reading => (
                      <div key={reading.id} className={`p-4 rounded-2xl border flex items-center justify-between group cursor-pointer transition-all bg-slate-50 border-slate-100 hover:border-indigo-300`}>
                        <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border`}>{reading.type === 'mesa-real' ? <LayoutGrid size={20} className="text-indigo-400"/> : <Clock size={20} className="text-amber-400"/>}</div><div><div className={`text-sm font-bold text-slate-900`}>{reading.title}</div><div className="text-[10px] text-slate-500">Salvo em {reading.date}</div></div></div>
                        <button onClick={(e) => { e.stopPropagation(); if (isExcludingReadings) handleDeleteReading(reading.id); }} className={`p-2 rounded-lg transition-colors ${isExcludingReadings ? 'text-rose-500 hover:bg-rose-500/10' : 'group-hover:bg-indigo-600 group-hover:text-white text-slate-500 shadow-sm'}`}>{isExcludingReadings ? <Trash2 size={18} /> : <ChevronRight size={18} />}</button>
                      </div>
                    ))}
                    {savedReadings.length === 0 && <div className="col-span-2 py-8 text-center opacity-40"><p className="text-sm">Nenhuma leitura salva.</p></div>}
                 </div>
              </div>
            </div>
          )}
        </div>

        {showCardPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="max-w-4xl w-full max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 custom-scrollbar">
              <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4"><h3 className="text-sm font-cinzel font-bold text-indigo-100">Escolha a Carta para Casa {selectedHouse! + 1}</h3><button onClick={() => setShowCardPicker(false)} className="p-2 text-slate-500 hover:text-white"><X size={24}/></button></div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
                {LENORMAND_CARDS.map(card => {
                  const isUsed = board.includes(card.id);
                  return (
                    <div key={card.id} onClick={() => { const newBoard = [...board]; const prevIdx = newBoard.indexOf(card.id); if(prevIdx !== -1) newBoard[prevIdx] = null; newBoard[selectedHouse!] = card.id; setBoard(newBoard); setShowCardPicker(false); }} className={`aspect-[3/4.2] rounded-xl border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition-all ${isUsed ? 'opacity-40 grayscale pointer-events-none' : 'border-slate-700 hover:border-indigo-500 bg-slate-800/60'}`}><span className="text-[10px] font-black text-slate-400">{card.id}</span><span className="text-[7px] font-bold text-center uppercase tracking-tighter mt-1 text-indigo-200">{card.name}</span></div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <aside className={`fixed md:sticky top-0 inset-y-0 right-0 z-[70] md:z-30 h-screen transition-all duration-500 border-l flex flex-col overflow-hidden ${mentorPanelOpen ? 'w-full md:w-[32rem]' : 'w-16'} bg-white border-slate-200`}>
        {!mentorPanelOpen && <div className="flex flex-col items-center py-8 h-full w-16 cursor-pointer" onClick={() => setMentorPanelOpen(true)}><ChevronLeft size={20} className="text-slate-500" /><span className="font-cinzel text-[11px] font-bold uppercase tracking-[0.5em] rotate-[-90deg] origin-center py-12 text-slate-500">MENTOR</span></div>}
        {mentorPanelOpen && (
          <>
            <div className={`p-4 border-b flex items-center justify-between shadow-lg h-16 shrink-0 bg-slate-50 border-slate-200`}><button onClick={() => setMentorPanelOpen(false)} className={`p-2 transition-colors text-slate-500 hover:text-slate-950`}><ChevronRight size={18} /></button><h2 className={`text-xs font-bold font-cinzel uppercase tracking-[0.2em] text-indigo-950 font-black`}>Mentor LUMINA</h2><div className="w-10"></div></div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
              {selectedHouse !== null && board[selectedHouse] ? (
                <>
                  <div className={`p-6 rounded-3xl border shadow-lg bg-white border-slate-200 flex items-center gap-6`}><div className="w-16 md:w-20 aspect-[3/4.2] rounded-xl overflow-hidden border border-slate-700 shrink-0 shadow-lg"><img src={CARD_IMAGES[selectedCard?.id] || FALLBACK_IMAGE} className="w-full h-full object-cover" alt="" /></div><div className="flex-grow"><span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1 block">CASA {selectedHouse + (spreadType === 'relogio' && selectedHouse < 12 ? 101 : spreadType === 'relogio' ? 113 : 1)}: {currentHouse?.name}</span><h3 className={`text-xl font-cinzel font-bold mb-2 text-slate-950`}>{selectedCard?.name}</h3><div className="flex items-center gap-4 mt-2"><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${selectedCard?.polarity === Polarity.POSITIVE ? 'bg-emerald-500' : 'bg-rose-500'}`} /><span className={`text-[10px] font-black uppercase text-slate-950`}>{selectedCard?.polarity}</span></div><div className="flex items-center gap-1.5 text-slate-500"><Clock size={12}/><span className={`text-[10px] font-black uppercase text-slate-800 font-bold`}>{selectedCard?.timingSpeed}</span></div></div></div></div>
                  <div className="space-y-4"><div className={`p-4 rounded-2xl border bg-indigo-50 border-indigo-100 shadow-sm`}><span className="text-[11px] font-black uppercase text-indigo-600 mb-2 block">Interpretação Base</span><p className={`text-[14px] italic leading-relaxed text-slate-900 font-medium`}>"{selectedCard?.briefInterpretation}"</p></div><div className="flex flex-wrap gap-2">{selectedCard?.keywords.map((k, i) => <span key={i} className={`px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-950 font-bold`}>{k}</span>)}</div></div>
                </>
              ) : null}

              {spreadType === 'relogio' && (isViewingFirstDraw ? secondDrawHistoryData : firstDrawHistoryData) && (
                <div className="space-y-4 animate-in slide-in-from-right duration-500">
                  <h4 className={`text-[12px] font-black uppercase text-indigo-600 tracking-[0.3em] border-b pb-2 border-slate-200`}>{isViewingFirstDraw ? "HISTÓRICO DA 2ª TIRAGEM" : "HISTÓRICO DA 1ª TIRAGEM"}</h4>
                  <div className="grid gap-3">
                     {(isViewingFirstDraw ? secondDrawHistoryData! : firstDrawHistoryData!).map((item, i) => (
                       <div key={i} className={`p-3 rounded-xl border bg-slate-50 border-slate-200 shadow-sm`}>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-10 rounded border border-white/10 overflow-hidden shrink-0 shadow-sm"><img src={CARD_IMAGES[item.card?.id] || FALLBACK_IMAGE} className="w-full h-full object-cover" alt="" /></div>
                             <div className="flex-grow">
                                <div className="flex justify-between items-center mb-0.5"><span className={`text-[11px] font-bold text-slate-950`}>{item.card?.name}</span><span className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">{item.house?.name}</span></div>
                                <p className={`text-[10px] italic leading-snug text-slate-700`}>"{item.card?.briefInterpretation}"</p>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {selectedHouse !== null && board[selectedHouse] ? (
                <div className="space-y-6">
                  <h4 className={`text-[12px] font-black uppercase text-indigo-600 tracking-[0.3em] border-b pb-2 border-slate-200`}>GEOMETRIA ESTRUTURAL</h4>
                  {spreadType === 'mesa-real' && (
                    <div className="grid gap-4">
                      {bridgeData && (
                        <div className={`p-4 rounded-2xl border bg-amber-50 border-amber-200 shadow-sm`}>
                          <h5 className="text-[13px] font-black text-amber-700 uppercase flex items-center gap-2 mb-2"><GitMerge size={12}/> Técnica da Ponte</h5>
                          <p className={`text-[13px] leading-snug text-slate-900`}>O dono da Casa {selectedHouse + 1} ({currentHouse?.name}) está na <span className={`font-bold text-slate-950 underline decoration-indigo-300`}>Casa {bridgeData.houseId} ({bridgeData.house.name})</span> com a carta <span className={`font-bold text-slate-950`}>{bridgeData.card?.name}</span>.</p>
                          <p className={`text-[11px] italic mt-1 text-slate-800`}>"{bridgeData.card?.briefInterpretation}"</p>
                        </div>
                      )}
                      {knightData.length > 0 && (
                        <div className={`p-4 rounded-2xl border bg-fuchsia-50 border-fuchsia-200 shadow-sm`}>
                          <h5 className="text-[13px] font-black text-fuchsia-800 uppercase flex items-center gap-2 mb-3"><CornerDownRight size={12}/> Salto do Cavalo</h5>
                          <div className="space-y-2">
                            {knightData.map((item, i) => (
                              <div key={i} className={`bg-white border-slate-200 shadow-sm p-2 rounded-lg border`}>
                                <div className="flex justify-between items-center mb-1"><span className={`text-[13px] font-bold text-slate-950`}>{item.card?.name}</span><span className="text-[11px] text-slate-600 font-black uppercase">Casa {item.houseId}</span></div>
                                <p className={`text-[11px] italic leading-tight text-slate-800`}>"{item.card?.briefInterpretation}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(diagonalData.up.length > 0 || diagonalData.down.length > 0) && (
                        <div className={`p-4 rounded-2xl border bg-orange-50 border-orange-200 shadow-sm`}>
                          <h5 className="text-[13px] font-black text-orange-800 uppercase flex items-center gap-2 mb-3"><MoveDiagonal size={12}/> Eixos Diagonais</h5>
                          <div className="space-y-4">
                            {diagonalData.up.length > 0 && (
                              <div>
                                <span className="text-[11px] font-black text-orange-600 uppercase block mb-1">Campo de Ascensão (🔺):</span>
                                {diagonalData.up.map((i, idx) => (
                                  <div key={idx} className={`bg-white border border-slate-100 shadow-sm p-1.5 rounded mb-1`}><span className={`text-[13px] font-bold block text-slate-950`}>{i.card?.name} (C{i.houseId})</span><p className={`text-[11px] italic leading-tight mt-0.5 text-slate-800`}>"{i.card?.briefInterpretation}"</p></div>
                                ))}
                              </div>
                            )}
                            {diagonalData.down.length > 0 && (
                              <div>
                                <span className="text-[11px] font-black text-orange-600 uppercase block mb-1">Campo de Sustentação (🔻):</span>
                                {diagonalData.down.map((i, idx) => (
                                  <div key={idx} className={`bg-white border border-slate-100 shadow-sm p-1.5 rounded mb-1`}><span className={`text-[13px] font-bold block text-slate-950`}>{i.card?.name} (C{i.houseId})</span><p className={`text-[11px] italic leading-tight mt-0.5 text-slate-800`}>"{i.card?.briefInterpretation}"</p></div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {spreadType === 'relogio' && axisDataRelogio && (
                    <div className="grid gap-4">
                      <div className={`p-4 rounded-2xl border bg-indigo-50 border-indigo-100 shadow-sm`}>
                        <h5 className="text-[13px] font-black text-indigo-800 uppercase flex items-center gap-2 mb-2"><Scale size={12}/> Eixo de Oposição (180°)</h5>
                        <p className={`text-[13px] font-bold mb-2 text-indigo-950`}>{axisDataRelogio.axis?.name}</p>
                        <p className={`text-[12px] mb-4 text-slate-800`}>{axisDataRelogio.axis?.description}</p>
                        {axisDataRelogio.oppositeCard && (
                          <div className={`p-3 rounded-xl border animate-in fade-in duration-500 bg-white border-slate-200 shadow-sm`}>
                            <div className="flex justify-between items-center mb-1"><span className={`text-[11px] font-bold text-indigo-900`}>{axisDataRelogio.oppositeCard.name} (Oposição)</span><span className="text-[9px] text-slate-500 font-black uppercase">Casa {axisDataRelogio.oppositeHouseId}</span></div>
                            <p className={`text-[11px] italic leading-tight text-slate-800`}>"{axisDataRelogio.oppositeCard.briefInterpretation}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <button onClick={runMentorAnalysis} disabled={isAiLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl mt-6">{isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}<span>EXPANDIR LEITURA (MENTOR IA)</span></button>
                  {cardAnalysis && <div className={`mt-4 rounded-3xl p-6 border shadow-2xl animate-in slide-in-from-bottom-4 duration-700 bg-white border-slate-200`}><div className={`prose prose-sm text-[12px] font-inter leading-relaxed whitespace-pre-wrap text-slate-950`}>{cardAnalysis}</div></div>}
                </div>
              ) : (
                !firstDrawHistoryData && <div className="h-full flex flex-col items-center justify-center text-center opacity-20 p-8"><Compass size={64} className="mb-6 animate-pulse" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Selecione uma casa ocupada no laboratório.</p></div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default App;
