import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Save, AlertCircle, CheckCircle, HeartPulse, Edit2, Info, Thermometer, Droplets, Clock, Trash2 } from 'lucide-react';
import { Stay } from './App';
import { handleFirebaseApi as fetch } from "./firebaseInterceptor";

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
        const newActiveStays = activeStays.filter((s: any) => !savedLogs.find((l: any) => l.stay_id.toString() === s.id.toString()));
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
        
        setAnimalLogs([...savedLogs, ...newLogs]);
      } else {
        setHasSavedData(false);
        setSelectedLogId(null);
        setEnvData({
          time: format(new Date(), 'HH:mm'),
          temperature: '',
          humidity: '',
        });
        setAnimalLogs(activeStays.map((s: any) => ({
          stay_id: s.id,
          cat_name: s.cat_name,
          box_number: s.box_number,
          litter_used: true,
          meal_eaten: 'complete',
          behavior: 'Calme',
          gets_along: true,
          is_present: true
        })));
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
      setAnimalLogs(activeStays.map((s: any) => ({
        stay_id: s.id,
        cat_name: s.cat_name,
        box_number: s.box_number,
        litter_used: true,
        meal_eaten: 'complete',
        behavior: 'Calme',
        gets_along: true,
        is_present: true,
        absence_reason: ''
      })));
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
    setAnimalLogs(initialLogs);
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
    <div className="space-y-6">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-2xl font-black text-stone-800 tracking-tight flex items-center gap-2">
            <HeartPulse className="text-pink-500" />
            Suivi journalier
          </h2>
          <p className="text-stone-500">Enregistrez les constantes environnementales et l'état des animaux.</p>
        </div>
        
        {activeSubTab === 'input' && (
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="p-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none shadow-sm"
            />
            {selectedLogId && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm border border-red-200"
              >
                Supprimer
              </button>
            )}
            <button
              onClick={handleNewRecord}
              disabled={isLoading}
              className="bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              Nouveau relevé
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-stone-800 hover:bg-stone-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Save size={18} />
              {selectedLogId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-stone-200 gap-6 print:hidden">
        <button
          onClick={() => setActiveSubTab('input')}
          className={`pb-3 font-bold text-sm transition-all relative ${activeSubTab === 'input' ? 'text-pink-600 border-b-2 border-pink-500' : 'text-stone-500 hover:text-stone-800'}`}
        >
          Saisie journalière & Historique global
        </button>
        <button
          onClick={() => setActiveSubTab('report')}
          className={`pb-3 font-bold text-sm transition-all relative ${activeSubTab === 'report' ? 'text-pink-600 border-b-2 border-pink-500' : 'text-stone-500 hover:text-stone-800'}`}
        >
          Recherche & Rapport individuel par animal
        </button>
      </div>

      {activeSubTab === 'input' && (
        <div className="space-y-6">
          {/* Environmental Data Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Info className="text-blue-500" size={18} />
              Informations générales (Environnement)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Heure du relevé</label>
                <input
                  type="time"
                  value={envData.time}
                  onChange={(e) => setEnvData({ ...envData, time: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                  <Thermometer size={14} /> Température (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={envData.temperature}
                  onChange={(e) => setEnvData({ ...envData, temperature: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-500 transition-all"
                  placeholder="Ex: 21.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                  <Droplets size={14} /> Humidité (%)
                </label>
                <input
                  type="number"
                  value={envData.humidity}
                  onChange={(e) => setEnvData({ ...envData, humidity: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-500 transition-all"
                  placeholder="Ex: 55"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Nombre d'animaux</label>
                <div className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-700 font-bold">
                  {animalLogs.filter(log => log.is_present).length} animal(aux) présent(s)
                </div>
              </div>
            </div>
          </div>

          {/* Animal Tracking Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Edit2 className="text-orange-500" size={18} />
              Suivi individuel des animaux
            </h3>
            
            {isLoading ? (
              <div className="py-8 text-center text-stone-500">Chargement des données...</div>
            ) : animalLogs.length === 0 ? (
              <div className="py-8 text-center text-stone-500 flex flex-col items-center">
                <AlertCircle className="text-stone-300 mb-2" size={32} />
                <p>Aucun animal présent à cette date.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-xs font-bold border-b border-stone-100">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl w-32">Nom / Box</th>
                      <th className="px-4 py-3 w-28">Présent(e)</th>
                      <th className="px-4 py-3 w-32">Litière utilisée</th>
                      <th className="px-4 py-3 w-48">Repas mangé</th>
                      <th className="px-4 py-3 w-32">Entente congénère</th>
                      <th className="px-4 py-3 rounded-tr-xl">Comportement / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {animalLogs.map((log) => (
                      <tr key={log.stay_id} className="hover:bg-stone-50/50 transition-colors">
                        <td className={`px-4 py-3 align-top ${!log.is_present ? 'opacity-50 grayscale' : ''}`}>
                          <div className="font-bold text-stone-800">{log.cat_name}</div>
                          <div className="text-xs font-medium text-stone-500 bg-stone-100 inline-block px-1.5 py-0.5 rounded mt-1">Box {log.box_number}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={log.is_present}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'is_present', e.target.checked)}
                              className="w-4 h-4 text-emerald-500 rounded border-stone-300 focus:ring-emerald-500"
                            />
                            <span className="text-stone-700">{log.is_present ? 'Oui' : 'Non'}</span>
                          </label>
                        </td>
                        <td className={`px-4 py-3 align-top ${!log.is_present ? 'opacity-50 grayscale' : ''}`}>
                          <label className={`flex items-center gap-2 ${log.is_present ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <input
                              type="checkbox"
                              disabled={!log.is_present}
                              checked={log.litter_used}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'litter_used', e.target.checked)}
                              className="w-4 h-4 text-pink-500 rounded border-stone-300 focus:ring-pink-500 disabled:opacity-50"
                            />
                            <span className="text-stone-700">{log.litter_used ? 'Oui' : 'Non'}</span>
                          </label>
                        </td>
                        <td className={`px-4 py-3 align-top ${!log.is_present ? 'opacity-50 grayscale' : ''}`}>
                          <select
                            disabled={!log.is_present}
                            value={log.meal_eaten}
                            onChange={(e) => updateAnimalLog(log.stay_id, 'meal_eaten', e.target.value)}
                            className="w-full p-1.5 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-stone-50 disabled:cursor-not-allowed"
                          >
                            <option value="complete">Entier</option>
                            <option value="partial">Partiel</option>
                            <option value="none">Pas du tout</option>
                          </select>
                        </td>
                        <td className={`px-4 py-3 align-top ${!log.is_present ? 'opacity-50 grayscale' : ''}`}>
                          <label className={`flex items-center gap-2 ${log.is_present ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <input
                              type="checkbox"
                              disabled={!log.is_present}
                              checked={log.gets_along}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'gets_along', e.target.checked)}
                              className="w-4 h-4 text-pink-500 rounded border-stone-300 focus:ring-pink-500 disabled:opacity-50"
                            />
                            <span className="text-stone-700">{log.gets_along ? 'Oui' : 'Non'}</span>
                          </label>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {log.is_present ? (
                            <textarea
                              value={log.behavior}
                              disabled={!log.is_present}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'behavior', e.target.value)}
                              placeholder={log.is_present ? "Observation, comportement..." : "Animal absent"}
                              className="w-full p-2 text-sm border border-stone-200 rounded-lg resize-y min-h-[40px] max-h-[120px] outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          ) : (
                            <input
                              type="text"
                              value={log.absence_reason || ''}
                              onChange={(e) => updateAnimalLog(log.stay_id, 'absence_reason', e.target.value)}
                              placeholder="Raison de l'absence..."
                              className="w-full p-2 text-sm border border-stone-300 bg-white text-stone-800 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 placeholder-stone-400 font-medium"
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 mt-6">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Clock className="text-blue-500" size={18} />
                Historique des saisies
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-xs font-bold border-b border-stone-100">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">Date</th>
                      <th className="px-4 py-3">Heure</th>
                      <th className="px-4 py-3">Température</th>
                      <th className="px-4 py-3">Humidité</th>
                      <th className="px-4 py-3 text-center">Animaux</th>
                      <th className="px-4 py-3 rounded-tr-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {history.map((log) => {
                      const idStr = log.id ? String(log.id) : '';
                      return (
                        <tr 
                          key={idStr} 
                          onClick={() => handleHistoryClick(log.date, idStr)}
                          className={`cursor-pointer transition-colors ${selectedLogId === idStr ? 'bg-blue-50' : 'hover:bg-stone-50/50'}`}
                        >
                          <td className="px-4 py-3 font-medium text-stone-800">{formatDateSafely(log.date)}</td>
                          <td className="px-4 py-3 text-stone-600">{log.time}</td>
                          <td className="px-4 py-3 text-stone-600">{log.temperature ? `${log.temperature} °C` : '-'}</td>
                          <td className="px-4 py-3 text-stone-600">{log.humidity ? `${log.humidity} %` : '-'}</td>
                          <td className="px-4 py-3 text-center text-stone-600 font-bold">{log.animal_count}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={(e) => handleDeleteId(idStr, log.date, e)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1 font-bold"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
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
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Animal Search */}
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-500 uppercase tracking-wider block">
                  Rechercher un animal (Nom)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchCatName}
                    onChange={(e) => setSearchCatName(e.target.value)}
                    placeholder="Ex: Caramel, Nala..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-500 transition-all text-stone-800 font-medium"
                  />
                  {searchCatName && (
                    <button
                      onClick={() => setSearchCatName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 bg-stone-200/60 px-1.5 py-0.5 rounded"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {/* Quick select tags */}
                {uniqueCats.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Suggestions :
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {uniqueCats.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSearchCatName(cat)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-all border font-bold ${
                            searchCatName.toLowerCase() === cat.toLowerCase()
                              ? 'bg-pink-100 border-pink-300 text-pink-700 shadow-sm'
                              : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
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
              <div className="md:col-span-2 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-stone-500 uppercase tracking-wider block">
                    Colonnes à afficher dans le rapport
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedColumns(availableColumns.map(c => c.id))}
                      className="text-[10px] font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded-lg transition-colors"
                    >
                      Tout cocher
                    </button>
                    <button
                      onClick={() => setSelectedColumns(['date', 'cat_name', 'behavior'])}
                      className="text-[10px] font-bold text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-stone-50 p-4 rounded-xl border border-stone-100">
                  {availableColumns.map((col) => {
                    const isChecked = selectedColumns.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-stone-100/80 ${
                          isChecked ? 'text-stone-800 font-semibold' : 'text-stone-400'
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
                          className="w-4 h-4 text-pink-500 rounded border-stone-300 focus:ring-pink-500"
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4 print:p-0 print:border-0 print:shadow-none">
            {/* Header only shown on print */}
            <div className="hidden print:block mb-6 border-b border-stone-200 pb-4">
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Rapport de Suivi Journalier</h1>
              <div className="mt-2 text-sm text-stone-600 flex flex-wrap gap-x-6 gap-y-1">
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

            <div className="flex justify-between items-center border-b border-stone-100 pb-4 print:hidden">
              <h3 className="font-bold text-stone-800 flex items-center gap-2 text-lg">
                <CheckCircle className="text-emerald-500" size={20} />
                Résultats du rapport ({filteredLogs.length} relevé(s))
              </h3>
              {filteredLogs.length > 0 && (
                <button
                  onClick={() => {
                    window.focus();
                    window.print();
                  }}
                  className="text-xs font-bold text-stone-600 hover:text-stone-800 border border-stone-200 bg-white px-3 py-1.5 rounded-xl shadow-sm hover:bg-stone-50 transition-colors flex items-center gap-1"
                >
                  Imprimer le rapport
                </button>
              )}
            </div>

            {isFetchingLogs ? (
              <div className="py-12 text-center text-stone-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                Génération du rapport...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-stone-500 flex flex-col items-center">
                <AlertCircle className="text-stone-300 mb-2" size={36} />
                <p className="font-medium">Aucun historique trouvé pour cet animal.</p>
                <p className="text-xs text-stone-400 mt-1">Essayez un autre nom de chat ou élargissez votre recherche.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-stone-100 rounded-xl print:border-0 print:rounded-none">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-xs font-bold border-b border-stone-100">
                    <tr>
                      {availableColumns.filter(c => selectedColumns.includes(c.id)).map(col => (
                        <th key={col.id} className="px-4 py-3">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-600">
                    {filteredLogs.map((log, idx) => (
                      <tr key={`${log.id}-${idx}`} className="hover:bg-stone-50/50 transition-colors">
                        {selectedColumns.includes('date') && (
                          <td className="px-4 py-3 font-semibold text-stone-800 whitespace-nowrap">
                            {formatDateSafely(log.date)}
                          </td>
                        )}
                        {selectedColumns.includes('cat_name') && (
                          <td className="px-4 py-3 font-black text-stone-950">
                            {log.cat_name}
                          </td>
                        )}
                        {selectedColumns.includes('box_number') && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded">
                              Box {log.box_number}
                            </span>
                          </td>
                        )}
                        {selectedColumns.includes('is_present') && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              log.is_present 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {log.is_present ? 'Oui' : 'Non'}
                            </span>
                          </td>
                        )}
                        {selectedColumns.includes('absence_reason') && (
                          <td className="px-4 py-3 text-stone-700 min-w-[120px]">
                            {log.absence_reason || '-'}
                          </td>
                        )}
                        {selectedColumns.includes('litter_used') && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              log.litter_used 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-stone-100 text-stone-500'
                            }`}>
                              {log.litter_used ? 'Oui' : 'Non'}
                            </span>
                          </td>
                        )}
                        {selectedColumns.includes('meal_eaten') && (
                          <td className="px-4 py-3 font-semibold whitespace-nowrap">
                            {log.meal_eaten === 'complete' && <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs">Entier</span>}
                            {log.meal_eaten === 'partial' && <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-xs">Partiel</span>}
                            {log.meal_eaten === 'none' && <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-xs">Pas du tout</span>}
                          </td>
                        )}
                        {selectedColumns.includes('gets_along') && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.gets_along ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs font-bold">Oui</span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-xs font-bold">Non</span>
                            )}
                          </td>
                        )}
                        {selectedColumns.includes('behavior') && (
                          <td className="px-4 py-3 text-stone-800 italic bg-amber-50/10 min-w-[200px]" title={log.behavior}>
                            {log.behavior || '-'}
                          </td>
                        )}
                        {selectedColumns.includes('temperature') && (
                          <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                            {log.temperature ? `${log.temperature} °C` : '-'}
                          </td>
                        )}
                        {selectedColumns.includes('humidity') && (
                          <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
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

