import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Save, AlertCircle, CheckCircle, HeartPulse, Edit2, Info, Thermometer, Droplets, Clock, Trash2, FileText } from 'lucide-react';
import { Stay } from './App';
import { handleFirebaseApi as fetch } from "./firebaseInterceptor";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDateSafely = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD to DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, 'dd/MM/yyyy');
  } catch (e) {
    return dateStr;
  }
};

interface DailyTrackingViewProps {
  stays: Stay[];
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  askConfirm?: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
}

export default function DailyTrackingView({ stays, showToast, askConfirm }: DailyTrackingViewProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [envData, setEnvData] = useState({
    time: format(new Date(), 'HH:mm'),
    temperature: '',
    humidity: '',
  });


  const [animalLogs, setAnimalLogs] = useState<any[]>([]);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Individual Animal Search and Report states
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'report'>('input');
  const [allAnimalLogs, setAllAnimalLogs] = useState<any[]>([]);
  const [searchCatName, setSearchCatName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'date', 'cat_name', 'behavior'
  ]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  const availableColumns = [
    { id: 'date', label: 'Date' },
    { id: 'cat_name', label: 'Nom du chat' },
    { id: 'box_number', label: 'Box' },
    { id: 'is_present', label: 'Présent(e)' },
    { id: 'absence_reason', label: "Raison d'absence" },
    { id: 'litter_used', label: 'Litière utilisée' },
    { id: 'meal_eaten', label: 'Repas mangé' },
    { id: 'gets_along', label: 'Entente congénères' },
    { id: 'behavior', label: 'Comportement / Notes' },
    { id: 'temperature', label: 'Température (°C)' },
    { id: 'humidity', label: 'Humidité (%)' }
  ];

  const fetchAllAnimalLogs = async () => {
    setIsFetchingLogs(true);
    try {
      const res = await fetch('/api/daily-tracking/animal-logs');
      if (res.ok) {
        const data = await res.json();
        setAllAnimalLogs(data);
      } else {
        showToast("Erreur lors de la récupération des rapports animaux", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur de connexion", "error");
    } finally {
      setIsFetchingLogs(false);
    }
  };

  const generatePDFReport = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(18);
      doc.setTextColor(24, 24, 27); // Zinc 800
      doc.text("Rapport de Suivi Journalier", 148, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(113, 113, 122); // Zinc 500
      doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
      if (searchCatName) {
        doc.text(`Animal filtré : ${searchCatName}`, 14, 35);
      }
      
      const columnsToInclude = availableColumns.filter(c => selectedColumns.includes(c.id));
      const headers = columnsToInclude.map(c => c.label);
      
      const body = filteredLogs.map(log => {
        return columnsToInclude.map(col => {
          if (col.id === 'date') return formatDateSafely(log.date);
          if (col.id === 'cat_name') return log.cat_name || '';
          if (col.id === 'box_number') return log.box_number !== undefined ? `Box ${log.box_number}` : '';
          if (col.id === 'is_present') return log.is_present ? 'Oui' : 'Non';
          if (col.id === 'absence_reason') return log.absence_reason || '';
          if (col.id === 'litter_used') return log.litter_used ? 'Oui' : 'Non';
          if (col.id === 'meal_eaten') {
            if (log.meal_eaten === 'complete') return 'Entier';
            if (log.meal_eaten === 'partial') return 'Partiel';
            return 'Pas du tout';
          }
          if (col.id === 'gets_along') return log.gets_along ? 'Oui' : 'Non';
          if (col.id === 'behavior') return log.behavior || '';
          if (col.id === 'temperature') return log.temperature !== undefined && log.temperature !== null ? `${log.temperature} °C` : '';
          if (col.id === 'humidity') return log.humidity !== undefined && log.humidity !== null ? `${log.humidity} %` : '';
          return '';
        });
      });
      
      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: body,
        theme: "grid",
        styles: { fontSize: 8, fontStyle: 'normal' },
        headStyles: { fillColor: [19, 56, 44] } // Deep forest emerald
      });
      
      const filename = `rapport_suivi_${searchCatName.trim() ? searchCatName.replace(/\s+/g, '_') : 'global'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      showToast("Rapport PDF généré et téléchargé avec succès", "success");
    } catch (e) {
      console.error("PDF Generation error:", e);
      showToast("Erreur lors de la génération du PDF", "error");
    }
  };
  const filteredLogs = useMemo(() => {
    if (!searchCatName.trim()) return allAnimalLogs;
    const term = searchCatName.toLowerCase();
    return allAnimalLogs.filter(log => 
      log.cat_name?.toLowerCase().includes(term)
    );
  }, [allAnimalLogs, searchCatName]);

  const uniqueCats = useMemo(() => {
    const names = new Set<string>();
    allAnimalLogs.forEach(log => {
      if (log.cat_name) names.add(log.cat_name);
    });
    return Array.from(names).sort();
  }, [allAnimalLogs]);

  useEffect(() => {
    if (activeSubTab === 'report') {
      fetchAllAnimalLogs();
    }
  }, [activeSubTab]);


  const activeStays = useMemo(() => {
    return stays.filter(stay => {
      const arrDate = stay.arrival_date;
      const depDate = stay.actual_departure || stay.planned_departure;
      return arrDate <= selectedDate && (!depDate || depDate >= selectedDate);
    });
  }, [stays, selectedDate]);

  const loadDailyData = async (date: string, id: string | null = null) => {
    setIsLoading(true);
    try {
      const url = id ? `/api/daily-tracking?id=${id}` : `/api/daily-tracking?date=${date}`;
      const res = await fetch(url);
      const data = await res.json();
      
      const currentActiveStays = stays.filter(stay => {
        const arrDate = stay.arrival_date;
        const depDate = stay.actual_departure || stay.planned_departure;
        return arrDate <= date && (!depDate || depDate >= date);
      });

      if (data.envLog) {
        setHasSavedData(true);
        setSelectedLogId(data.envLog.id.toString());
        setEnvData({
          time: data.envLog.time,
          temperature: data.envLog.temperature?.toString() || '',
          humidity: data.envLog.humidity?.toString() || '',
        });
        
        // Merge with active stays just in case there are new ones, but primarily use saved logs
        const savedLogs = data.animalLogs.map((log: any) => ({
          ...log,
          meal_eaten: log.meal_eaten || 'none',
          is_present: log.is_present !== false
        }));
        
        // Add active stays that might not have a log for this day yet
        const newActiveStays = currentActiveStays.filter((s: any) => !savedLogs.find((l: any) => l.stay_id.toString() === s.id.toString()));
        const newLogs = newActiveStays.map((s: any) => ({
          stay_id: s.id,
          cat_name: s.cat_name,
          box_number: s.box_number,
          litter_used: true,
          meal_eaten: 'complete',
          behavior: 'Calme',
          gets_along: true,
          is_present: true
        }));
        
        const merged = [...savedLogs, ...newLogs];
        const uniqueMerged = merged.filter((item, index, self) =>
          self.findIndex(t => String(t.stay_id) === String(item.stay_id)) === index
        );
        setAnimalLogs(uniqueMerged);
      } else {
        setHasSavedData(false);
        setSelectedLogId(null);
        setEnvData({
          time: format(new Date(), 'HH:mm'),
          temperature: '',
          humidity: '',
        });
        const initialActiveLogs = currentActiveStays.map((s: any) => ({
          stay_id: s.id,
          cat_name: s.cat_name,
          box_number: s.box_number,
          litter_used: true,
          meal_eaten: 'complete',
          behavior: 'Calme',
          gets_along: true,
          is_present: true
        }));
        const uniqueInitialActiveLogs = initialActiveLogs.filter((item, index, self) =>
          self.findIndex(t => String(t.stay_id) === String(item.stay_id)) === index
        );
        setAnimalLogs(uniqueInitialActiveLogs);
      }
    } catch (err) {
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setIsLoading(false);
    }
  };


  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/daily-tracking/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedLogId(null);
    loadDailyData(newDate, null);
  };

  const handleHistoryClick = (date: string, idStr: string) => {
    setSelectedDate(date);
    setSelectedLogId(idStr);
    loadDailyData(date, idStr);
  };

  useEffect(() => {
    fetchHistory();
    loadDailyData(selectedDate);
  }, []);

  useEffect(() => {
    if (!selectedLogId) {
      const logs = activeStays.map((s: any) => ({
        stay_id: s.id,
        cat_name: s.cat_name,
        box_number: s.box_number,
        litter_used: true,
        meal_eaten: 'complete',
        behavior: 'Calme',
        gets_along: true,
        is_present: true,
        absence_reason: ''
      }));
      const uniqueLogs = logs.filter((item, index, self) =>
        self.findIndex(t => String(t.stay_id) === String(item.stay_id)) === index
      );
      setAnimalLogs(uniqueLogs);
    }
  }, [activeStays, selectedLogId]);



  const handleDelete = async () => {
    if (!selectedLogId) return;
    
    const confirmDelete = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/daily-tracking/${selectedLogId}`, { method: 'DELETE' });
        if (res.ok) {
          showToast("Relevé supprimé", "success");
          setSelectedLogId(null);
          fetchHistory();
          loadDailyData(selectedDate, null);
        } else {
          showToast("Erreur lors de la suppression", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Erreur lors de la suppression", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (askConfirm) {
      askConfirm("Supprimer le relevé ?", "Voulez-vous vraiment supprimer ce relevé ?", confirmDelete, true);
    } else if (window.confirm("Voulez-vous vraiment supprimer ce relevé ?")) {
      confirmDelete();
    }
  };

  const handleDeleteId = async (id: string, date: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Évite de sélectionner la ligne lors du clic sur Supprimer
    
    const confirmDelete = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/daily-tracking/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast("Relevé supprimé", "success");
          if (selectedLogId === id) {
            setSelectedLogId(null);
          }
          fetchHistory();
          if (selectedDate === date) {
            loadDailyData(selectedDate, null);
          }
        } else {
          showToast("Erreur lors de la suppression", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Erreur lors de la suppression", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (askConfirm) {
      askConfirm("Supprimer le relevé ?", "Voulez-vous vraiment supprimer ce relevé ?", confirmDelete, true);
    } else if (window.confirm("Voulez-vous vraiment supprimer ce relevé ?")) {
      confirmDelete();
    }
  };


  const handleNewRecord = () => {
    setSelectedLogId(null);
    setHasSavedData(false);
    setEnvData({
      time: format(new Date(), 'HH:mm'),
      temperature: '',
      humidity: '',
    });
    
    const initialLogs = activeStays.map(s => ({
      stay_id: s.id,
      cat_name: s.cat_name,
      box_number: s.box_number,
      litter_used: true,
      meal_eaten: 'complete',
      behavior: 'Calme',
      gets_along: true,
      is_present: true,
      absence_reason: ''
    }));
    const uniqueInitialLogs = initialLogs.filter((item, index, self) =>
      self.findIndex(t => String(t.stay_id) === String(item.stay_id)) === index
    );
    setAnimalLogs(uniqueInitialLogs);
  };

  const handleSave = async () => {
    if (!envData.time) {
      showToast("L'heure du relevé est obligatoire", "error");
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        time: envData.time,
        temperature: envData.temperature ? parseFloat(envData.temperature) : null,
        humidity: envData.humidity ? parseFloat(envData.humidity) : null,
        animal_count: animalLogs.filter(log => log.is_present).length,
        animalLogs: animalLogs
      };

      const url = selectedLogId ? `/api/daily-tracking/${selectedLogId}` : "/api/daily-tracking";
      const res = await fetch(url, {
        method: selectedLogId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || "Erreur serveur"); }
      
      const resData = await res.json();
      if (!selectedLogId && resData.id) {
        setSelectedLogId(resData.id.toString());
      }
      
      showToast("Données journalières enregistrées avec succès", "success");
      setHasSavedData(true);
      fetchHistory();
    } catch (err) {
      showToast(`Erreur lors de la sauvegarde: ${err.message}`, "error");
    }
  };

  const updateAnimalLog = (stayId: string, field: string, value: any) => {
    setAnimalLogs(prev => prev.map(log => 
      log.stay_id.toString() === stayId.toString() ? { ...log, [field]: value } : log
    ));
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <HeartPulse size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
              Suivi journalier
            </h2>
            <p className="text-xs text-stone-500">
              Constantes de la pension et état quotidien de chaque pensionnaire.
            </p>
          </div>
        </div>

        {activeSubTab === 'input' && (
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl text-sm font-medium text-stone-800 focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none tabular-nums"
            />
            {selectedLogId && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
            <button
              onClick={handleNewRecord}
              disabled={isLoading}
              className="bg-[#FAF8F4] text-stone-700 hover:bg-[#F1ECE1] border border-[#E4DDD1] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              Nouveau relevé
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save size={14} />
              {selectedLogId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-[#E5DED2] gap-5 print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('input')}
          className={`pb-2.5 font-semibold text-[13px] transition-colors whitespace-nowrap border-b-2 ${
            activeSubTab === 'input'
              ? 'text-[#13382C] border-emerald-700'
              : 'text-stone-500 border-transparent hover:text-stone-800'
          }`}
        >
          Saisie journalière & Historique global
        </button>
        <button
          onClick={() => setActiveSubTab('report')}
          className={`pb-2.5 font-semibold text-[13px] transition-colors whitespace-nowrap border-b-2 ${
            activeSubTab === 'report'
              ? 'text-[#13382C] border-emerald-700'
              : 'text-stone-500 border-transparent hover:text-stone-800'
          }`}
        >
          Recherche & Rapport individuel par animal
        </button>
      </div>

      {activeSubTab === 'input' && (
        <div className="space-y-4">
          {/* Environmental Data Section */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2]">
            <h3 className="font-display text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <Info size={15} />
              </span>
              Informations générales (Environnement)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock size={12} className="text-stone-400" />
                  Heure du relevé
                </label>
                <input
                  type="time"
                  value={envData.time}
                  onChange={(e) => setEnvData({ ...envData, time: e.target.value })}
                  className="w-full p-2 text-sm bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all tabular-nums text-stone-800 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Thermometer size={12} className="text-amber-600" />
                  Température (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={envData.temperature}
                  onChange={(e) => setEnvData({ ...envData, temperature: e.target.value })}
                  className="w-full p-2 text-sm bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all tabular-nums text-stone-800 font-medium"
                  placeholder="Ex: 21.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Droplets size={12} className="text-sky-600" />
                  Humidité (%)
                </label>
                <input
                  type="number"
                  value={envData.humidity}
                  onChange={(e) => setEnvData({ ...envData, humidity: e.target.value })}
                  className="w-full p-2 text-sm bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all tabular-nums text-stone-800 font-medium"
                  placeholder="Ex: 55"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                  Nombre d'animaux
                </label>
                <div className="w-full p-2 text-sm bg-[#EFF4F0] border border-[#D4E2D8] rounded-xl text-[#13382C] font-semibold tabular-nums">
                  {animalLogs.filter(log => log.is_present).length} animal(aux) présent(s)
                </div>
              </div>
            </div>
          </div>

          {/* Animal Tracking Section */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-display text-base font-semibold text-stone-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Edit2 size={14} />
                </span>
                Suivi individuel des animaux
              </h3>
              {hasSavedData && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                  Relevé enregistré
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-stone-500 text-sm">Chargement des données...</div>
            ) : animalLogs.length === 0 ? (
              <div className="py-8 text-center text-stone-500 flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-[#F4F0E8] text-stone-400 flex items-center justify-center mb-2">
                  <AlertCircle size={20} />
                </div>
                <p className="font-medium text-sm text-stone-700">Aucun animal présent à cette date.</p>
                <p className="text-xs text-stone-400 mt-0.5">Sélectionnez une autre date ou enregistrez un séjour.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#EDE6DA]">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#F4F0E8] text-stone-600 uppercase text-[11px] font-semibold border-b border-[#E5DED2]">
                    <tr>
                      <th className="px-3 py-2.5 w-32">Nom / Box</th>
                      <th className="px-3 py-2.5 w-24">Présent(e)</th>
                      <th className="px-3 py-2.5 w-28">Litière utilisée</th>
                      <th className="px-3 py-2.5 w-40">Repas mangé</th>
                      <th className="px-3 py-2.5 w-32">Entente congénère</th>
                      <th className="px-3 py-2.5">Comportement / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E9DC]">
                    {animalLogs.map((log) => (
                      <tr key={log.stay_id} className="hover:bg-[#FAF8F4] transition-colors">
                        <td className={`px-3 py-2.5 align-top ${!log.is_present ? 'opacity-50 grayscale' : ''}`}>
                          <div className="font-semibold text-stone-900">{log.cat_name}</div>
                          <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 inline-block px-1.5 py-0.5 rounded mt-0.5 tabular-nums">
                            Box {log.box_number}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={log.is_present}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'is_present', e.target.checked)}
                              className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                            />
                            <span className="text-stone-700 font-medium">{log.is_present ? 'Oui' : 'Non'}</span>
                          </label>
                        </td>
                        <td className={`px-3 py-2.5 align-top ${!log.is_present ? 'opacity-50 grayscale' : ''}`}>
                          <label className={`flex items-center gap-2 ${log.is_present ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <input
                              type="checkbox"
                              disabled={!log.is_present}
                              checked={log.litter_used}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'litter_used', e.target.checked)}
                              className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600 disabled:opacity-50"
                            />
                            <span className="text-stone-700">{log.litter_used ? 'Oui' : 'Non'}</span>
                          </label>
                        </td>
                        <td className={`px-3 py-2.5 align-top ${!log.is_present ? 'opacity-50 grayscale' : ''}`}>
                          <select
                            disabled={!log.is_present}
                            value={log.meal_eaten}
                            onChange={(e) => updateAnimalLog(log.stay_id, 'meal_eaten', e.target.value)}
                            className="w-full p-1.5 text-[13px] bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 disabled:bg-stone-50 disabled:cursor-not-allowed"
                          >
                            <option value="complete">Entier</option>
                            <option value="partial">Partiel</option>
                            <option value="none">Pas du tout</option>
                          </select>
                        </td>
                        <td className={`px-3 py-2.5 align-top ${!log.is_present ? 'opacity-50 grayscale' : ''}`}>
                          <label className={`flex items-center gap-2 ${log.is_present ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <input
                              type="checkbox"
                              disabled={!log.is_present}
                              checked={log.gets_along}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'gets_along', e.target.checked)}
                              className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600 disabled:opacity-50"
                            />
                            <span className="text-stone-700">{log.gets_along ? 'Oui' : 'Non'}</span>
                          </label>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          {log.is_present ? (
                            <textarea
                              value={log.behavior}
                              disabled={!log.is_present}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'behavior', e.target.value)}
                              placeholder="Observation, comportement..."
                              className="w-full p-1.5 text-[13px] bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg resize-y min-h-[34px] max-h-[100px] outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20"
                            />
                          ) : (
                            <input
                              type="text"
                              value={log.absence_reason || ''}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'absence_reason', e.target.value)}
                              placeholder="Raison de l'absence..."
                              className="w-full p-1.5 text-[13px] border border-[#E4DDD1] bg-[#FAF8F4] text-stone-800 rounded-lg outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 placeholder-stone-400 font-medium"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* History Section */}
          {history.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2]">
              <h3 className="font-display text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Clock size={14} />
                </span>
                Historique des saisies
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[#EDE6DA]">
                <table className="w-full text-left text-[13px] text-stone-600">
                  <thead className="bg-[#F4F0E8] text-stone-600 uppercase text-[11px] font-semibold border-b border-[#E5DED2]">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Heure</th>
                      <th className="px-3.5 py-2.5">Température</th>
                      <th className="px-3.5 py-2.5">Humidité</th>
                      <th className="px-3.5 py-2.5 text-center">Animaux</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E9DC]">
                    {history.map((log) => {
                      const idStr = log.id ? String(log.id) : '';
                      return (
                        <tr
                          key={idStr}
                          onClick={() => handleHistoryClick(log.date, idStr)}
                          className={`cursor-pointer transition-colors ${
                            selectedLogId === idStr
                              ? 'bg-[#EFF4F0]'
                              : 'hover:bg-[#FAF8F4]'
                          }`}
                        >
                          <td className="px-3.5 py-2.5 font-semibold text-stone-800 tabular-nums">
                            {formatDateSafely(log.date)}
                          </td>
                          <td className="px-3.5 py-2.5 text-stone-600 tabular-nums">{log.time}</td>
                          <td className="px-3.5 py-2.5 text-stone-600 tabular-nums">
                            {log.temperature ? `${log.temperature} °C` : '-'}
                          </td>
                          <td className="px-3.5 py-2.5 text-stone-600 tabular-nums">
                            {log.humidity ? `${log.humidity} %` : '-'}
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-[#13382C] font-bold tabular-nums">
                            {log.animal_count}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              onClick={(e) => handleDeleteId(idStr, log.date, e)}
                              className="p-1 px-2 text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                              <span>Supprimer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'report' && (
        <div className="space-y-4">
          {/* Controls Panel */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2] space-y-4 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Animal Search */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  Rechercher un animal (Nom)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchCatName}
                    onChange={(e) => setSearchCatName(e.target.value)}
                    placeholder="Ex: Caramel, Nala..."
                    className="w-full p-2 text-sm bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all text-stone-800 font-medium"
                  />
                  {searchCatName && (
                    <button
                      onClick={() => setSearchCatName('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-stone-500 hover:text-stone-700 bg-[#EFEAE0] px-2 py-0.5 rounded-md"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {/* Quick select tags */}
                {uniqueCats.length > 0 && (
                  <div className="pt-1.5">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Suggestions :
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {uniqueCats.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSearchCatName(cat)}
                          className={`text-xs px-2 py-0.5 rounded-lg transition-colors border font-semibold ${
                            searchCatName.toLowerCase() === cat.toLowerCase()
                              ? 'bg-[#13382C] border-[#13382C] text-white shadow-sm'
                              : 'bg-[#FAF8F4] hover:bg-[#EFEAE0] border-[#E4DDD1] text-stone-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Columns Selector */}
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Colonnes à afficher dans le rapport
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedColumns(availableColumns.map(c => c.id))}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      Tout cocher
                    </button>
                    <button
                      onClick={() => setSelectedColumns(['date', 'cat_name', 'behavior'])}
                      className="text-xs font-semibold text-stone-600 hover:text-stone-800 bg-[#F4F0E8] hover:bg-[#EAE3D5] px-2 py-0.5 rounded-lg transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[#FAF8F4] p-3 rounded-xl border border-[#E4DDD1]">
                  {availableColumns.map((col) => {
                    const isChecked = selectedColumns.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-2 p-1 rounded-lg cursor-pointer transition-colors hover:bg-white ${
                          isChecked ? 'text-stone-900 font-semibold' : 'text-stone-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              if (selectedColumns.length > 1) {
                                setSelectedColumns(prev => prev.filter(c => c !== col.id));
                              }
                            } else {
                              setSelectedColumns(prev => [...prev, col.id]);
                            }
                          }}
                          className="w-3.5 h-3.5 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                        />
                        <span className="text-xs">{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Results Table Section */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2] space-y-3 print:p-0 print:border-0 print:shadow-none">
            {/* Header only shown on print */}
            <div className="hidden print:block mb-6 border-b border-stone-200 pb-4">
              <h1 className="font-display text-2xl font-bold text-stone-900 tracking-tight">Rapport de Suivi Journalier</h1>
              <div className="mt-2 text-sm text-stone-600 flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
                {searchCatName && (
                  <div>
                    <span className="font-bold">Animal : </span>
                    <span className="text-stone-800 font-medium">{searchCatName}</span>
                  </div>
                )}
                <div>
                  <span className="font-bold">Date d'édition : </span>
                  <span className="text-stone-800">{new Date().toLocaleDateString('fr-FR')}</span>
                </div>
                <div>
                  <span className="font-bold">Nombre de relevés : </span>
                  <span className="text-stone-800">{filteredLogs.length}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#EDE6DA] pb-3 print:hidden">
              <h3 className="font-display font-semibold text-stone-900 flex items-center gap-2 text-base tabular-nums">
                <CheckCircle className="text-emerald-700" size={18} />
                Résultats du rapport ({filteredLogs.length} relevé{filteredLogs.length > 1 ? 's' : ''})
              </h3>
              {filteredLogs.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={generatePDFReport}
                    className="text-xs font-semibold text-white bg-[#13382C] hover:bg-[#0E2B22] px-3 py-1.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>Télécharger PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      window.focus();
                      window.print();
                    }}
                    className="text-xs font-semibold text-stone-700 hover:text-stone-900 border border-[#E4DDD1] bg-[#FAF8F4] px-3 py-1.5 rounded-xl hover:bg-[#F1ECE1] transition-colors flex items-center gap-1"
                  >
                    Imprimer
                  </button>
                </div>
              )}
            </div>

            {isFetchingLogs ? (
              <div className="py-10 text-center text-sm text-stone-500">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-emerald-200 border-t-[#13382C] mx-auto mb-2.5"></div>
                Génération du rapport...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-10 text-center text-stone-500 flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-[#F4F0E8] text-stone-400 flex items-center justify-center mb-2.5">
                  <AlertCircle size={20} />
                </div>
                <p className="font-medium text-sm text-stone-700">Aucun historique trouvé pour cet animal.</p>
                <p className="text-xs text-stone-400 mt-0.5">Essayez un autre nom de chat ou élargissez votre recherche.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#EDE6DA] rounded-xl print:border-0 print:rounded-none">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#F4F0E8] text-stone-600 uppercase text-[11px] font-semibold border-b border-[#E5DED2]">
                    <tr>
                      {availableColumns.filter(c => selectedColumns.includes(c.id)).map(col => (
                        <th key={col.id} className="px-3.5 py-2.5">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E9DC] text-stone-600">
                    {filteredLogs.map((log, idx) => (
                      <tr key={`${log.id}-${idx}`} className="hover:bg-[#FAF8F4] transition-colors">
                        {selectedColumns.includes('date') && (
                          <td className="px-3.5 py-2.5 font-semibold text-stone-800 whitespace-nowrap tabular-nums">
                            {formatDateSafely(log.date)}
                          </td>
                        )}
                        {selectedColumns.includes('cat_name') && (
                          <td className="px-3.5 py-2.5 font-semibold text-stone-900">
                            {log.cat_name}
                          </td>
                        )}
                        {selectedColumns.includes('box_number') && (
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md tabular-nums">
                              Box {log.box_number}
                            </span>
                          </td>
                        )}
                        {selectedColumns.includes('is_present') && (
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                              log.is_present
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {log.is_present ? 'Oui' : 'Non'}
                            </span>
                          </td>
                        )}
                        {selectedColumns.includes('absence_reason') && (
                          <td className="px-3.5 py-2.5 text-stone-700 min-w-[120px]">
                            {log.absence_reason || '-'}
                          </td>
                        )}
                        {selectedColumns.includes('litter_used') && (
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                              log.litter_used
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-stone-100 text-stone-500'
                            }`}>
                              {log.litter_used ? 'Oui' : 'Non'}
                            </span>
                          </td>
                        )}
                        {selectedColumns.includes('meal_eaten') && (
                          <td className="px-3.5 py-2.5 font-semibold whitespace-nowrap">
                            {log.meal_eaten === 'complete' && <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">Entier</span>}
                            {log.meal_eaten === 'partial' && <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs">Partiel</span>}
                            {log.meal_eaten === 'none' && <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-xs">Pas du tout</span>}
                          </td>
                        )}
                        {selectedColumns.includes('gets_along') && (
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {log.gets_along ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs font-semibold">Oui</span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-xs font-semibold">Non</span>
                            )}
                          </td>
                        )}
                        {selectedColumns.includes('behavior') && (
                          <td className="px-3.5 py-2.5 text-stone-800 italic bg-[#FBF6EB]/60 min-w-[200px]" title={log.behavior}>
                            {log.behavior || '-'}
                          </td>
                        )}
                        {selectedColumns.includes('temperature') && (
                          <td className="px-3.5 py-2.5 text-stone-600 whitespace-nowrap tabular-nums">
                            {log.temperature ? `${log.temperature} °C` : '-'}
                          </td>
                        )}
                        {selectedColumns.includes('humidity') && (
                          <td className="px-3.5 py-2.5 text-stone-600 whitespace-nowrap tabular-nums">
                            {log.humidity ? `${log.humidity} %` : '-'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

