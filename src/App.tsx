export interface Client {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  contact2_name?: string;
  contact2_phone?: string;
  contact2_email?: string;
  contact2_address?: string;
}

export interface Cat {
  id: string;
  owner_id: string;
  owner_name?: string;
  name: string;
  species: string;
  breed: string;
  color: string;
  chip_number: string;
  vaccine_tc_date?: string;
  vaccine_l_date?: string;
  parasite_treatment_date?: string;
  birth_date?: string;
  age?: string;
  comments?: string;
}

export interface Stay {
  id: string;
  cat_id: string;
  cat_name?: string;
  cat_species?: string;
  cat_breed?: string;
  cat_color?: string;
  cat_chip_number?: string;
  cat_vaccine_tc_date?: string;
  cat_vaccine_l_date?: string;
  cat_parasite_treatment_date?: string;
  cat_birth_date?: string;
  cat_age?: string;
  owner_name?: string;
  owner_email?: string;
  owner_address?: string;
  owner_phone?: string;
  box_number: number;
  arrival_date: string;
  arrival_time?: string;
  planned_departure: string;
  departure_time?: string;
  actual_departure?: string;
  comments: string;
  ate_well?: boolean;
  abnormal_behavior?: boolean;
  medication?: string;
  incident?: string;
  health_comments?: string;
  contract_scan_url?: string;
  contract_urls?: string[];
  health_sheet_scan_url?: string;
  is_archived?: boolean | number | string;
}

export interface StayFormData {
  cat_id: string;
  box_number: number;
  arrival_date: string;
  arrival_time?: string;
  planned_departure: string;
  departure_time?: string;
  actual_departure?: string;
  comments: string;
  is_forced?: boolean;
}

export interface HealthLog {
  id: string;
  stay_id: string;
  date: string;
  ate_well: boolean;
  abnormal_behavior: boolean;
  medication: string;
  incident: string;
  comments: string;
}

export interface Media {
  id: string;
  stay_id: string;
  type: "image" | "video";
  url: string;
  filename: string;
}

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "refunded";

export interface Invoice {
  id: string;
  stay_id: string;
  amount: number;
  service_type: string;
  created_at: string;
  invoice_number: string;
  type: "standard" | "deposit" | "final";
  status: InvoiceStatus;
  payment_method?: string;
  deposit_amount?: number;
  reference_total?: number; // Original total for deposit calculation
  related_invoice_number?: string;
  arrival_date?: string;
  departure_date?: string;
  owner_name?: string; // Cache for central view
  cat_name?: string; // Cache for central view
}

export interface InvoiceStatusConfig {
  label: string;
  color: string;
  bg: string;
}

export interface BillingAdjustment {
  id: string;
  date: string;
  client_id: string;
  client_name?: string;
  comment: string;
  amount: number;
  created_at?: string;
}

export interface Settings {
  logo?: string;
  total_boxes?: string;
  general_conditions?: string;
  company_name?: string;
  company_owner?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_siret?: string;
  company_acaced?: string;
  payment_methods?: string[];
  invoice_statuses?: Record<string, InvoiceStatusConfig>;
  health_conditions?: string;
  default_down_payment_percentage?: string;
  stays_banner_url?: string;
}

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Users,
  Cat as CatIcon,
  Calendar,
  CalendarDays,
  HeartPulse,
  FileText,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  Download,
  Image as ImageIcon,
  Film,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Camera,
  Menu,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Search,
  BarChart3,
  ClipboardList,
  Receipt,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  handleFirebaseApi as fetch,
  subscribeBillingAdjustments,
} from "./firebaseInterceptor";
import DEFAULT_BRAND_LOGO from "./assets/images/chathotel_brand_logo_1794854269095.jpg";
import LOGIN_HERO_IMAGE from "./assets/images/login_cat_lounge_1794854269604.jpg";

function BrandLogo({
  logoUrl,
  sizeClass = "w-10 h-10",
  roundedClass = "rounded-xl",
}: {
  logoUrl?: string;
  sizeClass?: string;
  roundedClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = !failed && (logoUrl || DEFAULT_BRAND_LOGO);

  if (!src) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} bg-gradient-to-br from-emerald-700 to-emerald-900 text-amber-200 flex items-center justify-center shrink-0 shadow-sm`}
      >
        <CatIcon size={20} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Logo Chat'Hotel"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${sizeClass} ${roundedClass} object-cover shrink-0 bg-[#FAF6EE]`}
    />
  );
}

const getBoxBadgeClasses = (boxNumber: number) => {
  const palette = [
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-sky-100 text-sky-800 border-sky-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-violet-100 text-violet-800 border-violet-200",
    "bg-teal-100 text-teal-800 border-teal-200",
  ];
  return palette[(Math.max(1, boxNumber) - 1) % palette.length];
};

const getMonogramClasses = (seed: string) => {
  const palette = [
    "bg-emerald-100 text-emerald-800",
    "bg-amber-100 text-amber-800",
    "bg-sky-100 text-sky-800",
    "bg-rose-100 text-rose-800",
    "bg-violet-100 text-violet-800",
  ];
  const code = (seed || "A").charCodeAt(0);
  return palette[code % palette.length];
};

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  stays: {
    title: "Séjours & Accueil",
    subtitle: "Gestion des réservations, arrivées et départs",
  },
  calendar: {
    title: "Calendrier des Box",
    subtitle: "Planification mensuelle et occupation par suite",
  },
  clients: {
    title: "Fichier Clients",
    subtitle: "Propriétaires, coordonnées et contacts de confiance",
  },
  cats: {
    title: "Registre des Animaux",
    subtitle: "Profils félins, vaccins, traitements et observations",
  },
  stats: {
    title: "Statistiques",
    subtitle: "Taux de remplissage et chiffre d'affaires",
  },
  reports: {
    title: "Rapports & Registres",
    subtitle: "Registre entrées/sorties et synthèse sanitaire",
  },
  contracts: {
    title: "Contrats & Fiches",
    subtitle: "Génération PDF et archivage des documents signés",
  },
  "all-invoices": {
    title: "Facturations",
    subtitle: "Suivi des règlements, acomptes et trésorerie",
  },
  "daily-tracking": {
    title: "Suivi Journalier",
    subtitle: "Constantes de la chatterie et bien-être quotidien",
  },
  settings: {
    title: "Configuration",
    subtitle: "Identité de l'établissement, box et paramètres",
  },
};

const formatDateSafe = (
  dateString: string | undefined | null,
  fallback: string = "-",
) => {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (!isValid(date)) return fallback;
  return format(date, "dd/MM/yyyy");
};

const calculateAge = (birthDate: string): string => {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  if (years > 0) {
    return `${years} an${years > 1 ? "s" : ""}${months > 0 ? ` ${months} mois` : ""}`;
  } else if (months > 0) {
    return `${months} mois`;
  } else {
    return "< 1 mois";
  }
};
import { useDropzone } from "react-dropzone";
import { MigrationView } from "./MigrationView";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDanger = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#13382C]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E5DED2] max-w-md w-full p-5 space-y-3.5 transform animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2.5 text-stone-900">
          {isDanger ? (
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          )}
          <h3 className="font-display text-base font-semibold">{title}</h3>
        </div>
        <p className="text-[13px] text-stone-600 leading-relaxed">{message}</p>
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-3.5 py-2 border border-[#E4DDD1] bg-[#FAF8F4] rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#F1ECE1] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${isDanger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#13382C] hover:bg-[#0E2B22]"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-5 right-5 px-3.5 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 z-[110] animate-in slide-in-from-right-10 duration-300 ${type === "success" ? "bg-[#EFF4F0] border-emerald-200 text-[#13382C]" : "bg-rose-50 border-rose-200 text-rose-800"}`}
    >
      {type === "success" ? (
        <CheckCircle2 size={17} className="text-emerald-700 shrink-0" />
      ) : (
        <AlertCircle size={17} className="text-rose-600 shrink-0" />
      )}
      <span className="text-xs font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export const DEFAULT_INVOICE_STATUS_LABELS: Record<
  string,
  InvoiceStatusConfig
> = {
  draft: { label: "Brouillon", color: "text-stone-500", bg: "bg-stone-100" },
  pending: {
    label: "Emise / En attente",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  partially_paid: {
    label: "Partiellement payée",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  paid: {
    label: "Acquittée / Payée",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  overdue: { label: "En retard", color: "text-red-600", bg: "bg-red-50" },
  cancelled: {
    label: "Annulée / Avoir",
    color: "text-stone-400",
    bg: "bg-stone-200",
  },
  refunded: {
    label: "Remboursée",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
};

export const getInvoiceStatusConfig = (
  status: string,
  settings?: Settings,
): InvoiceStatusConfig => {
  return (
    settings?.invoice_statuses?.[status] ||
    DEFAULT_INVOICE_STATUS_LABELS[status] ||
    DEFAULT_INVOICE_STATUS_LABELS.draft
  );
};

import DailyTrackingView from "./DailyTrackingView";

export default function App() {
  const [showMigration, setShowMigration] = useState(
    window.location.hash === "#migrate",
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "clients"
    | "cats"
    | "stays"
    | "stats"
    | "calendar"
    | "reports"
    | "contracts"
    | "settings"
    | "all-invoices"
    | "daily-tracking"
  >("stays");
  const [allInvoicesTabMonth, setAllInvoicesTabMonth] = useState<string | null>(
    null,
  );
  const [showHiddenBillingMenu, setShowHiddenBillingMenu] = useState(false);
  const lastBillingToggleRef = useRef<number>(0);
  const toggleHiddenBillingMenu = () => {
    const now = Date.now();
    if (now - lastBillingToggleRef.current < 200) return;
    lastBillingToggleRef.current = now;
    setShowHiddenBillingMenu((prev) => !prev);
  };
  const [focusSettingId, setFocusSettingId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleHash = () =>
      setShowMigration(window.location.hash === "#migrate");
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const askConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = false,
  ) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm, isDanger });
  };

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      console.log("Fetching data...");
      const t = Date.now();
      const [clientsRes, catsRes, staysRes, settingsRes, statsRes] =
        await Promise.all([
          fetch(`/api/clients?t=${t}`),
          fetch(`/api/cats?t=${t}`),
          fetch(`/api/stays?all=true&t=${t}`),
          fetch(`/api/settings?t=${t}`),
          fetch(`/api/stats?t=${t}`),
        ]);

      const clientsData = await clientsRes.json();
      const catsData = await catsRes.json();
      const staysData = await staysRes.json();
      const settingsData = await settingsRes.json();
      const statsData = await statsRes.json();

      if (Array.isArray(clientsData)) {
        const uniqueClients = clientsData.filter(
          (item: any, index: number, self: any[]) =>
            self.findIndex((t) => String(t.id) === String(item.id)) === index
        );
        setClients(uniqueClients);
      }
      if (Array.isArray(catsData)) {
        const uniqueCats = catsData.filter(
          (item: any, index: number, self: any[]) =>
            self.findIndex((t) => String(t.id) === String(item.id)) === index
        );
        setCats(uniqueCats);
      }
      if (Array.isArray(staysData)) {
        const uniqueStays = staysData.filter(
          (item: any, index: number, self: any[]) =>
            self.findIndex((t) => String(t.id) === String(item.id)) === index
        );
        setStays(
          uniqueStays.map((s: any) => {
            let parsedUrls: string[] = [];
            if (s.contract_urls) {
              let parsed = s.contract_urls;
              if (typeof parsed === "string") {
                try {
                  parsed = JSON.parse(parsed);
                  while (typeof parsed === "string") {
                    parsed = JSON.parse(parsed);
                  }
                } catch (e) {
                  console.error("Invalid contract_urls", s.contract_urls);
                }
              }
              if (Array.isArray(parsed)) parsedUrls = parsed;
            } else if (s.contract_scan_url) {
              parsedUrls = [s.contract_scan_url];
            }
            return {
              ...s,
              contract_urls: parsedUrls,
            };
          }),
        );
      }
      if (settingsData && !settingsData.error) setSettings(settingsData);
      if (statsData && !statsData.error) setStats(statsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast(
        "Erreur lors de la récupération des données. Vérifiez votre connexion.",
        "error",
      );
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (
      currentUser &&
      (currentUser.email === "fdeleflie@gmail.com" ||
        currentUser.email === "kdeleflie@gmail.com")
    ) {
      fetchData(true);
    }
  }, [currentUser]);

  // 1. Loader pendant la vérification initiale de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3EC]">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo sizeClass="w-16 h-16" roundedClass="rounded-2xl" />
          <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-600 font-medium text-sm">
            Vérification de l'accès...
          </p>
        </div>
      </div>
    );
  }

  // 2. Si non connecté, écran de login uniquement
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3EC] p-4 sm:p-6">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl shadow-stone-300/40 border border-[#E5DEC9] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="flex items-center gap-3">
              <BrandLogo
                logoUrl={settings.logo}
                sizeClass="w-11 h-11"
                roundedClass="rounded-xl border border-[#E6DFD1] shadow-sm"
              />
              <div>
                <h1 className="font-display text-xl font-semibold text-[#13382C] tracking-tight">
                  Chat'Hotel
                </h1>
                <p className="text-[11px] font-medium text-amber-700">
                  Pension Féline & Soins
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#18221D] leading-tight text-balance">
                Bienvenue dans votre espace de gestion
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                Pilotez sereinement l'accueil de vos pensionnaires : séjours,
                planning des box, fiches de santé, suivi journalier et
                facturation.
              </p>
            </div>

            <div className="space-y-3">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 whitespace-pre-line leading-relaxed">
                  {loginError}
                </div>
              )}

              <button
                onClick={async () => {
                  setLoginError(null);
                  try {
                    await signInWithPopup(auth, new GoogleAuthProvider());
                  } catch (error: any) {
                    console.error("Erreur de connexion:", error);
                    const currentDomain = window.location.hostname;
                    const configProjectId =
                      (auth as any).app?.options?.projectId || "Inconnu";
                    const consoleLink = `https://console.firebase.google.com/project/${configProjectId}/authentication/settings`;
                    setLoginError(
                      `Connexion bloquée (${error?.code || "erreur"}).\nDomaine actuel : ${currentDomain}\nProjet Firebase : ${configProjectId}\nVérifiez les domaines autorisés dans : ${consoleLink}`,
                    );
                  }
                }}
                className="w-full py-3 px-5 bg-[#13382C] hover:bg-[#0E2B22] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-950/15 flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4 bg-white rounded-full p-0.5"
                />
                <span>S'identifier avec Google</span>
              </button>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                Accès réservé au personnel autorisé de l'établissement.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[240px] lg:min-h-[430px] bg-[#13382C]">
            <img
              src={LOGIN_HERO_IMAGE}
              alt="Salon ensoleillé de la pension Chat'Hotel"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#123025]/85 via-[#123025]/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-display text-lg font-medium text-amber-100">
                Un séjour doux et attentif pour chaque chat.
              </p>
              <p className="text-[11px] text-emerald-100/80 mt-0.5">
                Suites individuelles · Suivi sanitaire quotidien · Espace
                clients
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Vérification de l'email autorisé
  const isAdmin =
    currentUser.email === "fdeleflie@gmail.com" ||
    currentUser.email === "kdeleflie@gmail.com";

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3EC] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-[#E5DEC9] text-center space-y-4">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <h1 className="font-display text-2xl font-semibold text-stone-900">
            Accès Refusé
          </h1>
          <p className="text-stone-600 text-sm">
            Désolé, votre adresse ({currentUser.email}) n'est pas autorisée à
            accéder à ce système.
          </p>
          <button
            onClick={() => signOut(auth)}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition-all"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // 4. Si admin, on peut montrer l'outil de migration si demandé, sinon l'app principale
  if (showMigration) {
    return <MigrationView onComplete={() => (window.location.hash = "")} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F3EC]">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo
            logoUrl={settings.logo}
            sizeClass="w-16 h-16"
            roundedClass="rounded-2xl border border-[#E5DEC9] shadow-sm"
          />
          <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-600 font-medium text-sm">
            Chargement du Chat'Hotel...
          </p>
        </div>
      </div>
    );
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const totalBoxesCount = parseInt(settings.total_boxes || "3");
  const occupiedTodayCount = stays.filter(
    (s) =>
      s.arrival_date <= todayStr &&
      (s.actual_departure || s.planned_departure) >= todayStr,
  ).length;
  const availableBoxesCount = Math.max(0, totalBoxesCount - occupiedTodayCount);
  const currentTabMeta = TAB_META[activeTab] || TAB_META.stays;

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#1D2420] font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#13382C] text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 print:hidden shadow-sm">
        <div className="flex items-center gap-2.5">
          <BrandLogo
            logoUrl={settings.logo}
            sizeClass="w-8 h-8"
            roundedClass="rounded-lg ring-1 ring-white/20"
          />
          <span className="font-display font-semibold text-base tracking-tight">
            Chat'Hotel
          </span>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Ouvrir le menu"
          className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[60] lg:hidden print:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-[232px] bg-[#13382C] text-[#EFF4F0] flex flex-col z-[70] transition-transform duration-300 lg:translate-x-0 print:hidden shadow-xl shadow-emerald-950/15 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-4 py-3.5 border-b border-white/10 hidden lg:flex items-center gap-3">
          <BrandLogo
            logoUrl={settings.logo}
            sizeClass="w-9 h-9"
            roundedClass="rounded-xl ring-1 ring-white/20 shadow-md"
          />
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-lg text-white tracking-tight truncate">
              {settings.company_name || "Chat'Hotel"}
            </h1>
            <p className="text-[11px] text-emerald-200/75 truncate">
              Pension féline
            </p>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          <NavItem
            active={activeTab === "stays"}
            onClick={() => {
              setActiveTab("stays");
              setIsMenuOpen(false);
            }}
            icon={<Calendar size={16} />}
            label="Séjours"
          />
          <NavItem
            active={activeTab === "calendar"}
            onClick={() => {
              setActiveTab("calendar");
              setIsMenuOpen(false);
            }}
            icon={<CalendarDays size={16} />}
            label="Calendrier"
          />
          <NavItem
            active={activeTab === "clients"}
            onClick={() => {
              setActiveTab("clients");
              setIsMenuOpen(false);
            }}
            icon={<Users size={16} />}
            label="Clients"
          />
          <NavItem
            active={activeTab === "cats"}
            onClick={() => {
              setActiveTab("cats");
              setIsMenuOpen(false);
            }}
            icon={<CatIcon size={16} />}
            label="Animaux"
          />
          <NavItem
            active={activeTab === "daily-tracking"}
            onClick={() => {
              setActiveTab("daily-tracking");
              setIsMenuOpen(false);
            }}
            icon={<HeartPulse size={16} />}
            label="Suivi Journalier"
          />

          <div className="my-2 border-t border-white/10" />

          <NavItem
            active={activeTab === "all-invoices"}
            onClick={(e) => {
              const hasModifier =
                e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
              if (hasModifier) {
                e.preventDefault();
                toggleHiddenBillingMenu();
              }
              setActiveTab("all-invoices");
              setIsMenuOpen(false);
            }}
            onContextMenu={(e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
                e.preventDefault();
                toggleHiddenBillingMenu();
                setActiveTab("all-invoices");
                setIsMenuOpen(false);
              }
            }}
            icon={<Receipt size={16} />}
            label="Facturations"
          />
          <NavItem
            active={activeTab === "contracts"}
            onClick={() => {
              setActiveTab("contracts");
              setIsMenuOpen(false);
            }}
            icon={<FileText size={16} />}
            label="Contrats"
          />
          <NavItem
            active={activeTab === "reports"}
            onClick={() => {
              setActiveTab("reports");
              setIsMenuOpen(false);
            }}
            icon={<ClipboardList size={16} />}
            label="Rapports"
          />
          <NavItem
            active={activeTab === "stats"}
            onClick={() => {
              setActiveTab("stats");
              setIsMenuOpen(false);
            }}
            icon={<BarChart3 size={16} />}
            label="Statistiques"
          />

          <div className="pt-2 mt-2 border-t border-white/10 flex flex-col gap-0.5">
            <NavItem
              active={activeTab === "settings"}
              onClick={() => {
                setActiveTab("settings");
                setIsMenuOpen(false);
              }}
              icon={<SettingsIcon size={16} />}
              label="Configuration"
            />
          </div>
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2.5 bg-[#0F2E24]">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-emerald-100/80 font-medium">
                Disponibilité du jour
              </span>
              <span
                className={`font-mono font-semibold tabular-nums ${availableBoxesCount === 0 ? "text-amber-300" : "text-emerald-200"}`}
              >
                {availableBoxesCount}/{totalBoxesCount}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${availableBoxesCount === 0 ? "bg-amber-400" : "bg-emerald-300"}`}
                style={{
                  width: `${Math.min(100, Math.round((occupiedTodayCount / Math.max(1, totalBoxesCount)) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-emerald-100/75 mt-1.5">
              {availableBoxesCount > 0
                ? `${availableBoxesCount} box libre${availableBoxesCount > 1 ? "s" : ""} aujourd'hui`
                : "Pension complète aujourd'hui"}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchData(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-emerald-100 bg-white/8 hover:bg-white/15 rounded-lg transition-colors"
              title="Actualiser les données"
            >
              <RefreshCw size={12} />
              <span>Actualiser</span>
            </button>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 rounded-lg transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={13} />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ml-[232px] min-h-screen flex flex-col transition-all duration-300 print:ml-0">
        {/* Top Workspace Bar */}
        <header className="hidden lg:flex items-center justify-between gap-4 px-6 py-2.5 bg-[#FAF8F4]/90 backdrop-blur-md border-b border-[#E6DFD3] sticky top-0 z-40 print:hidden">
          <div className="min-w-0 flex items-center gap-2 text-xs text-stone-500">
            <span className="font-medium text-stone-600">{settings.company_name || "Chat'Hotel"}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-800 font-semibold">
              {currentTabMeta.title}
            </span>
            <span aria-hidden="true" className="text-stone-300">|</span>
            <span className="truncate text-stone-500">{currentTabMeta.subtitle}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-medium text-stone-600 capitalize tabular-nums">
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </span>
            <div className="h-3.5 w-px bg-[#E0D8CA]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-semibold text-[11px] flex items-center justify-center border border-amber-200">
                {(currentUser.email || "U")[0].toUpperCase()}
              </div>
              <span className="text-[11px] font-medium text-stone-700 max-w-[170px] truncate">
                {currentUser.email}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1260px] mx-auto p-4 sm:p-5 lg:p-6 print:p-0">
        {activeTab === "stays" && (
          <div className="space-y-4">
            <StaysView
              stays={stays}
              cats={cats}
              onUpdate={fetchData}
              settings={settings}
              showToast={showToast}
              askConfirm={askConfirm}
              onConfigureBanner={() => {
                setFocusSettingId("stays-banner-url-input");
                setActiveTab("settings");
              }}
            />
          </div>
        )}
        {activeTab === "calendar" && (
          <div className="space-y-4">
            <CalendarView
              stays={stays}
              onUpdate={fetchData}
              settings={settings}
              showToast={showToast}
              askConfirm={askConfirm}
            />
          </div>
        )}
        {activeTab === "clients" && (
          <ClientsView
            clients={clients}
            cats={cats}
            stays={stays}
            settings={settings}
            onUpdate={fetchData}
            showToast={showToast}
            askConfirm={askConfirm}
          />
        )}
        {activeTab === "cats" && (
          <CatsView
            cats={cats}
            clients={clients}
            onUpdate={fetchData}
            showToast={showToast}
            askConfirm={askConfirm}
          />
        )}
        {activeTab === "stats" && (
          <StatsView
            stats={stats}
            onNavigateToInvoices={(month) => {
              setAllInvoicesTabMonth(month);
              setActiveTab("all-invoices");
            }}
          />
        )}
        {activeTab === "reports" && (
          <ReportsView
            stays={stays}
            onUpdate={fetchData}
            settings={settings}
            showToast={showToast}
            askConfirm={askConfirm}
          />
        )}
        {activeTab === "contracts" && (
          <ContractsView
            stays={stays}
            settings={settings}
            onUpdate={fetchData}
            showToast={showToast}
            askConfirm={askConfirm}
          />
        )}
        {activeTab === "all-invoices" && (
          <AllInvoicesView
            settings={settings}
            onUpdate={fetchData}
            stays={stays}
            clients={clients}
            showToast={showToast}
            askConfirm={askConfirm}
            initialMonth={allInvoicesTabMonth}
            onClearInitialMonth={() => setAllInvoicesTabMonth(null)}
            showHiddenMenu={showHiddenBillingMenu}
          />
        )}
        {activeTab === "daily-tracking" && (
          <DailyTrackingView stays={stays} showToast={showToast} askConfirm={askConfirm} />
        )}
        {activeTab === "settings" && (
          <SettingsView
            settings={settings}
            onUpdate={fetchData}
            showToast={showToast}
            askConfirm={askConfirm}
            focusFieldId={focusSettingId}
            onClearFocusField={() => setFocusSettingId(null)}
          />
        )}
      </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDanger={confirmConfig.isDanger}
      />
    </div>
  );
}

const UpcomingStayCard: React.FC<{ stay: Stay; onClick: () => void }> = ({
  stay,
  onClick,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetch(`/api/invoices/${stay.id}`)
      .then((res) => res.json())
      .then((data) => setInvoices(data))
      .catch((err) => console.error(err));
  }, [stay.id]);

  const depositInvoice = invoices.find((inv) => inv.type === "deposit");
  const finalInvoice = invoices.find((inv) => inv.type === "final");
  const today = format(new Date(), "yyyy-MM-dd");

  let isAlert = false;
  let dueDate: Date | null = null;
  const isFullyPaid = finalInvoice && (finalInvoice.status === "paid" || finalInvoice.status === "refunded");

  if (stay.arrival_date && depositInvoice && depositInvoice.reference_total && !isFullyPaid) {
    dueDate = new Date(stay.arrival_date);
    dueDate.setDate(dueDate.getDate() - 7);
    const diffDays = Math.ceil(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24),
    );
    isAlert =
      diffDays <= 7 &&
      depositInvoice.status !== "paid";
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${isAlert ? "border-amber-300 hover:border-amber-400" : isFullyPaid ? "border-emerald-300 hover:border-emerald-400" : "border-[#E5DED2] hover:border-emerald-400"}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <span className="font-semibold text-sm text-stone-900 block truncate">
            {stay.cat_name}
          </span>
          <span className="text-[11px] text-stone-500">
            {stay.owner_name}
            {(stay.cat_age || stay.cat_birth_date) &&
              ` · ${stay.cat_age || calculateAge(stay.cat_birth_date || "")}`}
          </span>
        </div>
        <span className="text-[11px] font-mono font-semibold bg-[#EFF4F0] text-emerald-800 px-2 py-0.5 rounded-md shrink-0 tabular-nums">
          J-
          {Math.ceil(
            (new Date(stay.arrival_date).getTime() -
              new Date(today).getTime()) /
              (1000 * 60 * 60 * 24),
          )}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-stone-600 pt-1 tabular-nums">
        <span>
          Arrivée :{" "}
          <strong className="font-semibold text-stone-800">
            {format(new Date(stay.arrival_date), "dd/MM/yyyy")}
          </strong>
        </span>
        <span
          className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${getBoxBadgeClasses(stay.box_number)}`}
        >
          Box {stay.box_number}
        </span>
      </div>
      {isFullyPaid ? (
        <div className="mt-1 pt-2 border-t border-emerald-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 size={13} />
          <span>Séjour réglé dans son intégralité</span>
        </div>
      ) : depositInvoice && depositInvoice.reference_total && dueDate ? (
        <div className="mt-1 pt-2 border-t border-[#EEE8DC] flex flex-col gap-0.5 tabular-nums">
          <p className="text-[11px] text-stone-600">
            Total séjour :{" "}
            <span className="font-semibold text-stone-800">
              {depositInvoice.reference_total.toFixed(2)} €
            </span>{" "}
            · Reste :{" "}
            <span className="font-semibold text-stone-800">
              {(depositInvoice.reference_total - depositInvoice.amount).toFixed(
                2,
              )}{" "}
              €
            </span>
          </p>
          <p
            className={`text-[11px] font-semibold ${isAlert ? "text-amber-700" : "text-stone-500"}`}
          >
            Échéance solde : {format(dueDate, "dd/MM/yyyy")}
          </p>
        </div>
      ) : null}
    </div>
  );
};

function StaysView({
  stays,
  cats,
  onUpdate,
  settings,
  showToast,
  askConfirm,
  onConfigureBanner,
}: {
  stays: Stay[];
  cats: Cat[];
  onUpdate: () => void;
  settings: Settings;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
  onConfigureBanner?: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [bannerImgError, setBannerImgError] = useState(false);

  useEffect(() => {
    setBannerImgError(false);
  }, [settings.stays_banner_url]);

  useEffect(() => {
    if (selectedStay) {
      const updatedStay = stays.find((s) => s.id === selectedStay.id);
      if (updatedStay) {
        setSelectedStay(updatedStay);
      }
    }
  }, [stays]);
  const [formData, setFormData] = useState({
    cat_id: "",
    box_number: 1,
    arrival_date: format(new Date(), "yyyy-MM-dd"),
    arrival_time: "14:00",
    planned_departure: "",
    departure_time: "11:00",
    comments: "",
    is_forced: false,
  });
  const [status, setStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));

  const totalBoxes = parseInt(settings.total_boxes || "3");
  const boxOptions = Array.from({ length: totalBoxes }, (_, i) => i + 1);

  const isStayArchived = (s: Stay) =>
    s.is_archived === true ||
    s.is_archived === 1 ||
    String(s.is_archived) === "1";

  // For the main list, we show stays of the selected month.
  // We'll also show a toggle to see ALL active stays.
  const [showAllActive, setShowAllActive] = useState(false);
  const filteredStays = stays.filter(
    (s) =>
      !isStayArchived(s) &&
      (showAllActive ||
        (s.arrival_date && s.arrival_date.startsWith(filterMonth))),
  );

  // For the calendar, it MUST be filtered by month
  const calendarStays = stays.filter(
    (s) =>
      s.arrival_date &&
      s.arrival_date.startsWith(filterMonth) &&
      !isStayArchived(s),
  );

  const isBoxAvailable = (
    box: number,
    arrival: string,
    departure: string,
    arrivalTime: string = "14:00",
    departureTime: string = "11:00",
    excludeStayId?: string,
  ) => {
    return !stays.some((s) => {
      if (s.id === excludeStayId) return false;
      if (s.box_number !== box) return false;
      if (isStayArchived(s)) return false;

      const sArrival = new Date(
        `${s.arrival_date}T${s.arrival_time || "14:00"}`,
      );
      const sDeparture = new Date(
        `${s.actual_departure || s.planned_departure}T${s.departure_time || "11:00"}`,
      );
      const newArrival = new Date(`${arrival}T${arrivalTime}`);
      const newDeparture = new Date(`${departure}T${departureTime}`);

      return newArrival < sDeparture && newDeparture > sArrival;
    });
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cat_id) {
      showToast("Veuillez sélectionner un chat", "error");
      return;
    }
    if (!formData.planned_departure) {
      showToast("Veuillez indiquer une date de départ prévue", "error");
      return;
    }

    if (
      !formData.is_forced &&
      !isBoxAvailable(
        formData.box_number,
        formData.arrival_date,
        formData.planned_departure,
        formData.arrival_time,
        formData.departure_time,
      )
    ) {
      showToast(
        "Attention: Le box est déjà occupé sur cette plage horaire. Cochez 'Forcer l'attribution' pour passer outre.",
        "error",
      );
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    setStatus("Enregistrement...");
    try {
      const response = await fetch("/api/stays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(errorData.error || response.statusText);
      }

      setStatus("Succès !");
      showToast("Séjour enregistré avec succès !");
      setIsAdding(false);
      setFormData({
        cat_id: "",
        box_number: 1,
        arrival_date: format(new Date(), "yyyy-MM-dd"),
        arrival_time: "14:00",
        planned_departure: "",
        departure_time: "11:00",
        comments: "",
        is_forced: false,
      });
      onUpdate();
      // On met à jour le mois de filtrage pour afficher le nouveau séjour
      setFilterMonth(formData.arrival_date.substring(0, 7));
    } catch (error: any) {
      console.error("Save error:", error);
      setStatus("Erreur: " + error.message);
      showToast("Erreur: " + error.message, "error");
    } finally {
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const handleDelete = (id: string) => {
    askConfirm(
      "Supprimer le séjour ?",
      "ATTENTION: Cette action est irréversible. Supprimer définitivement ce séjour et toutes ses données associées (santé, factures, médias) ?",
      async () => {
        setStatus("Suppression en cours...");
        try {
          const res = await fetch(`/api/stays/${id}`, { method: "DELETE" });
          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.error || "Erreur lors de la suppression");
          }

          showToast("Séjour supprimé avec succès !");
          await onUpdate();
        } catch (err: any) {
          console.error("Delete error:", err);
          showToast("ERREUR: " + err.message, "error");
        } finally {
          setStatus("");
        }
      },
      true,
    );
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const upcomingStays = stays
    .filter((s) => s.arrival_date >= today)
    .sort((a, b) =>
      String(a.arrival_date || "").localeCompare(String(b.arrival_date || "")),
    );
  const currentlyHosted = stays.filter(
    (s) =>
      !isStayArchived(s) &&
      s.arrival_date <= today &&
      (s.actual_departure || s.planned_departure) >= today,
  ).length;

  return (
    <div className="space-y-4">
      {/* Boutique Hotel Overview Banner */}
      <section className="bg-white rounded-2xl border border-[#E5DED2] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-amber-700 tracking-wide">
              Vue d'ensemble · {settings.company_name || "Chat'Hotel"}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-[#18221D] text-balance">
              Accueil & Suites Félines
            </h2>
            <p className="text-xs sm:text-[13px] text-stone-600 max-w-xl">
              Suivez les pensionnaires présents, préparez les prochaines arrivées
              et gérez chaque séjour en un clic.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2.5 border-t border-[#EEE8DC]">
            <div>
              <p className="text-[11px] text-stone-500">Présents aujourd'hui</p>
              <p className="text-xl font-bold text-[#13382C] tabular-nums mt-0.5">
                {currentlyHosted}
                <span className="text-xs font-normal text-stone-400">
                  /{totalBoxes}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-stone-500">Arrivées à venir</p>
              <p className="text-xl font-bold text-amber-700 tabular-nums mt-0.5">
                {upcomingStays.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-stone-500">Séjours affichés</p>
              <p className="text-xl font-bold text-stone-800 tabular-nums mt-0.5">
                {filteredStays.length}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[140px] lg:max-h-[175px] bg-[#FAF6EE]">
          {(settings.stays_banner_url || "").trim() && !bannerImgError ? (
            <div className="relative w-full h-full min-h-[140px] group bg-[#13382C]">
              <img
                src={(settings.stays_banner_url || "").trim()}
                alt="Suites et espaces de repos de la pension Chat'Hotel"
                referrerPolicy="no-referrer"
                onError={() => setBannerImgError(true)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#13382C]/65 via-transparent to-transparent lg:bg-gradient-to-r lg:from-white/15 lg:to-transparent pointer-events-none" />
              {onConfigureBanner && (
                <button
                  type="button"
                  onClick={onConfigureBanner}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/55 hover:bg-black/75 text-white text-[11px] font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                  title="Modifier le lien de l'image"
                >
                  <ImageIcon size={12} />
                  <span>Modifier</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onConfigureBanner}
              className="w-full h-full min-h-[140px] p-3.5 bg-[#FAF6EE] hover:bg-[#F3ECE0] border-t lg:border-t-0 lg:border-l border-[#E5DED2] flex items-center justify-center transition-colors group cursor-pointer"
              title="Configurer le lien de l'image dans Configuration"
            >
              <div className="w-full h-full min-h-[110px] rounded-xl border-2 border-dashed border-[#D5C9B6] group-hover:border-[#13382C]/50 flex flex-col items-center justify-center gap-1.5 px-4 py-3 text-center transition-colors">
                <div className="w-8 h-8 rounded-full bg-white border border-[#E5DED2] shadow-xs flex items-center justify-center text-[#13382C] group-hover:scale-105 transition-transform">
                  <ImageIcon size={16} />
                </div>
                <span className="text-xs font-semibold text-[#18221D]">
                  {bannerImgError
                    ? "Image inaccessible · Cliquer pour modifier"
                    : "Cliquer pour ajouter une image"}
                </span>
                <span className="text-[11px] text-stone-500">
                  Configurer via un lien dans Configuration
                </span>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Upcoming Stays Section */}
      {upcomingStays.length > 0 && (
        <section className="bg-[#FBF6EB] p-4 rounded-2xl border border-[#EFE2C6]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Calendar size={15} />
              </div>
              <h3 className="font-display text-base font-semibold text-stone-900">
                Prochains séjours à venir
              </h3>
            </div>
            <span className="text-xs font-medium text-amber-800 tabular-nums">
              {upcomingStays.length} réservation
              {upcomingStays.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingStays.slice(0, 6).map((stay) => (
              <UpcomingStayCard
                key={stay.id}
                stay={stay}
                onClick={() => {
                  setFilterMonth(stay.arrival_date.substring(0, 7));
                  setSelectedStay(stay);
                  setTimeout(() => {
                    document
                      .getElementById(`stay-card-${stay.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}
              />
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
            Suivi des Séjours
          </h2>
          <p className="text-xs text-stone-500">
            {showAllActive
              ? "Affichage de tous les séjours actifs"
              : `Séjours de ${format(new Date(filterMonth + "-01"), "MMMM yyyy", { locale: fr })}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="show-all"
            className="flex items-center gap-2 bg-[#FAF8F4] px-2.5 py-1.5 border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-700 cursor-pointer hover:bg-stone-100 transition-colors"
          >
            <input
              type="checkbox"
              id="show-all"
              checked={showAllActive}
              onChange={(e) => setShowAllActive(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-700 focus:ring-emerald-600 border-stone-300 rounded"
            />
            <span>Tout voir</span>
          </label>
          <button
            onClick={() => {
              setFilterMonth(format(new Date(), "yyyy-MM"));
              setShowAllActive(false);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors whitespace-nowrap"
          >
            Ce mois-ci
          </button>
          <input
            type="month"
            className={`flex-1 sm:flex-initial px-2.5 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs font-medium ${showAllActive ? "opacity-50 pointer-events-none" : ""}`}
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
          <button
            onClick={() => {
              setIsAdding(true);
              setFormData({
                cat_id: cats[0]?.id || "",
                box_number: 1,
                arrival_date: format(new Date(), "yyyy-MM-dd"),
                arrival_time: "14:00",
                planned_departure: "",
                departure_time: "11:00",
                comments: "",
                is_forced: false,
              });
            }}
            className="flex-1 sm:flex-initial bg-[#13382C] text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#0E2B22] transition-colors text-xs font-semibold shadow-sm whitespace-nowrap"
          >
            <Plus size={15} /> Nouveau Séjour
          </button>
        </div>
      </div>

      {status && (
        <div
          className={`p-2.5 rounded-lg text-xs font-bold ${status.startsWith("Erreur") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {status}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2]">
          <h3 className="font-display text-base font-semibold text-stone-900 mb-3">
            Nouveau séjour
          </h3>
          <form
            onSubmit={onFormSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-500 uppercase">
                Chat
              </label>
              <select
                required
                className="w-full p-2 text-sm bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                value={formData.cat_id}
                onChange={(e) =>
                  setFormData({ ...formData, cat_id: e.target.value })
                }
              >
                <option value="">Sélectionner un chat</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.owner_name})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Box
              </label>
              <select
                className="w-full p-2.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                value={formData.box_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    box_number: parseInt(e.target.value),
                  })
                }
              >
                {boxOptions.map((box) => {
                  const available = isBoxAvailable(
                    box,
                    formData.arrival_date,
                    formData.planned_departure,
                    formData.arrival_time,
                    formData.departure_time,
                  );
                  return (
                    <option
                      key={box}
                      value={box}
                      className={available ? "" : "text-stone-300"}
                    >
                      Box {box} {!available && "(Occupé ou Turnover)"}
                    </option>
                  );
                })}
              </select>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="force-box"
                  checked={formData.is_forced}
                  onChange={(e) =>
                    setFormData({ ...formData, is_forced: e.target.checked })
                  }
                />
                <label
                  htmlFor="force-box"
                  className="text-xs font-semibold text-rose-600 cursor-pointer"
                >
                  Forcer l'attribution (ex: 2 chats même box)
                </label>
              </div>
              {boxOptions.every(
                (box) =>
                  !isBoxAvailable(
                    box,
                    formData.arrival_date,
                    formData.planned_departure,
                    formData.arrival_time,
                    formData.departure_time,
                  ),
              ) &&
                !formData.is_forced && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    Aucun box libre sur cette plage horaire.
                  </p>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase">
                  Date Arrivée
                </label>
                <input
                  type="date"
                  required
                  className="w-full p-2.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none tabular-nums"
                  value={formData.arrival_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, arrival_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase">
                  Heure
                </label>
                <input
                  type="time"
                  className="w-full p-2.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none tabular-nums"
                  value={formData.arrival_time || "14:00"}
                  onChange={(e) =>
                    setFormData({ ...formData, arrival_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase">
                  Date Départ Prévu
                </label>
                <input
                  type="date"
                  required
                  className="w-full p-2.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none tabular-nums"
                  value={formData.planned_departure || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      planned_departure: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase">
                  Heure
                </label>
                <input
                  type="time"
                  className="w-full p-2.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none tabular-nums"
                  value={formData.departure_time || "11:00"}
                  onChange={(e) =>
                    setFormData({ ...formData, departure_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Commentaires
              </label>
              <textarea
                className="w-full p-2.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-xl focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none h-24"
                value={formData.comments || ""}
                onChange={(e) =>
                  setFormData({ ...formData, comments: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-stone-500 hover:text-stone-800 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {filteredStays.map((stay) => {
          const isFinished =
            (stay.actual_departure || stay.planned_departure) < today;
          const ageDisplay =
            stay.cat_age ||
            (stay.cat_birth_date ? calculateAge(stay.cat_birth_date) : "");

          return (
            <div
              key={stay.id}
              id={`stay-card-${stay.id}`}
              className={`bg-white p-4 rounded-2xl border transition-all duration-150 ${selectedStay?.id === stay.id ? "border-emerald-700 ring-2 ring-emerald-700/15 shadow-md" : "border-[#E5DED2] shadow-sm hover:border-stone-300"}`}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center shrink-0 font-mono ${getBoxBadgeClasses(stay.box_number)}`}
                  >
                    <span className="text-[8px] uppercase font-semibold leading-none opacity-75">
                      Box
                    </span>
                    <span className="text-sm font-bold leading-tight tabular-nums">
                      {stay.box_number}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <h3 className="font-display font-semibold text-base text-stone-900">
                        {stay.cat_name}
                      </h3>
                      {isFinished && (
                        <span className="text-[11px] font-medium text-stone-400">
                          · Séjour terminé
                        </span>
                      )}
                    </div>
                    <p className="text-stone-500 text-xs truncate">
                      {stay.owner_name}
                      {stay.cat_species ? ` · ${stay.cat_species}` : ""}
                      {ageDisplay ? ` · ${ageDisplay}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="md:text-right tabular-nums">
                    <p className="text-[10px] font-medium text-stone-400">
                      Période du séjour
                    </p>
                    <p className="text-[13px] font-semibold text-stone-800">
                      {formatDateSafe(stay.arrival_date)}{" "}
                      <span className="text-stone-400 font-normal text-[11px]">
                        ({stay.arrival_time || "14:00"})
                      </span>
                      <span className="mx-1 text-emerald-700">→</span>
                      {formatDateSafe(
                        stay.actual_departure || stay.planned_departure,
                      )}{" "}
                      <span className="text-stone-400 font-normal text-[11px]">
                        ({stay.departure_time || "11:00"})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setSelectedStay(
                          selectedStay?.id === stay.id ? null : stay,
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        selectedStay?.id === stay.id
                          ? "bg-[#13382C] text-white"
                          : "bg-[#F4F0E8] text-stone-800 hover:bg-[#EAE3D5]"
                      }`}
                    >
                      {selectedStay?.id === stay.id ? "Fermer" : "Gérer"}
                    </button>
                    <button
                      onClick={() => handleDelete(stay.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer le séjour"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {selectedStay?.id === stay.id && (
                <div className="mt-4 pt-4 border-t border-[#EEE8DC] grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HealthSection
                    stay={stay}
                    onUpdate={onUpdate}
                    showToast={showToast}
                    askConfirm={askConfirm}
                  />
                  <MediaSection
                    stay={stay}
                    showToast={showToast}
                    askConfirm={askConfirm}
                  />
                  <InvoiceSection
                    stay={stay}
                    settings={settings}
                    showToast={showToast}
                    askConfirm={askConfirm}
                    onUpdate={onUpdate}
                  />
                  <StayDetailsSection
                    stay={stay}
                    onUpdate={onUpdate}
                    settings={settings}
                    stays={stays}
                    showToast={showToast}
                    askConfirm={askConfirm}
                  />
                </div>
              )}
            </div>
          );
        })}
        {filteredStays.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-[#E5DED2] border-dashed text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4F0] text-emerald-800 flex items-center justify-center mx-auto">
              <Calendar size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-stone-800">
                Aucun séjour trouvé pour cette période
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Changez de mois ou affichez tous les séjours actifs.
              </p>
            </div>
            <div className="flex justify-center gap-2.5">
              <button
                onClick={() => setShowAllActive(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#F4F0E8] text-stone-700 font-semibold text-xs hover:bg-[#EAE3D5] transition-colors"
              >
                Tout voir
              </button>
              <button
                onClick={() => setFilterMonth(format(new Date(), "yyyy-MM"))}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition-colors"
              >
                Mois actuel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthSection({
  stay,
  onUpdate,
  showToast,
  askConfirm,
}: {
  stay: Stay;
  onUpdate: () => void;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
  const initialForm = {
    date: format(new Date(), "yyyy-MM-dd"),
    ate_well: true,
    abnormal_behavior: false,
    medication: "",
    incident: "",
    comments: "",
  };
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (editingLog) {
      setIsAdding(false);
      setFormData({
        date: editingLog.date,
        ate_well: editingLog.ate_well,
        abnormal_behavior: editingLog.abnormal_behavior,
        medication: editingLog.medication || "",
        incident: editingLog.incident || "",
        comments: editingLog.comments || "",
      });
    } else if (isAdding) {
      setFormData(initialForm);
    }
  }, [editingLog, isAdding]);

  useEffect(() => {
    fetchLogs();
  }, [stay.id]);

  const fetchLogs = async () => {
    const res = await fetch(`/api/health-logs/${stay.id}`);
    const data = await res.json();
    // Convert 0/1 to boolean
    setLogs(
      data.map((l: any) => ({
        ...l,
        ate_well: l.ate_well === 1,
        abnormal_behavior: l.abnormal_behavior === 1,
      })),
    );
  };

  const handleSave = async () => {
    setStatus("Enregistrement...");
    try {
      const url = editingLog
        ? `/api/health-logs/${editingLog.id}`
        : "/api/health-logs";
      const method = editingLog ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, stay_id: stay.id }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(errorData.error || response.statusText);
      }

      setStatus("Succès !");
      showToast("Suivi de santé enregistré !");
      setIsAdding(false);
      setEditingLog(null);
      setFormData(initialForm);
      await fetchLogs();
      onUpdate(); // Refresh parent to update the "Latest Health" section
    } catch (error: any) {
      console.error("Save error:", error);
      setStatus("Erreur: " + error.message);
      showToast("Erreur: " + error.message, "error");
    } finally {
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const handleDelete = (id: string) => {
    askConfirm(
      "Supprimer le suivi ?",
      "Supprimer définitivement ce suivi de santé ?",
      async () => {
        try {
          const res = await fetch(`/api/health-logs/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erreur lors de la suppression");
          }
          showToast("Suivi supprimé !");
          await fetchLogs();
        } catch (err: any) {
          showToast("Erreur: " + err.message, "error");
        }
      },
      true,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-bold flex items-center gap-2">
          <HeartPulse size={18} className="text-red-500" /> Suivi de Santé
        </h4>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) setFormData(initialForm);
          }}
          className="text-emerald-600 text-sm font-bold flex items-center gap-1"
        >
          <Plus size={16} /> Ajouter un suivi
        </button>
      </div>

      {status && (
        <div
          className={`p-2 rounded text-[10px] font-bold ${status.startsWith("Erreur") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {status}
        </div>
      )}

      {isAdding || editingLog ? (
        <div className="bg-stone-50 p-4 rounded-xl space-y-3 border border-stone-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.ate_well}
                onChange={(e) =>
                  setFormData({ ...formData, ate_well: e.target.checked })
                }
              />
              <label className="text-sm">A bien mangé</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.abnormal_behavior}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    abnormal_behavior: e.target.checked,
                  })
                }
              />
              <label className="text-sm">Comportement anormal</label>
            </div>
          </div>
          <input
            type="date"
            className="w-full p-2 text-sm border border-stone-200 rounded-lg"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <input
            placeholder="Médicament (sur ordonnance)"
            className="w-full p-2 text-sm border border-stone-200 rounded-lg"
            value={formData.medication}
            onChange={(e) =>
              setFormData({ ...formData, medication: e.target.value })
            }
          />
          <input
            placeholder="Incident particulier"
            className="w-full p-2 text-sm border border-stone-200 rounded-lg"
            value={formData.incident}
            onChange={(e) =>
              setFormData({ ...formData, incident: e.target.value })
            }
          />
          <textarea
            placeholder="Commentaires"
            className="w-full p-2 text-sm border border-stone-200 rounded-lg h-20"
            value={formData.comments}
            onChange={(e) =>
              setFormData({ ...formData, comments: e.target.value })
            }
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingLog(null);
              }}
              className="text-xs font-bold text-stone-500"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3 bg-white border border-stone-100 rounded-xl text-sm group relative"
          >
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-400">{log.date}</span>
                <span className="text-[10px] text-stone-300 font-bold">
                  ID: {log.id}
                </span>
              </div>
              <div className="flex gap-2">
                {log.ate_well && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                    MANGÉ
                  </span>
                )}
                {log.abnormal_behavior && (
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                    ANORMAL
                  </span>
                )}
              </div>
            </div>
            {log.medication && (
              <p className="text-xs text-stone-600 mb-1">💊 {log.medication}</p>
            )}
            {log.incident && (
              <p className="text-xs text-red-600 font-medium mb-1">
                ⚠️ {log.incident}
              </p>
            )}
            <p className="text-stone-500 italic">{log.comments}</p>

            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingLog(log)}
                className="p-1 text-stone-400 hover:text-emerald-600"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDelete(log.id)}
                className="p-1 text-stone-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaSection({
  stay,
  showToast,
  askConfirm,
}: {
  stay: Stay;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [stay.id]);

  const fetchMedia = async () => {
    const res = await fetch(`/api/media/${stay.id}`);
    setMedia(await res.json());
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/media/${stay.id}`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Erreur lors du téléchargement");
      }
      fetchMedia();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
  } as any);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    onDrop(Array.from(e.target.files));
  };

  const handleDelete = (id: string) => {
    askConfirm(
      "Supprimer le média ?",
      "Supprimer définitivement ce média ?",
      async () => {
        try {
          const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erreur lors de la suppression");
          }
          showToast("Média supprimé !");
          await fetchMedia();
        } catch (err: any) {
          showToast("Erreur: " + err.message, "error");
        }
      },
      true,
    );
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold flex items-center gap-2">
        <Camera size={18} className="text-blue-500" /> Photos & Vidéos
      </h4>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${isDragActive ? "border-emerald-500 bg-emerald-50" : "border-stone-200 hover:border-emerald-400"}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto text-stone-400 mb-2" size={24} />
        <p className="text-xs text-stone-500 font-medium">
          Glissez-déposez ou cliquez pour ajouter
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*"
        />
        {uploading && (
          <p className="text-xs text-emerald-600 font-bold mt-2">
            Téléchargement...
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {media.map((m) => (
          <div
            key={m.id}
            className="relative aspect-square group rounded-lg overflow-hidden border border-stone-200"
          >
            {m.type === "image" ? (
              <img
                src={m.url}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-stone-900 flex items-center justify-center text-white">
                <Film size={24} />
              </div>
            )}
            <button
              onClick={() => handleDelete(m.id)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceSection({
  stay,
  settings,
  showToast,
  askConfirm,
  onUpdate,
}: {
  stay: Stay;
  settings: Settings;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
  onUpdate: () => void;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    amount: 0,
    service_type: "Pension complète",
    arrival_date: stay.arrival_date,
    departure_date: stay.actual_departure || stay.planned_departure,
    type: "standard" as "standard" | "deposit" | "final",
    status: "draft" as InvoiceStatus,
    payment_method: "",
    deposit_amount: 0,
    related_invoice_number: "",
    created_at: format(new Date(), "yyyy-MM-dd"),
  });
  const [status, setStatus] = useState("");
  const [calcTotal, setCalcTotal] = useState(0);
  const [calcPercent, setCalcPercent] = useState(
    Number(settings.default_down_payment_percentage) || 30,
  );

  useEffect(() => {
    fetchInvoices();
  }, [stay.id]);

  const fetchInvoices = async () => {
    const res = await fetch(`/api/invoices/${stay.id}`);
    setInvoices(await res.json());
  };

  const depositInvoices = useMemo(
    () => invoices.filter((inv) => inv.type === "deposit"),
    [invoices],
  );
  const paymentMethods = settings.payment_methods || [
    "CB",
    "Chèque",
    "Espèces",
    "Virement",
  ];

  const handleSave = async () => {
    setStatus("Génération...");
    try {
      const url = editingInvoice
        ? `/api/invoices/${editingInvoice.id}`
        : "/api/invoices";
      const method = editingInvoice ? "PUT" : "POST";

      const payload = {
        ...formData,
        stay_id: stay.id,
        owner_name: stay.owner_name,
        cat_name: stay.cat_name,
        reference_total: formData.type === "deposit" ? calcTotal : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(errorData.error || response.statusText);
      }

      setStatus("Succès !");
      showToast(editingInvoice ? "Facture modifiée !" : "Facture générée !");
      setIsAdding(false);
      setEditingInvoice(null);
      onUpdate(); // Update central stats if needed
      fetchInvoices();
    } catch (error: any) {
      console.error("Save error:", error);
      setStatus("Erreur: " + error.message);
      showToast("Erreur: " + error.message, "error");
    } finally {
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const generatePDF = (invoice: Invoice) => {
    try {
      const doc = new jsPDF();

      // Header - Company Info
      // ... (rest of PDF logic is the same, just keep it or update slightly if needed to show status)
      // Actually, let's update it to show status and payment method on PDF

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(settings.company_name || "LA PENSION DU CHEMIN VERT", 20, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      let yPos = 25;
      if (settings.company_owner) {
        doc.text(settings.company_owner, 20, yPos);
        yPos += 4;
      }
      if (settings.company_address) {
        doc.text(settings.company_address, 20, yPos);
        yPos += 4;
      }
      if (settings.company_phone) {
        doc.text(settings.company_phone, 20, yPos);
        yPos += 4;
      }
      if (settings.company_email) {
        doc.text(settings.company_email, 20, yPos);
        yPos += 4;
      }
      if (settings.company_siret) {
        doc.text(`SIRET : ${settings.company_siret}`, 20, yPos);
        yPos += 4;
      }
      if (settings.company_acaced) {
        doc.text(`ACACED : ${settings.company_acaced}`, 20, yPos);
        yPos += 4;
      }

      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.setFont("helvetica", "bold");
      const title =
        invoice.type === "deposit" ? "FACTURE D'ACOMPTE" : "FACTURE";
      doc.text(title, 105, 25, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${formatDateSafe(invoice.created_at)}`, 190, 20, {
        align: "right",
      });
      doc.text(`Facture N°: ${invoice.invoice_number || invoice.id}`, 190, 25, {
        align: "right",
      });
      if (invoice.status) {
        const statusConfig = getInvoiceStatusConfig(invoice.status, settings);
        const s = statusConfig;
        doc.setFontSize(9);
        doc.text(`Statut: ${s.label.toUpperCase()}`, 190, 30, {
          align: "right",
        });
      }

      // Client Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("DESTINATAIRE:", 20, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`${stay.owner_name || "Client"}`, 20, 67);
      if (stay.owner_address) doc.text(`${stay.owner_address}`, 20, 74);
      if (stay.owner_phone) doc.text(`${stay.owner_phone}`, 20, 81);
      if (stay.owner_email) doc.text(`${stay.owner_email}`, 20, 88);

      // Animal Info
      doc.setFont("helvetica", "bold");
      doc.text("DÉTAILS SÉJOUR:", 120, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Animal: ${stay.cat_name || "Animal"}`, 120, 67);
      doc.text(
        `Période: ${invoice.arrival_date || stay.arrival_date} au ${invoice.departure_date || stay.actual_departure || stay.planned_departure}`,
        120,
        74,
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Santé de l'animal:", 120, 81);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `Vaccins (TC): ${formatDateSafe(stay.cat_vaccine_tc_date, "___/___/_____")}`,
        120,
        86,
      );
      doc.text(
        `Leucose (L): ${formatDateSafe(stay.cat_vaccine_l_date, "___/___/_____")}`,
        120,
        91,
      );
      doc.text(
        `Parasitaire: ${formatDateSafe(stay.cat_parasite_treatment_date, "___/___/_____")}`,
        120,
        96,
      );

      // Table
      const start = new Date(invoice.arrival_date || stay.arrival_date);
      const end = new Date(
        invoice.departure_date ||
          stay.actual_departure ||
          stay.planned_departure,
      );
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      const rows = [
        [
          invoice.service_type,
          invoice.type === "deposit" ? "1" : diffDays.toString(),
          invoice.type === "deposit"
            ? `${invoice.amount.toFixed(2)} €`
            : `${(invoice.amount / diffDays).toFixed(2)} €`,
          `${invoice.amount.toFixed(2)} €`,
        ],
      ];

      if (invoice.type === "final" && invoice.deposit_amount) {
        rows.push([
          `Acompte (Facture N° ${invoice.related_invoice_number || "-"})`,
          "1",
          `-${invoice.deposit_amount.toFixed(2)} €`,
          `-${invoice.deposit_amount.toFixed(2)} €`,
        ]);
      }

      autoTable(doc, {
        startY: 105,
        head: [["Description", "Quantité", "Prix Unitaire", "Total"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] },
        columnStyles: {
          1: { halign: "center" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 110;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const totalAmount =
        invoice.type === "final"
          ? invoice.amount - (invoice.deposit_amount || 0)
          : invoice.amount;

      let nextY = finalY + 15;

      if (invoice.type === "deposit" && invoice.reference_total) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Montant total du séjour : ${invoice.reference_total.toFixed(2)} €`,
          190,
          nextY,
          { align: "right" },
        );
        nextY += 7;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL ACOMPTE : ${invoice.amount.toFixed(2)} €`, 190, nextY, {
          align: "right",
        });
        nextY += 7;

        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Reste à payer (à la fin du séjour) : ${(invoice.reference_total - invoice.amount).toFixed(2)} €`,
          190,
          nextY,
          { align: "right" },
        );
        nextY += 10;
      } else {
        doc.text(`TOTAL : ${totalAmount.toFixed(2)} €`, 190, nextY, {
          align: "right",
        });
        nextY += 10;
      }

      if (invoice.payment_method) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Moyen de paiement: ${invoice.payment_method}`, 20, nextY);
      }

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("TVA non applicable, art. 293 B du CGI", 105, 280, {
        align: "center",
      });

      doc.save(
        `Facture_${stay.cat_name || "Animal"}_${invoice.invoice_number || invoice.id}.pdf`,
      );
    } catch (err: any) {
      console.error("PDF Generation error:", err);
      showToast("Erreur lors de la génération du PDF: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-bold flex items-center gap-2">
          <FileText size={18} className="text-emerald-500" /> Facturation
        </h4>
        {!isAdding && !editingInvoice && (
          <button
            onClick={() => {
              setIsAdding(true);
              setFormData({
                amount: 0,
                service_type: "Pension complète",
                arrival_date: stay.arrival_date,
                departure_date: stay.actual_departure || stay.planned_departure,
                type: "standard",
                status: "draft",
                payment_method: "",
                deposit_amount: 0,
                related_invoice_number: "",
                created_at: format(new Date(), "yyyy-MM-dd"),
              });
            }}
            className="text-emerald-600 text-sm font-bold flex items-center gap-1"
          >
            <Plus size={16} /> Créer facture
          </button>
        )}
      </div>

      {status && (
        <div
          className={`p-2 rounded text-[10px] font-bold ${status.startsWith("Erreur") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {status}
        </div>
      )}

      {(isAdding || editingInvoice) && (
        <div className="bg-stone-50 p-4 rounded-xl space-y-3 border border-stone-200">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Type
              </label>
              <select
                className="w-full p-2 text-sm border border-stone-200 rounded-lg bg-white"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
              >
                <option value="standard">Standard</option>
                <option value="deposit">Acompte</option>
                <option value="final">Finale</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Statut
              </label>
              <select
                className="w-full p-2 text-sm border border-stone-200 rounded-lg bg-white"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
              >
                {Object.entries(
                  settings.invoice_statuses || DEFAULT_INVOICE_STATUS_LABELS,
                ).map(([val, config]) => (
                  <option key={val} value={val}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Prestation
              </label>
              <input
                placeholder="Ex: Pension complète"
                className="w-full p-2 text-sm border border-stone-200 rounded-lg"
                value={formData.service_type}
                onChange={(e) =>
                  setFormData({ ...formData, service_type: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Mode de paiement
              </label>
              <select
                className="w-full p-2 text-sm border border-stone-200 rounded-lg bg-white"
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
              >
                <option value="">-- Sélectionner --</option>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">
              Date de facturation
            </label>
            <input
              type="date"
              className="w-full p-2 text-sm border border-stone-200 rounded-lg bg-white"
              value={formData.created_at}
              onChange={(e) =>
                setFormData({ ...formData, created_at: e.target.value })
              }
            />
          </div>

          {formData.type === "deposit" && (
            <div className="grid grid-cols-2 gap-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-700 uppercase">
                  Montant Total de réf.
                </label>
                <input
                  type="number"
                  className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white"
                  value={calcTotal || ""}
                  onChange={(e) => {
                    const total = parseFloat(e.target.value) || 0;
                    setCalcTotal(total);
                    setFormData({
                      ...formData,
                      amount: parseFloat(
                        ((total * calcPercent) / 100).toFixed(2),
                      ),
                    });
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-700 uppercase">
                  Acompte %
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white"
                    value={calcPercent}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      setCalcPercent(pct);
                      setFormData({
                        ...formData,
                        amount: parseFloat(
                          ((calcTotal * pct) / 100).toFixed(2),
                        ),
                      });
                    }}
                  />
                  <span className="font-bold text-indigo-700">%</span>
                </div>
              </div>
              <p className="col-span-2 text-[9px] text-indigo-500 italic mt-1">
                Saisir le total et le % pour calculer l'acompte automatiquement
                below.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">
              {formData.type === "deposit"
                ? "Montant de l'acompte"
                : "Montant Total"}
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full p-2 text-sm border border-stone-200 rounded-lg"
                value={isNaN(formData.amount) ? "" : formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value),
                  })
                }
              />
              <span className="absolute right-3 top-2 text-stone-300 pointer-events-none">
                €
              </span>
            </div>
          </div>

          {formData.type === "final" && depositInvoices.length > 0 && (
            <div className="space-y-1 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
              <label className="text-[10px] font-bold text-emerald-700 uppercase">
                Déduire un acompte
              </label>
              <select
                className="w-full p-2 text-sm border border-emerald-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-stone-700"
                onChange={(e) => {
                  const inv = depositInvoices.find(
                    (i) => i.id === e.target.value,
                  );
                  if (inv) {
                    setFormData({
                      ...formData,
                      deposit_amount: inv.amount,
                      related_invoice_number: inv.invoice_number,
                      amount: inv.reference_total || formData.amount,
                    });
                  } else {
                    setFormData({
                      ...formData,
                      deposit_amount: 0,
                      related_invoice_number: "",
                      amount: 0,
                    });
                  }
                }}
              >
                <option value="">-- Sélectionner l'acompte --</option>
                {depositInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    Facture {inv.invoice_number} ({inv.amount}€)
                  </option>
                ))}
              </select>
              {formData.deposit_amount > 0 && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-emerald-100 text-[10px] font-medium text-emerald-700 shadow-sm">
                  <div className="flex justify-between">
                    <span>Acompte déduit :</span>
                    <span className="font-bold text-red-500">
                      -{formData.deposit_amount.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-emerald-50 mt-1 pt-1 text-sm">
                    <span>RESTE À PAYER :</span>
                    <span>
                      {(formData.amount - formData.deposit_amount).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Du
              </label>
              <input
                type="date"
                className="w-full p-2 text-sm border border-stone-200 rounded-lg"
                value={formData.arrival_date}
                onChange={(e) =>
                  setFormData({ ...formData, arrival_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Au
              </label>
              <input
                type="date"
                className="w-full p-2 text-sm border border-stone-200 rounded-lg"
                value={formData.departure_date}
                onChange={(e) =>
                  setFormData({ ...formData, departure_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingInvoice(null);
              }}
              className="text-xs font-bold text-stone-500"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
            >
              {editingInvoice ? "Modifier" : "Générer la facture"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {invoices.map((inv) => {
          const statusConfig = getInvoiceStatusConfig(inv.status, settings);
          return (
            <div
              key={inv.id}
              className={`flex justify-between items-center p-3 bg-white border border-stone-100 rounded-xl group relative ${inv.type === "deposit" ? "border-l-4 border-l-orange-400" : inv.type === "final" ? "border-l-4 border-l-emerald-600" : ""}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">
                    {inv.type === "final"
                      ? (inv.amount - (inv.deposit_amount || 0)).toFixed(2)
                      : inv.amount.toFixed(2)}{" "}
                    €
                  </p>
                  {inv.type === "deposit" && (
                    <span className="text-[8px] bg-orange-100 text-orange-700 px-1 rounded font-bold uppercase">
                      Acompte
                    </span>
                  )}
                  {inv.type === "final" && (
                    <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold uppercase">
                      Finale
                    </span>
                  )}
                  <span
                    className={`text-[8px] ${statusConfig.bg} ${statusConfig.color} px-1 rounded font-bold uppercase`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 uppercase font-bold flex items-center gap-1">
                  {inv.invoice_number} • {inv.service_type}
                  {inv.payment_method && (
                    <span className="text-stone-500 italic">
                      ({inv.payment_method})
                    </span>
                  )}
                  {inv.related_invoice_number && (
                    <span className="text-emerald-600 ml-1">
                      (Réf: {inv.related_invoice_number})
                    </span>
                  )}
                </p>
                {inv.type === "deposit" && inv.reference_total && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {invoices.some((i) => i.type === "final" && (i.status === "paid" || i.status === "refunded")) ? (
                      <p className="text-[10px] font-bold text-emerald-600">
                        ✓ Séjour réglé dans son intégralité
                      </p>
                    ) : (
                      <>
                        <p className="text-[10px] text-stone-500">
                          <span className="font-semibold">Total séjour:</span> {inv.reference_total.toFixed(2)} € | <span className="font-semibold">Reste à payer:</span> {(inv.reference_total - inv.amount).toFixed(2)} €
                        </p>
                        {(() => {
                          if (!stay.arrival_date) return null;
                          const dueDate = new Date(stay.arrival_date);
                          dueDate.setDate(dueDate.getDate() - 7);
                          const diffDays = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                          const isAlert = diffDays <= 7 && inv.status !== 'paid';
                          return (
                            <p className={`text-[10px] font-bold ${isAlert ? 'text-orange-500' : 'text-stone-500'}`}>
                              Date butoir solde : {format(dueDate, "dd/MM/yyyy")}
                            </p>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  title="Télécharger"
                  onClick={() => generatePDF(inv)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Download size={18} />
                </button>
                <button
                  title="Modifier"
                  onClick={() => {
                    setEditingInvoice(inv);
                    setFormData({
                      amount: inv.amount,
                      service_type: inv.service_type,
                      arrival_date: inv.arrival_date || stay.arrival_date,
                      departure_date:
                        inv.departure_date ||
                        stay.actual_departure ||
                        stay.planned_departure,
                      type: inv.type || "standard",
                      status: inv.status || "draft",
                      payment_method: inv.payment_method || "",
                      deposit_amount: inv.deposit_amount || 0,
                      related_invoice_number: inv.related_invoice_number || "",
                      created_at: inv.created_at,
                    });
                    if (inv.type === "deposit") {
                      setCalcTotal(inv.reference_total || 0);
                      const percent = inv.reference_total
                        ? Math.round((inv.amount / inv.reference_total) * 100)
                        : Number(settings.default_down_payment_percentage) ||
                          30;
                      setCalcPercent(percent);
                    }
                  }}
                  className="p-2 text-stone-400 hover:text-emerald-600"
                >
                  <Edit size={18} />
                </button>
                <button
                  title="Supprimer"
                  onClick={() => {
                    askConfirm(
                      "Supprimer la facture ?",
                      "Supprimer définitivement cette facture ?",
                      async () => {
                        try {
                          const res = await fetch(`/api/invoices/${inv.id}`, {
                            method: "DELETE",
                          });
                          if (!res.ok) {
                            const err = await res.json();
                            throw new Error(
                              err.error || "Erreur lors de la suppression",
                            );
                          }
                          showToast("Facture supprimée !");
                          fetchInvoices();
                          onUpdate();
                        } catch (err: any) {
                          showToast("Erreur: " + err.message, "error");
                        }
                      },
                      true,
                    );
                  }}
                  className="p-2 text-stone-300 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StayDetailsSection({
  stay,
  onUpdate,
  settings,
  stays,
  showToast,
  askConfirm,
}: {
  stay: Stay;
  onUpdate: () => void;
  settings: Settings;
  stays: Stay[];
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    ...stay,
    arrival_time: stay.arrival_time || "14:00",
    departure_time: stay.departure_time || "11:00",
    comments: stay.comments ?? "",
    actual_departure: stay.actual_departure ?? "",
    ate_well: stay.ate_well ?? true,
    abnormal_behavior: stay.abnormal_behavior ?? false,
    medication: stay.medication ?? "",
    incident: stay.incident ?? "",
    health_comments: stay.health_comments ?? "",
  });

  useEffect(() => {
    setFormData({
      ...stay,
      arrival_time: stay.arrival_time || "14:00",
      departure_time: stay.departure_time || "11:00",
      comments: stay.comments ?? "",
      actual_departure: stay.actual_departure ?? "",
      ate_well: stay.ate_well ?? true,
      abnormal_behavior: stay.abnormal_behavior ?? false,
      medication: stay.medication ?? "",
      incident: stay.incident ?? "",
      health_comments: stay.health_comments ?? "",
    });
  }, [stay]);
  const [status, setStatus] = useState("");

  const totalBoxes = parseInt(settings.total_boxes || "3");
  const boxOptions = Array.from({ length: totalBoxes }, (_, i) => i + 1);

  const isBoxAvailable = (
    box: number,
    arrival: string,
    departure: string,
    arrivalTime: string = "14:00",
    departureTime: string = "11:00",
    excludeStayId?: string,
  ) => {
    return !stays.some((s) => {
      if (s.id === excludeStayId) return false;
      if (s.box_number !== box) return false;
      if (
        s.is_archived === true ||
        s.is_archived === 1 ||
        String(s.is_archived) === "1"
      )
        return false;

      const sArrival = new Date(
        `${s.arrival_date}T${s.arrival_time || "14:00"}`,
      );
      const sDeparture = new Date(
        `${s.actual_departure || s.planned_departure}T${s.departure_time || "11:00"}`,
      );
      const newArrival = new Date(`${arrival}T${arrivalTime}`);
      const newDeparture = new Date(`${departure}T${departureTime}`);

      return newArrival < sDeparture && newDeparture > sArrival;
    });
  };

  const handleDelete = (id: string) => {
    askConfirm(
      "Supprimer le séjour ?",
      "ATTENTION: Cette action est irréversible. Supprimer définitivement ce séjour et toutes ses données associées (santé, factures, médias) ?",
      async () => {
        setStatus("Suppression en cours...");
        try {
          const res = await fetch(`/api/stays/${id}`, { method: "DELETE" });
          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.error || "Erreur lors de la suppression");
          }

          showToast("Séjour supprimé avec succès !");
          await onUpdate();
        } catch (err: any) {
          console.error("Delete error:", err);
          showToast("ERREUR: " + err.message, "error");
        } finally {
          setStatus("");
        }
      },
      true,
    );
  };

  const handleUpdate = async () => {
    const departure = formData.actual_departure || formData.planned_departure;
    if (
      !formData.is_forced &&
      !isBoxAvailable(
        formData.box_number,
        formData.arrival_date,
        departure,
        formData.arrival_time,
        formData.departure_time,
        stay.id,
      )
    ) {
      showToast(
        `Le Box ${formData.box_number} est déjà occupé sur cette plage horaire. Cochez 'Forcer l'attribution' pour passer outre.`,
        "error",
      );
      return;
    }

    setStatus("Enregistrement...");
    try {
      const payload = {
        ...formData,
        contract_urls: formData.contract_urls ? formData.contract_urls : null,
      };

      const response = await fetch(`/api/stays/${stay.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(errorData.error || response.statusText);
      }

      setStatus("Succès !");
      showToast("Modifications enregistrées !");
      await onUpdate();
    } catch (error: any) {
      console.error("Save error:", error);
      setStatus("Erreur: " + error.message);
      showToast("Erreur: " + error.message, "error");
    } finally {
      setTimeout(() => setStatus(""), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold flex items-center gap-2">
        <Edit size={18} className="text-stone-500" /> Détails du Séjour
      </h4>

      {status && (
        <div
          className={`p-2 rounded text-[10px] font-bold ${status.startsWith("Erreur") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">
              Date Arrivée
            </label>
            <input
              type="date"
              className="w-full p-2 text-sm border border-stone-200 rounded-lg"
              value={formData.arrival_date || ""}
              onChange={(e) =>
                setFormData({ ...formData, arrival_date: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">
              Heure
            </label>
            <input
              type="time"
              className="w-full p-2 text-sm border border-stone-200 rounded-lg"
              value={formData.arrival_time || "14:00"}
              onChange={(e) =>
                setFormData({ ...formData, arrival_time: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">
              Date Départ Prévu
            </label>
            <input
              type="date"
              className="w-full p-2 text-sm border border-stone-200 rounded-lg"
              value={formData.planned_departure || ""}
              onChange={(e) =>
                setFormData({ ...formData, planned_departure: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">
              Heure
            </label>
            <input
              type="time"
              className="w-full p-2 text-sm border border-stone-200 rounded-lg"
              value={formData.departure_time || "11:00"}
              onChange={(e) =>
                setFormData({ ...formData, departure_time: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase">
            Départ Réel
          </label>
          <input
            type="date"
            className="w-full p-2 text-sm border border-stone-200 rounded-lg"
            value={formData.actual_departure || ""}
            onChange={(e) =>
              setFormData({ ...formData, actual_departure: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase">
            Box
          </label>
          <div className="flex flex-col gap-1">
            <select
              className="w-full p-2 text-sm border border-stone-200 rounded-lg"
              value={formData.box_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  box_number: parseInt(e.target.value),
                })
              }
            >
              {boxOptions.map((box) => (
                <option key={box} value={box}>
                  Box {box}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="force-box-edit"
                checked={formData.is_forced}
                onChange={(e) =>
                  setFormData({ ...formData, is_forced: e.target.checked })
                }
              />
              <label
                htmlFor="force-box-edit"
                className="text-[9px] font-bold text-red-500 uppercase cursor-pointer"
              >
                Forcer l'attribution
              </label>
            </div>
          </div>
        </div>
        <div className="col-span-1 sm:col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase">
            Commentaires Généraux
          </label>
          <textarea
            className="w-full p-2 text-sm border border-stone-200 rounded-lg h-20"
            value={formData.comments}
            onChange={(e) =>
              setFormData({ ...formData, comments: e.target.value })
            }
          />
        </div>

        <div className="col-span-1 sm:col-span-2 pt-4 border-t border-stone-100">
          <h5 className="text-xs font-bold text-emerald-700 uppercase mb-3 flex items-center gap-2">
            <HeartPulse size={14} /> Dernier Suivi Santé
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ate_well"
                checked={formData.ate_well}
                onChange={(e) =>
                  setFormData({ ...formData, ate_well: e.target.checked })
                }
              />
              <label htmlFor="ate_well" className="text-sm text-stone-600">
                Bien mangé ?
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="abnormal_behavior"
                checked={formData.abnormal_behavior}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    abnormal_behavior: e.target.checked,
                  })
                }
              />
              <label
                htmlFor="abnormal_behavior"
                className="text-sm text-stone-600"
              >
                Comportement anormal ?
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Médicament
              </label>
              <input
                type="text"
                placeholder="Ex: 1/2 comprimé matin"
                className="w-full p-2 text-sm border border-stone-200 rounded-lg"
                value={formData.medication}
                onChange={(e) =>
                  setFormData({ ...formData, medication: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Incident Toilettage / Autre
              </label>
              <input
                type="text"
                placeholder="Ex: Petite griffure"
                className="w-full p-2 text-sm border border-stone-200 rounded-lg"
                value={formData.incident}
                onChange={(e) =>
                  setFormData({ ...formData, incident: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">
                Commentaire Santé
              </label>
              <textarea
                placeholder="Détails sur l'état de santé..."
                className="w-full p-2 text-sm border border-stone-200 rounded-lg h-20"
                value={formData.health_comments}
                onChange={(e) =>
                  setFormData({ ...formData, health_comments: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-4 pt-4 border-t border-stone-100">
        <button
          onClick={handleUpdate}
          className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors"
        >
          <Save size={18} /> Enregistrer les modifications
        </button>
        <button
          onClick={() => handleDelete(stay.id)}
          className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          title="Supprimer définitivement"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function ClientsView({
  clients,
  cats,
  stays,
  settings,
  onUpdate,
  showToast,
  askConfirm,
}: {
  clients: Client[];
  cats: Cat[];
  stays: Stay[];
  settings: Settings;
  onUpdate: () => void;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    contact2_name: "",
    contact2_phone: "",
    contact2_email: "",
    contact2_address: "",
  });
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  if (selectedClient) {
    return (
      <ClientDashboard
        client={selectedClient}
        cats={cats}
        stays={stays}
        settings={settings}
        onBack={() => setSelectedClient(null)}
        onUpdate={onUpdate}
        showToast={showToast}
        askConfirm={askConfirm}
      />
    );
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Le nom est obligatoire", "error");
      return;
    }
    handleSave();
  };

  const handleSave = async () => {
    setStatus("Enregistrement...");
    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: "Erreur serveur" }));
        throw new Error(err.error || response.statusText);
      }

      setStatus("Succès !");
      showToast("Client enregistré avec succès !");
      setIsAdding(false);
      setEditingClient(null);
      setFormData({
        name: "",
        address: "",
        email: "",
        phone: "",
        contact2_name: "",
        contact2_phone: "",
        contact2_email: "",
        contact2_address: "",
      });
      onUpdate();
    } catch (error: any) {
      console.error("Save error:", error);
      setStatus("Erreur: " + error.message);
      showToast("Erreur: " + error.message, "error");
    } finally {
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const handleDelete = (id: string) => {
    askConfirm(
      "Supprimer le client ?",
      "ATTENTION: Supprimer un client supprimera également TOUS ses animaux et TOUS leurs séjours associés. Continuer ?",
      async () => {
        try {
          const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erreur lors de la suppression");
          }
          showToast("Client et toutes ses données supprimés !");
          await onUpdate();
        } catch (err: any) {
          showToast("Erreur: " + err.message, "error");
        }
      },
      true,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
            Gestion des Clients
          </h2>
          <p className="text-[11px] text-stone-500 mt-0.5 tabular-nums">
            {clients.length} propriétaire{clients.length > 1 ? "s" : ""} enregistré
            {clients.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              placeholder="Rechercher un client..."
              className="pl-8 pr-3 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs w-full sm:w-52 outline-none focus:bg-white focus:border-emerald-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingClient(null);
              setFormData({
                name: "",
                address: "",
                email: "",
                phone: "",
                contact2_name: "",
                contact2_phone: "",
                contact2_email: "",
                contact2_address: "",
              });
            }}
            className="bg-[#13382C] text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#0E2B22] transition-colors text-xs font-semibold whitespace-nowrap"
          >
            <Plus size={15} /> Nouveau Client
          </button>
        </div>
      </div>

      {status && (
        <div
          className={`p-2.5 rounded-lg text-xs font-bold ${status.startsWith("Erreur") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {status}
        </div>
      )}

      {(isAdding || editingClient) && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-stone-200">
          <form
            onSubmit={onFormSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Nom Complet
              </label>
              <input
                required
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Téléphone
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Email
              </label>
              <input
                type="email"
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Adresse
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            {/* Personne de confiance */}
            <div className="col-span-1 sm:col-span-2 pt-4 pb-2">
              <h4 className="font-bold text-sm text-stone-700">
                Contact de confiance (Optionnel)
              </h4>
              <p className="text-xs text-stone-500">
                Au cas où le contact principal n'est pas joignable.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Nom Complet
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.contact2_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contact2_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Téléphone
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.contact2_phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contact2_phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Email
              </label>
              <input
                type="email"
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.contact2_email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contact2_email: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Adresse
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.contact2_address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contact2_address: e.target.value })
                }
              />
            </div>

            <div className="col-span-2 flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingClient(null);
                }}
                className="px-4 py-2 text-stone-500 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredClients.map((client) => {
          const initials = (client.name || "C")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const clientCatsCount = cats.filter(
            (c) => c.owner_id === client.id,
          ).length;

          return (
            <div
              key={client.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5DED2] hover:border-emerald-400 transition-all duration-150 group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs shrink-0 ${getMonogramClasses(client.name)}`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[15px] text-stone-900 truncate">
                        {client.name}
                      </h3>
                      <p className="text-stone-500 text-[11px] truncate">
                        {client.email || "Aucun e-mail"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => {
                        setEditingClient(client);
                        setFormData({
                          name: client.name || "",
                          address: client.address || "",
                          email: client.email || "",
                          phone: client.phone || "",
                          contact2_name: client.contact2_name || "",
                          contact2_phone: client.contact2_phone || "",
                          contact2_email: client.contact2_email || "",
                          contact2_address: client.contact2_address || "",
                        });
                      }}
                      className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-stone-600 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-stone-400 shrink-0" />
                    <span className="tabular-nums">{client.phone || "-"}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin
                      size={12}
                      className="text-stone-400 shrink-0 mt-0.5"
                    />
                    <span className="line-clamp-2">{client.address || "-"}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(client)}
                className="w-full bg-[#F4F0E8] text-[#13382C] py-2 px-3 rounded-lg text-xs font-semibold hover:bg-[#13382C] hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Ouvrir la fiche client</span>
                <span className="font-mono opacity-75 tabular-nums">
                  {clientCatsCount} animal{clientCatsCount > 1 ? "ux" : ""}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientDashboard({
  client,
  cats,
  stays,
  settings,
  onBack,
  onUpdate,
  showToast,
  askConfirm,
}: {
  client: Client;
  cats: Cat[];
  stays: Stay[];
  settings: Settings;
  onBack: () => void;
  onUpdate: () => void;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const clientCats = cats.filter((c) => c.owner_id === client.id);
  const [activeMenu, setActiveMenu] = useState<
    "overview" | "add_cat" | "add_stay"
  >("overview");

  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [catFormData, setCatFormData] = useState({
    owner_id: client.id,
    name: "",
    species: "Chat",
    breed: "",
    color: "",
    chip_number: "",
    vaccine_tc_date: "",
    vaccine_l_date: "",
    parasite_treatment_date: "",
    birth_date: "",
    age: "",
    comments: "",
  });

  const [stayFormData, setStayFormData] = useState({
    cat_id: "",
    arrival_date: format(new Date(), "yyyy-MM-dd"),
    planned_departure: "",
    box_number: 1,
    comments: "",
  });

  const [status, setStatus] = useState("");
  const boxOptions = Array.from(
    { length: settings.total_boxes ? parseInt(settings.total_boxes) : 3 },
    (_, i) => i + 1,
  );

  const isBoxAvailable = (box: number, start: string, end: string) => {
    if (!start || !end) return true;
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    return !stays.some((stay) => {
      if (stay.box_number !== box) return false;
      const stayStart = new Date(stay.arrival_date).getTime();
      const stayEnd = new Date(
        stay.actual_departure || stay.planned_departure,
      ).getTime();
      return startDate <= stayEnd && endDate >= stayStart;
    });
  };

  const handleEditCatClick = (cat: Cat) => {
    setCatFormData({
      owner_id: cat.owner_id || client.id,
      name: cat.name || "",
      species: cat.species || "Chat",
      breed: cat.breed || "",
      color: cat.color || "",
      chip_number: cat.chip_number || "",
      vaccine_tc_date: cat.vaccine_tc_date || "",
      vaccine_l_date: cat.vaccine_l_date || "",
      parasite_treatment_date: cat.parasite_treatment_date || "",
      birth_date: cat.birth_date || "",
      age: cat.age || "",
      comments: cat.comments || "",
    });
    setEditingCat(cat);
    setActiveMenu("add_cat");
  };

  const handleDeleteCatClick = (id: string) => {
    askConfirm(
      "Supprimer cet animal ?",
      "ATTENTION: Supprimer cet animal supprimera également TOUS ses séjours. Continuer ?",
      async () => {
        try {
          const res = await fetch(`/api/cats/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Erreur de suppression");
          showToast("Animal supprimé.");
          onUpdate();
        } catch (err: any) {
          showToast(err.message, "error");
        }
      },
      true,
    );
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name.trim())
      return showToast("Nom du chat obligatoire", "error");
    setStatus("Enregistrement...");
    try {
      const url = editingCat ? `/api/cats/${editingCat.id}` : "/api/cats";
      const method = editingCat ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catFormData),
      });
      if (!response.ok) throw new Error("Erreur serveur");
      showToast(editingCat ? "Animal modifié" : "Animal ajouté !");
      setCatFormData({
        owner_id: client.id,
        name: "",
        species: "Chat",
        breed: "",
        color: "",
        chip_number: "",
        vaccine_tc_date: "",
        vaccine_l_date: "",
        parasite_treatment_date: "",
        birth_date: "",
        age: "",
        comments: "",
      });
      setEditingCat(null);
      setActiveMenu("overview");
      onUpdate();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setStatus("");
    }
  };

  const handleSaveStay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stayFormData.cat_id) return showToast("Choisir un animal", "error");
    if (!stayFormData.planned_departure)
      return showToast("Date de départ prévue requise", "error");
    if (
      !isBoxAvailable(
        stayFormData.box_number,
        stayFormData.arrival_date,
        stayFormData.planned_departure,
      )
    ) {
      return showToast(
        `Le Box ${stayFormData.box_number} n'est pas disponible.`,
        "error",
      );
    }
    setStatus("Enregistrement...");
    try {
      const response = await fetch("/api/stays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stayFormData),
      });
      if (!response.ok) throw new Error("Erreur serveur");
      showToast("Séjour créé !");
      setStayFormData({
        cat_id: "",
        arrival_date: format(new Date(), "yyyy-MM-dd"),
        planned_departure: "",
        box_number: 1,
        comments: "",
      });
      setActiveMenu("overview");
      onUpdate();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setStatus("");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-stone-600 hover:text-[#13382C] font-medium text-xs transition-colors"
      >
        <ChevronLeft size={16} /> Retour aux clients
      </button>

      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2]">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-display font-semibold text-base shrink-0 ${getMonogramClasses(client.name)}`}
            >
              {client.name?.charAt(0).toUpperCase() || "C"}
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
                {client.name}
              </h2>
              <p className="text-stone-500 text-xs tabular-nums">
                {[client.email, client.phone].filter(Boolean).join(" · ")}
              </p>
              {client.address && (
                <p className="text-stone-500 text-xs mt-0.5">{client.address}</p>
              )}
              {client.contact2_name && (
                <div className="mt-3 p-2.5 bg-[#FAF8F4] rounded-xl border border-[#EDE6DA]">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-0.5">
                    Contact de confiance
                  </span>
                  <p className="text-xs font-semibold text-stone-800">
                    {client.contact2_name}
                  </p>
                  <p className="text-[11px] text-stone-500 tabular-nums">
                    {[client.contact2_phone, client.contact2_email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setActiveMenu("add_cat")}
              className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-emerald-100 transition-colors"
            >
              <Plus size={14} className="inline mr-1" /> Animal
            </button>
            <button
              onClick={() => setActiveMenu("add_stay")}
              className="bg-[#13382C] text-white px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-[#0E2B22] transition-colors"
            >
              <Plus size={14} className="inline mr-1" /> Séjour
            </button>
          </div>
        </div>
      </div>

      {status && (
        <div
          className={`p-3 rounded-lg text-sm font-bold bg-emerald-100 text-emerald-700`}
        >
          {status}
        </div>
      )}

      {activeMenu === "add_cat" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="font-bold text-lg mb-4">
            {editingCat
              ? `Modifier ${editingCat.name}`
              : `Ajouter un animal pour ${client.name}`}
          </h3>
          <form
            onSubmit={handleSaveCat}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Nom de l'animal
              </label>
              <input
                required
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={catFormData.name || ""}
                onChange={(e) =>
                  setCatFormData({ ...catFormData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Espèce
              </label>
              <select
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={catFormData.species || "Chat"}
                onChange={(e) =>
                  setCatFormData({ ...catFormData, species: e.target.value })
                }
              >
                <option value="Chat">Chat</option>
                <option value="Chien">Chien</option>
                <option value="NAC">NAC</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Race
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={catFormData.breed || ""}
                onChange={(e) =>
                  setCatFormData({ ...catFormData, breed: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Couleur
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={catFormData.color || ""}
                onChange={(e) =>
                  setCatFormData({ ...catFormData, color: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Numéro de puce
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={catFormData.chip_number || ""}
                onChange={(e) =>
                  setCatFormData({
                    ...catFormData,
                    chip_number: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Age (manuel)
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={catFormData.age || ""}
                onChange={(e) =>
                  setCatFormData({ ...catFormData, age: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Date de Naissance
              </label>
              <input
                type="date"
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={catFormData.birth_date || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setCatFormData({
                    ...catFormData,
                    birth_date: val,
                    age: val ? calculateAge(val) : catFormData.age,
                  });
                }}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Commentaires
              </label>
              <textarea
                rows={3}
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
                placeholder="Commentaires, habitudes, allergies, caractère..."
                value={catFormData.comments || ""}
                onChange={(e) =>
                  setCatFormData({ ...catFormData, comments: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu("overview");
                  setEditingCat(null);
                }}
                className="px-4 py-2 text-stone-500 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                {editingCat ? "Mettre à jour" : "Enregistrer l'animal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeMenu === "add_stay" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="font-bold text-lg mb-4">Créer un séjour</h3>
          <form
            onSubmit={handleSaveStay}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Animal
              </label>
              <select
                required
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={stayFormData.cat_id}
                onChange={(e) =>
                  setStayFormData({ ...stayFormData, cat_id: e.target.value })
                }
              >
                <option value="">Sélectionner un animal</option>
                {clientCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Box
              </label>
              <select
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={stayFormData.box_number}
                onChange={(e) =>
                  setStayFormData({
                    ...stayFormData,
                    box_number: parseInt(e.target.value),
                  })
                }
              >
                {boxOptions.map((b) => (
                  <option
                    key={b}
                    value={b}
                    className={
                      isBoxAvailable(
                        b,
                        stayFormData.arrival_date,
                        stayFormData.planned_departure,
                      )
                        ? ""
                        : "text-stone-300"
                    }
                  >
                    Box {b}{" "}
                    {!isBoxAvailable(
                      b,
                      stayFormData.arrival_date,
                      stayFormData.planned_departure,
                    ) && "(Occupé)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Arrivée
              </label>
              <input
                type="date"
                required
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={stayFormData.arrival_date}
                onChange={(e) =>
                  setStayFormData({
                    ...stayFormData,
                    arrival_date: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Départ Prévu
              </label>
              <input
                type="date"
                required
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={stayFormData.planned_departure}
                onChange={(e) =>
                  setStayFormData({
                    ...stayFormData,
                    planned_departure: e.target.value,
                  })
                }
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setActiveMenu("overview")}
                className="px-4 py-2 text-stone-500 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Réserver le séjour
              </button>
            </div>
          </form>
        </div>
      )}

      {activeMenu === "overview" && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-base text-stone-900">
            Animaux rattachés ({clientCats.length})
          </h3>
          {clientCats.length === 0 && (
            <p className="text-stone-500 text-xs">
              Ce client n'a aucun animal enregistré.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {clientCats.map((cat) => {
              const catStays = stays
                .filter((s) => s.cat_id === cat.id)
                .sort((a, b) =>
                  String(b.arrival_date || "").localeCompare(
                    String(a.arrival_date || ""),
                  ),
                );
              return (
                <div
                  key={cat.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5DED2] group flex flex-col hover:border-stone-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-display font-semibold text-sm shrink-0 ${getMonogramClasses(cat.name)}`}
                        >
                          {cat.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-semibold text-base text-stone-900 truncate">
                            {cat.name}
                          </h4>
                          <p className="text-[11px] text-stone-500">{cat.species}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditCatClick(cat)}
                          className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCatClick(cat.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-stone-500 grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <span className="font-semibold block uppercase text-[10px] text-stone-400">
                          Race
                        </span>
                        <span className="text-stone-700 font-medium">{cat.breed || "-"}</span>
                      </div>
                      <div>
                        <span className="font-semibold block uppercase text-[10px] text-stone-400">
                          Puce
                        </span>
                        <span className="text-stone-700 font-medium tabular-nums">{cat.chip_number || "-"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold block uppercase text-[10px] text-stone-400">
                          Âge
                        </span>
                        <span className="text-stone-700 font-medium">
                          {cat.age ||
                            (cat.birth_date ? calculateAge(cat.birth_date) : "-")}
                        </span>
                      </div>
                      {cat.comments && (
                        <div className="col-span-2 pt-2 border-t border-[#F0E9DC]">
                          <span className="font-semibold block uppercase text-[10px] text-stone-400 mb-1">
                            Commentaires
                          </span>
                          <p className="text-xs text-stone-700 bg-[#FAF8F4] p-2 rounded-lg border border-[#EDE6DA] whitespace-pre-wrap break-words">
                            {cat.comments}
                          </p>
                        </div>
                      )}
                    </div>
                    {catStays.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        <p className="text-[10px] uppercase font-semibold text-stone-400 tracking-wide">
                          Derniers Séjours
                        </p>
                        {catStays.slice(0, 3).map((cs) => (
                          <div
                            key={cs.id}
                            className="text-[11px] flex justify-between bg-[#FAF8F4] p-1.5 rounded-lg border border-[#EDE6DA] tabular-nums"
                          >
                            <span>
                              {formatDateSafe(cs.arrival_date)} →{" "}
                              {formatDateSafe(
                                cs.actual_departure || cs.planned_departure,
                              )}
                            </span>
                            <span className="font-semibold text-emerald-800">
                              Box {cs.box_number}{" "}
                              {(cs.actual_departure || cs.planned_departure) <
                                new Date().toISOString().split("T")[0] &&
                                "(Terminé)"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setStayFormData((s) => ({ ...s, cat_id: cat.id }));
                      setActiveMenu("add_stay");
                    }}
                    className="w-full bg-[#F4F0E8] py-2 rounded-lg text-xs font-semibold text-stone-800 hover:bg-[#EAE3D5] transition-colors mt-auto"
                  >
                    <Plus size={13} className="inline mr-1" /> Nouveau séjour
                    pour {cat.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CatsView({
  cats,
  clients,
  onUpdate,
  showToast,
  askConfirm,
}: {
  cats: Cat[];
  clients: Client[];
  onUpdate: () => void;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [formData, setFormData] = useState({
    owner_id: "",
    name: "",
    species: "Chat",
    breed: "",
    color: "",
    chip_number: "",
    vaccine_tc_date: "",
    vaccine_l_date: "",
    parasite_treatment_date: "",
    birth_date: "",
    age: "",
    comments: "",
  });
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const handleDelete = (id: string) => {
    askConfirm(
      "Supprimer l'animal ?",
      "ATTENTION: Supprimer cet animal supprimera également TOUS ses séjours associés. Continuer ?",
      async () => {
        try {
          const res = await fetch(`/api/cats/${id}`, { method: "DELETE" });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erreur lors de la suppression");
          }
          showToast("Animal et ses séjours supprimés !");
          await onUpdate();
        } catch (err: any) {
          showToast("Erreur: " + err.message, "error");
        }
      },
      true,
    );
  };

  const filteredCats = cats.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      (c.chip_number || "").includes(search) ||
      (c.comments || "").toLowerCase().includes(search.toLowerCase()),
  );

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Le nom du chat est obligatoire", "error");
      return;
    }
    if (!formData.owner_id) {
      showToast("Veuillez sélectionner un propriétaire", "error");
      return;
    }
    handleSave();
  };

  const handleSave = async () => {
    setStatus("Enregistrement...");
    try {
      const url = editingCat ? `/api/cats/${editingCat.id}` : "/api/cats";
      const method = editingCat ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(errorData.error || response.statusText);
      }

      setStatus("Succès !");
      showToast("Chat enregistré avec succès !");
      setIsAdding(false);
      setEditingCat(null);
      onUpdate();
    } catch (error: any) {
      console.error("Save error:", error);
      setStatus("Erreur: " + error.message);
      showToast("Erreur: " + error.message, "error");
    } finally {
      setTimeout(() => setStatus(""), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
            Registre des Animaux
          </h2>
          <p className="text-[11px] text-stone-500 mt-0.5 tabular-nums">
            {cats.length} pensionnaire{cats.length > 1 ? "s" : ""} enregistré
            {cats.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              placeholder="Nom, maître, puce, note..."
              className="pl-8 pr-3 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs w-full sm:w-52 outline-none focus:bg-white focus:border-emerald-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingCat(null);
              setFormData({
                owner_id: clients[0]?.id || "",
                name: "",
                species: "Chat",
                breed: "",
                color: "",
                chip_number: "",
                vaccine_tc_date: "",
                vaccine_l_date: "",
                parasite_treatment_date: "",
                birth_date: "",
                age: "",
                comments: "",
              });
            }}
            className="bg-[#13382C] text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#0E2B22] transition-colors text-xs font-semibold whitespace-nowrap"
          >
            <Plus size={15} /> Nouvel Animal
          </button>
        </div>
      </div>

      {status && (
        <div
          className={`p-2.5 rounded-lg text-xs font-bold ${status.startsWith("Erreur") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {status}
        </div>
      )}

      {(isAdding || editingCat) && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-stone-200">
          <form
            onSubmit={onFormSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {!editingCat && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase">
                  Propriétaire
                </label>
                <select
                  required
                  className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.owner_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, owner_id: e.target.value })
                  }
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Espèce
              </label>
              <select
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.species || "Chat"}
                onChange={(e) =>
                  setFormData({ ...formData, species: e.target.value })
                }
              >
                <option value="Chat">Chat</option>
                <option value="Chien">Chien</option>
                <option value="NAC">NAC</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Nom de l'animal
              </label>
              <input
                required
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Race
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.breed || ""}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Couleur
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.color || ""}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Age (manuel)
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="ex: 3 ans"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Date de Naissance
              </label>
              <input
                type="date"
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.birth_date || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    birth_date: val,
                    age: val ? calculateAge(val) : formData.age,
                  });
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Numéro de Puce
              </label>
              <input
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.chip_number}
                onChange={(e) =>
                  setFormData({ ...formData, chip_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Derniers vaccins (TC)
              </label>
              <input
                type="date"
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.vaccine_tc_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, vaccine_tc_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Leucose (L)
              </label>
              <input
                type="date"
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.vaccine_l_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, vaccine_l_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Dernier traitement Parasitaire
              </label>
              <input
                type="date"
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.parasite_treatment_date || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parasite_treatment_date: e.target.value,
                  })
                }
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-stone-500 uppercase">
                Commentaires
              </label>
              <textarea
                rows={3}
                className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
                placeholder="Commentaires, habitudes, allergies, caractère..."
                value={formData.comments || ""}
                onChange={(e) =>
                  setFormData({ ...formData, comments: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingCat(null);
                }}
                className="px-4 py-2 text-stone-500 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCats.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5DED2] hover:border-emerald-400 transition-all duration-150 group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getMonogramClasses(cat.name)}`}
                >
                  <CatIcon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-base text-stone-900 truncate">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate">
                    <span className="font-semibold text-emerald-800">
                      {cat.owner_name}
                    </span>
                    {cat.species ? ` · ${cat.species}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => {
                    setEditingCat(cat);
                    setFormData({
                      owner_id: cat.owner_id || "",
                      name: cat.name || "",
                      species: cat.species || "Chat",
                      breed: cat.breed || "",
                      color: cat.color || "",
                      chip_number: cat.chip_number || "",
                      vaccine_tc_date: cat.vaccine_tc_date || "",
                      vaccine_l_date: cat.vaccine_l_date || "",
                      parasite_treatment_date:
                        cat.parasite_treatment_date || "",
                      birth_date: cat.birth_date || "",
                      age: cat.age || "",
                      comments: cat.comments || "",
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs mt-2.5">
              <div className="col-span-2">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">
                  Age
                </span>
                {cat.age ||
                  (cat.birth_date ? calculateAge(cat.birth_date) : "-")}{" "}
                {cat.birth_date &&
                  `(Né(e) le ${formatDateSafe(cat.birth_date)})`}
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">
                  Race
                </span>{" "}
                {cat.breed || "-"}
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">
                  Couleur
                </span>{" "}
                {cat.color || "-"}
              </div>
              <div className="col-span-2">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">
                  Puce
                </span>{" "}
                {cat.chip_number || "-"}
              </div>

              <div className="col-span-2 pt-2 border-t border-stone-100">
                <span className="text-stone-400 block text-[10px] uppercase font-bold mb-1">
                  Santé
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div>
                    <span className="text-stone-500">Vaccins TC:</span>{" "}
                    {formatDateSafe(cat.vaccine_tc_date)}
                  </div>
                  <div>
                    <span className="text-stone-500">Leucose L:</span>{" "}
                    {formatDateSafe(cat.vaccine_l_date)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-500">Parasitaire:</span>{" "}
                    {formatDateSafe(cat.parasite_treatment_date)}
                  </div>
                </div>
              </div>

              <div className="col-span-2 pt-2 border-t border-stone-100">
                <span className="text-stone-400 block text-[10px] uppercase font-bold mb-1">
                  Commentaires
                </span>
                {cat.comments ? (
                  <p className="text-[11px] text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-100 whitespace-pre-wrap break-words">
                    {cat.comments}
                  </p>
                ) : (
                  <span className="text-[11px] text-stone-400 italic">
                    Aucun commentaire
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({
  settings,
  onUpdate,
  showToast,
  askConfirm,
  focusFieldId,
  onClearFocusField,
}: {
  settings: Settings;
  onUpdate: () => void;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
  focusFieldId?: string | null;
  onClearFocusField?: () => void;
}) {
  const [restoring, setRestoring] = useState(false);
  const [restoreLogs, setRestoreLogs] = useState<string[]>([]);
  const [totalBoxes, setTotalBoxes] = useState(settings.total_boxes || "3");
  const [staysBannerUrl, setStaysBannerUrl] = useState(
    settings.stays_banner_url || "",
  );
  const [bannerPreviewError, setBannerPreviewError] = useState(false);
  const [defaultDownPayment, setDefaultDownPayment] = useState(
    settings.default_down_payment_percentage || "30",
  );
  const [healthConditions, setHealthConditions] = useState(
    settings.health_conditions ||
      "Nez qui coule\nYeux qui pleurent\nDémangeaisons",
  );
  const [generalConditions, setGeneralConditions] = useState(
    settings.general_conditions || "",
  );
  const [companyInfo, setCompanyInfo] = useState({
    company_name: settings.company_name || "",
    company_owner: settings.company_owner || "",
    company_address: settings.company_address || "",
    company_phone: settings.company_phone || "",
    company_email: settings.company_email || "",
    company_siret: settings.company_siret || "",
    company_acaced: settings.company_acaced || "",
  });
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const paymentMethods = settings.payment_methods || [
    "CB",
    "Chèque",
    "Espèces",
    "Virement",
  ];
  const [tempStatuses, setTempStatuses] = useState<
    Record<string, InvoiceStatusConfig>
  >(settings.invoice_statuses || DEFAULT_INVOICE_STATUS_LABELS);

  useEffect(() => {
    setGeneralConditions(settings.general_conditions || "");
    setHealthConditions(
      settings.health_conditions ||
        "Nez qui coule\nYeux qui pleurent\nDémangeaisons",
    );
    setTotalBoxes(settings.total_boxes || "3");
    setStaysBannerUrl(settings.stays_banner_url || "");
    setBannerPreviewError(false);
    setDefaultDownPayment(settings.default_down_payment_percentage || "30");
    setTempStatuses(settings.invoice_statuses || DEFAULT_INVOICE_STATUS_LABELS);
    setCompanyInfo({
      company_name: settings.company_name || "",
      company_owner: settings.company_owner || "",
      company_address: settings.company_address || "",
      company_phone: settings.company_phone || "",
      company_email: settings.company_email || "",
      company_siret: settings.company_siret || "",
      company_acaced: settings.company_acaced || "",
    });
  }, [settings]);

  useEffect(() => {
    setBannerPreviewError(false);
  }, [staysBannerUrl]);

  useEffect(() => {
    if (!focusFieldId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(focusFieldId) as HTMLInputElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
      onClearFocusField?.();
    }, 80);
    return () => clearTimeout(timer);
  }, [focusFieldId, onClearFocusField]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      showToast("Téléchargement du logo en cours...", "success");
      const formData = new FormData();
      formData.append("logo", e.target.files[0]);
      const res = await fetch("/api/settings", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erreur lors de l'upload");
      onUpdate();
      showToast("Logo mis à jour avec succès !", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      e.target.value = ""; // Reset input
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de l'enregistrement");
      }
      onUpdate();
      showToast("Paramètre enregistré avec succès !", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleSaveCompanyInfo = async () => {
    try {
      for (const [key, value] of Object.entries(companyInfo)) {
        const res = await fetch(`/api/settings?t=${Date.now()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Erreur lors de l'enregistrement de ${key}`,
          );
        }
      }
      onUpdate();
      showToast("Informations de l'entreprise enregistrées", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleBackup = async (full: boolean) => {
    const res = await fetch(`/api/backup?full=${full}`);
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chathotel_backup_${full ? "full" : "data"}_${format(new Date(), "yyyyMMdd")}.json`;
    a.click();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    askConfirm(
      "Restaurer les données ?",
      "Attention: Cela va écraser TOUTES les données actuelles de la base de données. Cette action est irréversible. Voulez-vous continuer ?",
      () => {
        setRestoring(true);
        setRestoreLogs(["Lecture du fichier..."]);
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const text = event.target?.result as string;
            if (!text) throw new Error("Fichier vide");
            const data = JSON.parse(text);
            setRestoreLogs((prev) => [
              ...prev,
              "Fichier parsé, envoi au serveur...",
            ]);

            const res = await fetch("/api/restore", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!res.ok) {
              const text = await res.text();
              throw new Error(
                `Erreur serveur (${res.status}): ${text.substring(0, 100)}`,
              );
            }

            const result = await res.json();
            if (result.logs) setRestoreLogs(result.logs);
            onUpdate();
            showToast("Restauration terminée avec succès !");
          } catch (err: any) {
            setRestoreLogs((prev) => [...prev, `ERREUR: ${err.message}`]);
            showToast(
              "Erreur lors de la restauration: " + err.message,
              "error",
            );
          } finally {
            setRestoring(false);
            e.target.value = ""; // Reset input
          }
        };
        reader.readAsText(file);
      },
      true,
    );
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
          Configuration
        </h2>
        <p className="text-[11px] text-stone-500 mt-0.5">
          Personnalisez l'identité, les tarifs par défaut et les conditions de
          votre établissement.
        </p>
      </div>

      <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2] space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-stone-900">
            <SettingsIcon size={16} className="text-emerald-700" /> Informations
            de l'entreprise
          </h3>
          <div className="flex items-center gap-2.5">
            <BrandLogo
              logoUrl={settings.logo}
              sizeClass="h-10 w-10"
              roundedClass="rounded-xl border border-[#E5DED2]"
            />
            <div className="relative overflow-hidden group">
              <div className="bg-[#13382C] text-white px-3 py-1.5 rounded-lg font-semibold text-xs group-hover:bg-[#0E2B22] transition-colors flex items-center justify-center whitespace-nowrap">
                Changer le logo
              </div>
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                style={{ fontSize: "100px" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    showToast(
                      "Fichier sélectionné : " + e.target.files[0].name,
                      "success",
                    );
                    handleLogoUpload(e);
                  }
                }}
                accept="image/*"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 uppercase">
              Nom de l'entreprise
            </label>
            <input
              type="text"
              className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={companyInfo.company_name}
              onChange={(e) =>
                setCompanyInfo({ ...companyInfo, company_name: e.target.value })
              }
              placeholder="Ex: La Pension du Chemin Vert"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 uppercase">
              Nom et prénom du gérant
            </label>
            <input
              type="text"
              className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={companyInfo.company_owner}
              onChange={(e) =>
                setCompanyInfo({
                  ...companyInfo,
                  company_owner: e.target.value,
                })
              }
              placeholder="Ex: Jean Dupont"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-stone-500 uppercase">
              Adresse complète
            </label>
            <input
              type="text"
              className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={companyInfo.company_address}
              onChange={(e) =>
                setCompanyInfo({
                  ...companyInfo,
                  company_address: e.target.value,
                })
              }
              placeholder="Ex: 123 Rue des Chats, 75000 Paris"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 uppercase">
              Numéro de téléphone
            </label>
            <input
              type="text"
              className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={companyInfo.company_phone}
              onChange={(e) =>
                setCompanyInfo({
                  ...companyInfo,
                  company_phone: e.target.value,
                })
              }
              placeholder="Ex: 01 23 45 67 89"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 uppercase">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={companyInfo.company_email}
              onChange={(e) =>
                setCompanyInfo({
                  ...companyInfo,
                  company_email: e.target.value,
                })
              }
              placeholder="Ex: contact@pension.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 uppercase">
              Numéro SIRET
            </label>
            <input
              type="text"
              className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={companyInfo.company_siret}
              onChange={(e) =>
                setCompanyInfo({
                  ...companyInfo,
                  company_siret: e.target.value,
                })
              }
              placeholder="Ex: 123 456 789 00012"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 uppercase">
              Numéro ACACED
            </label>
            <input
              type="text"
              className="w-full p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={companyInfo.company_acaced}
              onChange={(e) =>
                setCompanyInfo({
                  ...companyInfo,
                  company_acaced: e.target.value,
                })
              }
              placeholder="Ex: 2021/1234-5678"
            />
          </div>
        </div>
        <button
          onClick={handleSaveCompanyInfo}
          className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-4 py-2 rounded-lg text-xs font-semibold mt-1 transition-colors"
        >
          Enregistrer les informations
        </button>
      </section>

      <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2] space-y-3.5">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-stone-900">
          <SettingsIcon size={16} className="text-emerald-700" /> Paramètres de
          la pension
        </h3>
        <div className="grid grid-cols-1 gap-3.5 text-sm">
          <div className="space-y-1.5 pb-3 border-b border-[#EEE8DC]">
            <label
              htmlFor="stays-banner-url-input"
              className="text-[11px] font-semibold text-stone-500 uppercase"
            >
              Image d'accueil — Vue Séjours (Lien URL)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="stays-banner-url-input"
                type="url"
                className="flex-1 p-2 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                value={staysBannerUrl}
                onChange={(e) => setStaysBannerUrl(e.target.value)}
                placeholder="https://exemple.com/image-suites.jpg"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSaveSetting(
                      "stays_banner_url",
                      staysBannerUrl.trim(),
                    )
                  }
                  className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Enregistrer
                </button>
                {(staysBannerUrl.trim() || settings.stays_banner_url) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStaysBannerUrl("");
                      handleSaveSetting("stays_banner_url", "");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 bg-[#FAF8F4] hover:bg-rose-50 hover:text-rose-700 border border-[#E4DDD1] transition-colors whitespace-nowrap"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-stone-400">
              Image affichée à côté de « Accueil & Suites Félines ». Laissez vide
              pour afficher le bouton d'ajout par défaut.
            </p>
            {staysBannerUrl.trim() && (
              <div className="mt-2 rounded-xl overflow-hidden border border-[#E5DED2] bg-[#FAF8F4] max-w-xs">
                {!bannerPreviewError ? (
                  <img
                    src={staysBannerUrl.trim()}
                    alt="Aperçu de l'image d'accueil"
                    referrerPolicy="no-referrer"
                    onError={() => setBannerPreviewError(true)}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="p-3 text-[11px] text-rose-600 flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    <span>Impossible de charger l'aperçu de ce lien.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-500 uppercase">
              Nombre total de box
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-24 p-2 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none tabular-nums"
                value={totalBoxes || ""}
                onChange={(e) => setTotalBoxes(e.target.value)}
              />
              <button
                onClick={() => handleSaveSetting("total_boxes", totalBoxes)}
                className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                Enregistrer
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              Définit le nombre de box disponibles dans les menus déroulants et
              les statistiques.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-500 uppercase">
              Pourcentage d'acompte par défaut (%)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-24 p-2 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none tabular-nums"
                value={defaultDownPayment || ""}
                onChange={(e) => setDefaultDownPayment(e.target.value)}
              />
              <button
                onClick={() =>
                  handleSaveSetting(
                    "default_down_payment_percentage",
                    defaultDownPayment,
                  )
                }
                className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                Enregistrer
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              Pourcentage calculé par défaut pour les acomptes dans la gestion
              des factures.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-500 uppercase">
              Conditions Générales (Contrat)
            </label>
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full p-2.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none h-28 resize-y text-sm"
                value={generalConditions}
                onChange={(e) => setGeneralConditions(e.target.value)}
                placeholder="Saisissez ici les conditions générales qui apparaîtront sur les contrats..."
              />
              <button
                onClick={() =>
                  handleSaveSetting("general_conditions", generalConditions)
                }
                className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold self-start transition-colors"
              >
                Enregistrer les conditions
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-500 uppercase">
              État de santé de l'animal (à cocher dans le contrat)
            </label>
            <p className="text-[11px] text-stone-400">
              Saisissez un élément par ligne. Ces options seront ajoutées en bas
              du contrat pour signature.
            </p>
            <div className="flex flex-col gap-2 mt-1.5">
              <textarea
                className="w-full p-2.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none h-24 resize-y text-sm"
                value={healthConditions}
                onChange={(e) => setHealthConditions(e.target.value)}
                placeholder="Nez qui coule&#10;Yeux qui pleurent&#10;..."
              />
              <button
                onClick={() =>
                  handleSaveSetting("health_conditions", healthConditions)
                }
                className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold self-start mt-1 transition-colors"
              >
                Enregistrer la liste de santé
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2] space-y-3.5">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-stone-900">
          <CreditCard size={16} className="text-emerald-700" /> Modes de
          Paiement
        </h3>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((m) => (
            <div
              key={m}
              className="flex items-center gap-2 bg-[#FAF8F4] border border-[#E4DDD1] px-2.5 py-1 rounded-lg"
            >
              <span className="text-xs font-medium text-stone-700">{m}</span>
              <button
                onClick={() => {
                  const updated = paymentMethods.filter((p) => p !== m);
                  handleSaveSetting("payment_methods", JSON.stringify(updated));
                }}
                className="text-stone-400 hover:text-rose-600 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Ajouter un mode (ex: PayPal)"
            className="flex-1 p-2 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none"
            value={newPaymentMethod}
            onChange={(e) => setNewPaymentMethod(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newPaymentMethod.trim()) {
                const updated = [...paymentMethods, newPaymentMethod.trim()];
                handleSaveSetting("payment_methods", JSON.stringify(updated));
                setNewPaymentMethod("");
              }
            }}
          />
          <button
            onClick={() => {
              if (newPaymentMethod.trim()) {
                const updated = [...paymentMethods, newPaymentMethod.trim()];
                handleSaveSetting("payment_methods", JSON.stringify(updated));
                setNewPaymentMethod("");
              }
            }}
            className="bg-[#13382C] hover:bg-[#0E2B22] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            Ajouter
          </button>
        </div>
        <p className="text-[11px] text-stone-400 italic">
          Ces modes apparaîtront lors de la création d'une facture.
        </p>
      </section>

      <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2] space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-stone-900">
            <CheckCircle2 size={16} className="text-emerald-700" /> Libellés des
            Statuts
          </h3>
          <button
            onClick={() =>
              handleSaveSetting(
                "invoice_statuses",
                JSON.stringify(tempStatuses),
              )
            }
            className="bg-[#13382C] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:bg-[#0E2B22] transition-colors"
          >
            Enregistrer les libellés
          </button>
        </div>
        <p className="text-[11px] text-stone-400">
          Personnalisez les noms des statuts de vos factures.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {Object.entries(tempStatuses).map(([key, config]: [string, any]) => (
            <div
              key={key}
              className="flex flex-col gap-1 p-2.5 bg-[#FAF8F4] rounded-xl border border-[#EDE6DA]"
            >
              <label className="text-[10px] font-semibold text-stone-400 uppercase">
                Clé : {key}
              </label>
              <input
                type="text"
                className={`w-full p-1.5 border border-[#E4DDD1] rounded-lg text-xs font-semibold bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 outline-none ${config.color}`}
                value={config.label}
                onChange={(e) => {
                  setTempStatuses({
                    ...tempStatuses,
                    [key]: { ...config, label: e.target.value },
                  });
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2] space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-stone-900">
          <Save size={16} className="text-emerald-700" /> Sauvegarde &
          Restauration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="p-3.5 bg-[#FAF8F4] rounded-xl border border-[#EDE6DA] space-y-2.5">
            <h4 className="font-semibold text-xs text-stone-900">Exporter les données</h4>
            <p className="text-[11px] text-stone-500">
              Sauvegardez vos clients, chats, séjours et factures.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleBackup(false)}
                className="w-full bg-white border border-[#E4DDD1] text-stone-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#F4F0E8] transition-colors flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Données uniquement (JSON)
              </button>
              <button
                onClick={() => handleBackup(true)}
                className="w-full bg-white border border-[#E4DDD1] text-stone-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#F4F0E8] transition-colors flex items-center justify-center gap-1.5"
              >
                <Camera size={13} /> Sauvegarde complète (avec médias)
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF8F4] rounded-xl border border-[#EDE6DA] space-y-2.5">
            <h4 className="font-semibold text-xs text-stone-900">Importer / Restaurer</h4>
            <p className="text-[11px] text-stone-500">
              Réintégrez une sauvegarde précédente. Attention: écrase tout !
            </p>
            <label
              className={`w-full flex items-center justify-center gap-1.5 bg-[#13382C] text-white py-1.5 rounded-lg text-xs font-semibold transition-colors ${restoring ? "opacity-50 cursor-not-allowed" : "hover:bg-[#0E2B22] cursor-pointer"}`}
            >
              <Upload size={13} />{" "}
              {restoring ? "Restauration..." : "Sélectionner un fichier"}
              {!restoring && (
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      showToast("Fichier de sauvegarde sélectionné", "success");
                      handleRestore(e);
                    }
                  }}
                  accept=".json"
                />
              )}
            </label>
          </div>
        </div>

        {restoring && (
          <div className="p-3 bg-[#13382C] rounded-xl font-mono text-[10px] text-emerald-200 space-y-1 max-h-40 overflow-y-auto">
            {restoreLogs.map((log, i) => (
              <div key={i}>{`> ${log}`}</div>
            ))}
            <div>_</div>
          </div>
        )}
        {!restoring && restoreLogs.length > 0 && (
          <div className="p-3 bg-[#FAF8F4] rounded-xl border border-[#EDE6DA] font-mono text-[10px] text-stone-600 space-y-1 max-h-40 overflow-y-auto">
            <div className="flex justify-between items-center mb-2 border-b border-[#E5DED2] pb-1">
              <span className="font-bold uppercase">
                Derniers logs d'import
              </span>
              <button
                onClick={() => setRestoreLogs([])}
                className="hover:text-rose-600"
              >
                Effacer
              </button>
            </div>
            {restoreLogs.map((log, i) => (
              <div key={i}>{`> ${log}`}</div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-1.5">
        <h3 className="font-bold text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={17} /> Zone de danger
        </h3>
        <p className="text-xs text-red-600">
          La suppression des données est irréversible. Assurez-vous d'avoir une
          sauvegarde.
        </p>
      </section>
    </div>
  );
}

function CalendarView({
  stays,
  onUpdate,
  settings,
  showToast,
  askConfirm,
}: {
  stays: Stay[];
  onUpdate: () => void;
  settings: Settings;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [viewMode, setViewMode] = useState<"global" | "boxes">("global");
  const [boxesTimeRange, setBoxesTimeRange] = useState<
    "month" | "quarter" | "year"
  >("month");

  const totalBoxes = parseInt(settings.total_boxes || "3");
  const boxOptions = Array.from({ length: totalBoxes }, (_, i) => i + 1);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const days = [];
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++)
    days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  let daysToRender: Date[] = [];
  let displayLabel = format(currentDate, "MMMM yyyy", { locale: fr });

  if (viewMode === "boxes") {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    if (boxesTimeRange === "month") {
      const dim = new Date(y, m + 1, 0).getDate();
      for (let i = 1; i <= dim; i++) daysToRender.push(new Date(y, m, i));
      displayLabel = format(currentDate, "MMMM yyyy", { locale: fr });
    } else if (boxesTimeRange === "quarter") {
      const quarterStartMonth = Math.floor(m / 3) * 3;
      for (let i = 0; i < 3; i++) {
        const d = new Date(y, quarterStartMonth + i + 1, 0).getDate();
        for (let j = 1; j <= d; j++)
          daysToRender.push(new Date(y, quarterStartMonth + i, j));
      }
      displayLabel = `Trimestre ${Math.floor(m / 3) + 1} ${y}`;
    } else if (boxesTimeRange === "year") {
      for (let month = 0; month < 12; month++) {
        const d = new Date(y, month + 1, 0).getDate();
        for (let j = 1; j <= d; j++) daysToRender.push(new Date(y, month, j));
      }
      displayLabel = `Année ${y}`;
    }
  }

  const getStaysForDay = (day: number) => {
    const dateStr = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
      "yyyy-MM-dd",
    );
    return stays.filter(
      (s) =>
        s.arrival_date <= dateStr &&
        (s.actual_departure || s.planned_departure) >= dateStr,
    );
  };

  const getStaysForBoxAndDate = (box: number, d: Date) => {
    const dateStr = format(d, "yyyy-MM-dd");
    return stays.filter(
      (s) =>
        s.box_number === box &&
        s.arrival_date <= dateStr &&
        (s.actual_departure || s.planned_departure) >= dateStr,
    );
  };

  const getBoxStyle = (boxNumber: number) => {
    const styles = [
      "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
      "bg-blue-100 text-blue-700 hover:bg-blue-200",
      "bg-amber-100 text-amber-700 hover:bg-amber-200",
      "bg-purple-100 text-purple-700 hover:bg-purple-200",
      "bg-rose-100 text-rose-700 hover:bg-rose-200",
      "bg-sky-100 text-sky-700 hover:bg-sky-200",
      "bg-orange-100 text-orange-700 hover:bg-orange-200",
      "bg-violet-100 text-violet-700 hover:bg-violet-200",
    ];
    return styles[(boxNumber - 1) % styles.length];
  };

  const getDayBarStyle = (stay: Stay, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const isArrivalDay = stay.arrival_date === dateStr;
    const departureDate = stay.actual_departure || stay.planned_departure;
    const isDepartureDay = departureDate === dateStr;

    let left = 0;
    let width = 100;

    if (isArrivalDay || isDepartureDay) {
      let startH = 0;
      let endH = 24;

      if (isArrivalDay) {
        const [h, m] = (stay.arrival_time || "14:00").split(":").map(Number);
        startH = h + m / 60;
      }
      if (isDepartureDay) {
        const [h, m] = (stay.departure_time || "11:00").split(":").map(Number);
        endH = h + m / 60;
      }

      if (endH <= startH && isArrivalDay && isDepartureDay) {
        width = 10;
      } else {
        left = (startH / 24) * 100;
        width = ((endH - startH) / 24) * 100;
      }
    }

    return {
      marginLeft: `${left}%`,
      width: `${width}%`,
      minWidth: width < 5 ? "4px" : "auto",
    };
  };

  const getBoxSolidColor = (boxNumber: number) => {
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-amber-500",
      "bg-purple-500",
      "bg-rose-500",
      "bg-sky-500",
      "bg-orange-500",
      "bg-violet-500",
    ];
    return colors[(boxNumber - 1) % colors.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
            Calendrier des Séjours
          </h2>
          <div className="flex bg-[#F4F0E8] p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode("global")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === "global" ? "bg-white text-[#13382C] shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
            >
              Vue Globale
            </button>
            <button
              onClick={() => setViewMode("boxes")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === "boxes" ? "bg-white text-[#13382C] shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
            >
              Par Box
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() -
                    (viewMode === "boxes" && boxesTimeRange === "quarter"
                      ? 3
                      : viewMode === "boxes" && boxesTimeRange === "year"
                        ? 12
                        : 1),
                ),
              )
            }
            className="p-1.5 hover:bg-[#F4F0E8] rounded-lg transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-display font-semibold text-sm min-w-[125px] text-center capitalize">
            {displayLabel}
          </span>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() +
                    (viewMode === "boxes" && boxesTimeRange === "quarter"
                      ? 3
                      : viewMode === "boxes" && boxesTimeRange === "year"
                        ? 12
                        : 1),
                ),
              )
            }
            className="p-1.5 hover:bg-[#F4F0E8] rounded-lg transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {viewMode === "boxes" && (
        <div className="flex gap-2">
          {["month", "quarter", "year"].map((r) => (
            <button
              key={r}
              onClick={() => setBoxesTimeRange(r as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${boxesTimeRange === r ? "bg-[#13382C] text-white shadow-sm" : "bg-white border border-[#E5DED2] text-stone-600 hover:bg-[#F4F0E8]"}`}
            >
              {r === "month" ? "Mois" : r === "quarter" ? "Trimestre" : "Année"}
            </button>
          ))}
        </div>
      )}

      {viewMode === "global" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED2] overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-7 bg-[#F4F0E8] border-b border-[#E5DED2]">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div
                  key={d}
                  className="p-2 text-center text-[11px] font-semibold text-stone-500 uppercase tracking-wide"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const isToday =
                  day !== null &&
                  format(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day,
                    ),
                    "yyyy-MM-dd",
                  ) === format(new Date(), "yyyy-MM-dd");
                return (
                  <div
                    key={i}
                    className={`min-h-[92px] p-1.5 border-r border-b border-[#F0E9DC] last:border-r-0 ${day === null ? "bg-[#FAF8F4]" : isToday ? "bg-[#FBF6EB]/70" : ""}`}
                  >
                    {day && (
                      <>
                        <span
                          className={`inline-flex items-center justify-center text-[11px] font-semibold tabular-nums ${isToday ? "w-5 h-5 rounded-full bg-[#13382C] text-white" : "text-stone-500"}`}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {getStaysForDay(day).map((stay) => {
                            const date = new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth(),
                              day!,
                            );
                            return (
                              <button
                                key={stay.id}
                                onClick={() => setSelectedStay(stay)}
                                style={getDayBarStyle(stay, date)}
                                className={`block text-left text-[10px] px-1 py-0.5 rounded font-semibold truncate transition-all hover:scale-[1.02] shadow-sm ${getBoxStyle(stay.box_number)}`}
                                title={`${stay.cat_name} (${stay.arrival_date} ${stay.arrival_time || "14:00"} - ${stay.actual_departure || stay.planned_departure} ${stay.departure_time || "11:00"})`}
                              >
                                {stay.cat_name} (Box {stay.box_number})
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED2] overflow-x-auto">
          <div
            style={{
              minWidth: `${Math.max(1200, daysToRender.length * 30 + 100)}px`,
            }}
          >
            <div
              className="bg-[#F4F0E8] border-b border-[#E5DED2]"
              style={{
                display: "grid",
                gridTemplateColumns: `100px repeat(${daysToRender.length}, minmax(30px, 1fr))`,
              }}
            >
              <div className="p-3 text-xs font-bold text-stone-400 uppercase border-r border-stone-200 sticky left-0 bg-stone-50">
                Box
              </div>
              {daysToRender.map((d, i) => (
                <div
                  key={i}
                  className="p-2 text-center border-r border-stone-100 last:border-r-0 flex flex-col items-center justify-center"
                >
                  <span className="text-[8px] uppercase text-stone-400">
                    {format(d, "MMM", { locale: fr })}
                  </span>
                  <span className="text-[10px] font-bold text-stone-600">
                    {format(d, "dd")}
                  </span>
                </div>
              ))}
            </div>
            {boxOptions.map((box) => (
              <div
                key={box}
                className="border-b border-stone-100 last:border-b-0"
                style={{
                  display: "grid",
                  gridTemplateColumns: `100px repeat(${daysToRender.length}, minmax(30px, 1fr))`,
                }}
              >
                <div className="p-3 text-sm font-bold text-stone-600 bg-stone-50/90 border-r border-stone-200 sticky left-0 z-10 flex items-center">
                  Box {box}
                </div>
                {daysToRender.map((d, i) => {
                  const dayStays = getStaysForBoxAndDate(box, d);
                  return (
                    <div
                      key={i}
                      className={`p-0.5 border-r border-stone-50 last:border-r-0 min-h-[40px] flex flex-col gap-0.5 ${[0, 6].includes(d.getDay()) ? "bg-stone-50/50" : ""}`}
                    >
                      {dayStays.map((stay) => (
                        <button
                          key={stay.id}
                          onClick={() => setSelectedStay(stay)}
                          style={getDayBarStyle(stay, d)}
                          className={`h-5 rounded text-[8px] p-0.5 font-bold truncate shadow-sm transition-transform hover:scale-105 ${(stay.actual_departure || stay.planned_departure) < new Date().toISOString().split("T")[0] ? "bg-stone-200 text-stone-500" : `${getBoxSolidColor(stay.box_number)} text-white`}`}
                          title={`${stay.cat_name} (${stay.arrival_date} ${stay.arrival_time || "14:00"} - ${stay.actual_departure || stay.planned_departure} ${stay.departure_time || "11:00"})`}
                        >
                          {stay.cat_name.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setSelectedStay(null)}
              className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full"
            >
              <X />
            </button>
            <h3 className="text-xl font-bold mb-6">
              Édition du Séjour #{selectedStay.id}
            </h3>
            <StayDetailsSection
              stay={selectedStay}
              onUpdate={() => {
                onUpdate();
                setSelectedStay(null);
              }}
              settings={settings}
              stays={stays}
              showToast={showToast}
              askConfirm={askConfirm}
            />
            <div className="mt-8 pt-8 border-t border-stone-100">
              <HealthSection
                stay={selectedStay}
                onUpdate={onUpdate}
                showToast={showToast}
                askConfirm={askConfirm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsView({
  stats,
  onNavigateToInvoices,
}: {
  stats: any;
  onNavigateToInvoices: (month: string) => void;
}) {
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">(
    "month",
  );
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.floor((new Date().getMonth() + 3) / 3),
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (!stats)
    return (
      <div className="p-8 text-center text-stone-500">
        Chargement des statistiques...
      </div>
    );

  let displayRevenue = 0;
  let displayOccupancy = 0;
  let label = "";

  if (timeRange === "month") {
    displayRevenue =
      stats.revenue.find((r: any) => r.month === selectedMonth)?.total || 0;
    displayOccupancy =
      stats.occupancy.find((o: any) => o.month === selectedMonth)
        ?.stays_count || 0;
    const [y, mm] = selectedMonth.split("-");
    label = format(new Date(parseInt(y), parseInt(mm) - 1), "MMMM yyyy", {
      locale: fr,
    });
  } else if (timeRange === "quarter") {
    displayRevenue = stats.revenue
      .filter((r: any) => {
        const m = parseInt(r.month.split("-")[1]);
        const q = Math.floor((m + 2) / 3);
        return (
          r.month.startsWith(selectedYear.toString()) && q === selectedQuarter
        );
      })
      .reduce((acc: number, curr: any) => acc + curr.total, 0);
    displayOccupancy = stats.occupancy
      .filter((o: any) => {
        const m = parseInt(o.month.split("-")[1]);
        const q = Math.floor((m + 2) / 3);
        return (
          o.month.startsWith(selectedYear.toString()) && q === selectedQuarter
        );
      })
      .reduce((acc: number, curr: any) => acc + curr.stays_count, 0);
    label = `Trimestre ${selectedQuarter} ${selectedYear}`;
  } else {
    displayRevenue = stats.revenue
      .filter((r: any) => r.month.startsWith(selectedYear.toString()))
      .reduce((acc: number, curr: any) => acc + curr.total, 0);
    displayOccupancy = stats.occupancy
      .filter((o: any) => o.month.startsWith(selectedYear.toString()))
      .reduce((acc: number, curr: any) => acc + curr.stays_count, 0);
    label = `Année ${selectedYear}`;
  }

  const occupancyRate = Math.min(
    100,
    Math.round(
      (displayOccupancy /
        (stats.totalBoxes *
          (timeRange === "month" ? 30 : timeRange === "quarter" ? 90 : 365))) *
        100,
    ),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
          Statistiques & Activité
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#F4F0E8] p-0.5 rounded-lg">
            {(["month", "quarter", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  timeRange === range
                    ? "bg-white text-[#13382C] shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {range === "month"
                  ? "Mois"
                  : range === "quarter"
                    ? "Trimestre"
                    : "Année"}
              </button>
            ))}
          </div>

          {timeRange === "month" && (
            <input
              type="month"
              className="px-2.5 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs font-medium"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          )}

          {timeRange === "quarter" && (
            <div className="flex gap-2">
              <select
                className="px-2.5 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs font-medium"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    Trimestre {q}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="px-2.5 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs w-20 tabular-nums"
                value={isNaN(selectedYear) ? "" : selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
            </div>
          )}

          {timeRange === "year" && (
            <input
              type="number"
              className="px-2.5 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs w-20 tabular-nums"
              value={isNaN(selectedYear) ? "" : selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5DED2]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-stone-500 capitalize">
              Taux de remplissage · {label}
            </p>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BarChart3 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl font-bold text-emerald-800">
              {occupancyRate}%
            </span>
            <span className="text-[11px] text-stone-500">estimé</span>
          </div>
          <div className="mt-3 w-full bg-[#F2EDE4] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5DED2]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-stone-500 capitalize">
              Chiffre d'Affaires · {label}
            </p>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <span className="text-2xl font-bold text-stone-900 tabular-nums">
            {displayRevenue.toFixed(2)} €
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5DED2]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-stone-500 capitalize">
              Jours Occupés · {label}
            </p>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
              <CalendarDays size={16} />
            </div>
          </div>
          <span className="text-2xl font-bold text-sky-800 tabular-nums">
            {displayOccupancy}
          </span>
        </div>
      </div>

      {/* ... rest of StatsView (Revenue History) ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2]">
          <h3 className="font-display font-semibold text-base mb-3.5 flex items-center gap-2 text-stone-900">
            <FileText size={16} className="text-emerald-700" /> Historique du CA
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {stats.revenue.map((r: any) => (
              <button
                key={r.month}
                onClick={() => onNavigateToInvoices(r.month)}
                className="w-full flex justify-between items-center p-2.5 bg-[#FAF8F4] hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-xs text-stone-700 group-hover:text-emerald-800 tabular-nums">
                    {r.month}
                  </span>
                  <ExternalLink
                    size={12}
                    className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <span className="font-mono font-bold text-sm text-emerald-800 tabular-nums">
                  {r.total.toFixed(2)} €
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2]">
          <h3 className="font-display font-semibold text-base mb-3.5 flex items-center gap-2 text-stone-900">
            <Calendar size={16} className="text-sky-700" /> Activité par mois
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {stats.occupancy.map((o: any) => (
              <button
                key={o.month}
                onClick={() => onNavigateToInvoices(o.month)}
                className="w-full flex justify-between items-center p-2.5 bg-[#FAF8F4] hover:bg-sky-50 border border-transparent hover:border-sky-200 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-xs text-stone-700 group-hover:text-sky-800 tabular-nums">
                    {o.month}
                  </span>
                  <ExternalLink
                    size={12}
                    className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <span className="font-mono font-bold text-sm text-sky-800 tabular-nums">
                  {o.stays_count} jours occupés
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsView({
  stays,
  onUpdate,
  settings,
  showToast,
  askConfirm,
}: {
  stays: Stay[];
  onUpdate: () => void;
  settings: Settings;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const [reportTab, setReportTab] = useState<"register" | "health">("register");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStayForEdit, setSelectedStayForEdit] = useState<Stay | null>(
    null,
  );
  const [healthReports, setHealthReports] = useState<any[]>([]);

  const handleDelete = (id: string) => {
    askConfirm(
      "Supprimer le séjour ?",
      "ATTENTION: Cette action est irréversible. Supprimer définitivement ce séjour et toutes ses données associées (santé, factures, médias) ?",
      async () => {
        try {
          const res = await fetch(`/api/stays/${id}`, { method: "DELETE" });
          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.error || "Erreur lors de la suppression");
          }

          showToast("Séjour supprimé avec succès !");
          await onUpdate();
        } catch (err: any) {
          console.error("Delete error:", err);
          showToast("ERREUR: " + err.message, "error");
        }
      },
      true,
    );
  };

  useEffect(() => {
    if (reportTab === "health") {
      fetch(`/api/health-reports?all=true`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setHealthReports(data);
          else setHealthReports([]);
        })
        .catch(() => setHealthReports([]));
    }
  }, [reportTab, stays]);

  const filtered = stays.filter((s) => {
    const matchesDate =
      reportTab === "register" && filterDate
        ? s.arrival_date.startsWith(filterDate)
        : true;
    const matchesSearch =
      s.cat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const filteredHealth = healthReports.filter((h) => {
    const matchesSearch =
      h.cat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const generateRegisterPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Registre des Entrées et Sorties", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Édité le: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);
    doc.text(`Période: ${filterDate || "Toutes"}`, 14, 35);

    const tableData = filtered.map((s) => [
      `#${s.id}`,
      `${s.cat_name}\n(${s.cat_breed || ""})`,
      s.owner_name,
      s.arrival_date,
      s.actual_departure || s.planned_departure,
      `Box ${s.box_number}`,
      s.comments || "",
    ]);

    autoTable(doc, {
      startY: 45,
      head: [
        [
          "ID",
          "Animal",
          "Propriétaire",
          "Arrivée",
          "Départ",
          "Box",
          "Commentaire",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    });

    doc.save(`registre_${filterDate || "global"}.pdf`);
  };

  const generateHealthReportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Suivi de Santé Global", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Édité le: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);

    const tableData = filteredHealth.map((h) => [
      `#${h.stay_id}`,
      h.cat_name,
      h.owner_name,
      h.ate_well ? "OUI" : "NON",
      h.abnormal_behavior ? "OUI" : "NON",
      h.medication || "-",
      h.incident || "-",
      h.health_comments || "-",
    ]);

    autoTable(doc, {
      startY: 45,
      head: [
        [
          "ID",
          "Animal",
          "Propriétaire",
          "Appétit",
          "Comportement",
          "Médicament",
          "Incident",
          "Commentaire",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 8 },
    });

    doc.save(`suivi_sante_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
          Rapports & Registres
        </h2>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button
            onClick={
              reportTab === "register"
                ? generateRegisterPDF
                : generateHealthReportPDF
            }
            className="flex-1 sm:flex-initial bg-[#13382C] text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#0E2B22] transition-colors text-xs font-semibold"
          >
            <FileText size={15} /> Imprimer PDF
          </button>
          {reportTab === "register" && (
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <input
                type="month"
                className="w-full px-2.5 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          )}
          <input
            type="text"
            placeholder="Rechercher..."
            className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs min-w-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row border-b border-[#E5DED2]">
        <button
          onClick={() => setReportTab("register")}
          className={`flex-1 px-4 py-2.5 font-semibold text-[13px] transition-colors border-b-2 ${reportTab === "register" ? "border-emerald-700 text-[#13382C]" : "border-transparent text-stone-400 hover:text-stone-700"}`}
        >
          Registre Entrées/Sorties
        </button>
        <button
          onClick={() => setReportTab("health")}
          className={`flex-1 px-4 py-2.5 font-semibold text-[13px] transition-colors border-b-2 ${reportTab === "health" ? "border-emerald-700 text-[#13382C]" : "border-transparent text-stone-400 hover:text-stone-700"}`}
        >
          Suivi de Santé Global
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED2] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[920px] text-[13px]">
          <thead>
            <tr className="bg-[#F4F0E8] border-b border-[#E5DED2]">
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                ID
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                Animal (Race, Couleur, Puce)
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                Propriétaire
              </th>
              {reportTab === "register" ? (
                <>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Arrivée
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Départ Réel/Prévu
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Box
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Commentaire
                  </th>
                </>
              ) : (
                <>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Bien mangé ?
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Comportement anormal ?
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Médicament
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Incident Toilettage
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                    Commentaire Santé
                  </th>
                </>
              )}
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {reportTab === "register"
              ? filtered.map((stay) => (
                  <tr
                    key={stay.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-3.5 py-2.5 text-xs font-bold text-stone-400 tabular-nums">
                      #{stay.id}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-stone-900">
                          {stay.cat_name}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {stay.cat_breed || "-"}, {stay.cat_color || "-"},
                          Puce: {stay.cat_chip_number || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-stone-600">
                      {stay.owner_name}
                    </td>
                    <td className="px-3.5 py-2.5 text-stone-600 tabular-nums">
                      {stay.arrival_date}
                    </td>
                    <td className="px-3.5 py-2.5 text-stone-600 tabular-nums">
                      {stay.actual_departure || stay.planned_departure}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs font-bold text-emerald-700">
                      Box {stay.box_number}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-stone-500 italic max-w-xs truncate">
                      {stay.comments || "-"}
                    </td>
                    <td className="px-3.5 py-2.5 flex gap-2">
                      <button
                        onClick={() => setSelectedStayForEdit(stay)}
                        className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDelete(stay.id)}
                        className="text-red-400 hover:text-red-600 transition-colors bg-red-50 p-1.5 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              : filteredHealth.map((report) => (
                  <tr
                    key={report.stay_id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-3.5 py-2.5 text-xs font-bold text-stone-400 tabular-nums">
                      #{report.stay_id}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="font-semibold text-stone-900">
                        {report.cat_name}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-stone-600">
                      {report.owner_name}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs">
                      {report.date
                        ? report.ate_well
                          ? "✅ Oui"
                          : "❌ Non"
                        : "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs">
                      {report.date
                        ? report.abnormal_behavior
                          ? "⚠️ Oui"
                          : "✅ Non"
                        : "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-stone-600">
                      {report.medication || "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-stone-600">
                      {report.incident || "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-stone-500 italic max-w-xs truncate">
                      {report.health_comments || "-"}
                    </td>
                    <td className="px-3.5 py-2.5 flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedStayForEdit(
                            stays.find((s) => s.id === report.stay_id) || null,
                          )
                        }
                        className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDelete(report.stay_id)}
                        className="text-red-400 hover:text-red-600 transition-colors bg-red-50 p-1.5 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {filtered.length === 0 && reportTab === "register" && (
          <div className="p-8 text-center text-xs text-stone-400">
            Aucun résultat pour cette période.
          </div>
        )}
      </div>

      {selectedStayForEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setSelectedStayForEdit(null)}
              className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full"
            >
              <X />
            </button>
            <h3 className="text-xl font-bold mb-6">
              Édition du Séjour #{selectedStayForEdit.id}
            </h3>
            <StayDetailsSection
              stay={selectedStayForEdit}
              onUpdate={() => {
                onUpdate();
                setSelectedStayForEdit(null);
              }}
              settings={settings}
              stays={stays}
              showToast={showToast}
              askConfirm={askConfirm}
            />
            <div className="mt-8 pt-8 border-t border-stone-100 grid grid-cols-1 gap-8">
              <HealthSection
                stay={selectedStayForEdit}
                onUpdate={onUpdate}
                showToast={showToast}
                askConfirm={askConfirm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HealthSummary({ stayId }: { stayId: number }) {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  useEffect(() => {
    fetch(`/api/health-logs/${stayId}`)
      .then((res) => res.json())
      .then(setLogs);
  }, [stayId]);

  if (logs.length === 0)
    return <span className="text-xs text-stone-400 italic">Aucun suivi</span>;

  const lastLog = logs[0];
  return (
    <div className="flex gap-1">
      {lastLog.ate_well ? (
        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded font-bold uppercase">
          OK
        </span>
      ) : (
        <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold uppercase">
          APPÉTIT
        </span>
      )}
      {lastLog.abnormal_behavior && (
        <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-bold uppercase">
          COMPORTEMENT
        </span>
      )}
    </div>
  );
}

function ContractsView({
  stays,
  settings,
  onUpdate,
  showToast,
  askConfirm,
}: {
  stays: Stay[];
  settings: Settings;
  onUpdate: () => void;
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const filteredStays = stays.filter(
    (s) =>
      s.cat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openBase64File = (base64String: string) => {
    if (!base64String) return;
    try {
      if (base64String.startsWith("http")) {
        window.open(base64String, "_blank");
        return;
      }
      const arr = base64String.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) {
        window.open(base64String, "_blank");
        return;
      }
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      const newTab = window.open(url, "_blank");
      // Release object URL after some time
      setTimeout(() => URL.revokeObjectURL(url), 1000 * 60);
      if (!newTab) {
        showToast(
          "Veuillez autoriser les pop-ups pour voir le document.",
          "error",
        );
      }
    } catch (e) {
      console.error(e);
      window.open(base64String, "_blank");
    }
  };

  const handleUploadScan = async (
    stay: Stay,
    file: File,
    docType: "contract" | "health_sheet" = "contract",
  ) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return showToast("Le fichier doit être une image ou un PDF.", "error");
    }

    setUploadingId(stay.id + "_" + docType);

    try {
      let base64 = "";
      if (file.type.startsWith("image/")) {
        // Compress image to save database space
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 1200;
              const MAX_HEIGHT = 1600;
              let width = img.width;
              let height = img.height;
              if (width > height && width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              } else if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.onerror = () =>
              reject(new Error("Erreur de compression d'image"));
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      } else {
        if (file.size > 1000000) {
          // 1MB max for PDF
          setUploadingId(null);
          return showToast("Le PDF est trop lourd (Max 1Mo).", "error");
        }
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      let updatePayload: Partial<Stay>;
      if (docType === "contract") {
        updatePayload = {
          contract_urls: [...(stay.contract_urls || []), base64],
        };
      } else {
        updatePayload = { health_sheet_scan_url: base64 };
      }

      const res = await fetch(`/api/stays/${stay.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...stay, ...updatePayload }),
      });
      if (!res.ok) throw new Error("Erreur de sauvegarde.");
      showToast("Document ajouté avec succès !");
      onUpdate();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setUploadingId(null);
    }
  };

  const removeContract = (stay: Stay, index: number) => {
    askConfirm(
      "Supprimer ce contrat ?",
      "Voulez-vous supprimer ce fichier de contrat ?",
      async () => {
        try {
          const updatedUrls = [...(stay.contract_urls || [])];
          updatedUrls.splice(index, 1);

          const res = await fetch(`/api/stays/${stay.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...stay, contract_urls: updatedUrls }),
          });
          if (!res.ok) throw new Error("Erreur de sauvegarde.");
          showToast("Contrat supprimé !");
          onUpdate();
        } catch (e: any) {
          showToast(e.message, "error");
        }
      },
    );
  };

  const removeHealthSheet = (stay: Stay) => {
    askConfirm(
      "Supprimer cette fiche sanitaire ?",
      "Voulez-vous supprimer ce fichier de fiche sanitaire ?",
      async () => {
        try {
          const res = await fetch(`/api/stays/${stay.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...stay, health_sheet_scan_url: null }),
          });
          if (!res.ok) throw new Error("Erreur de sauvegarde.");
          showToast("Fiche sanitaire supprimée !");
          onUpdate();
        } catch (e: any) {
          showToast(e.message, "error");
        }
      },
    );
  };

  const generateContractPDF = (stay: Stay) => {
    const doc = new jsPDF();

    // Logo
    if (settings.logo) {
      try {
        const formatMatch = settings.logo.match(
          /data:image\/([a-zA-Z]*);base64,/,
        );
        const imageFormat = formatMatch ? formatMatch[1].toUpperCase() : "JPEG";
        doc.addImage(settings.logo, imageFormat, 14, 10, 30, 30);
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
      }
    }

    doc.setFontSize(20);
    doc.text("Contrat de Pension", 105, 25, { align: "center" });

    // Company Info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");

    let yPos = 45;
    const companyName = settings.company_name || "LA PENSION DU CHEMIN VERT";
    const nameLines = doc.splitTextToSize(companyName, 120);
    doc.text(nameLines, 14, yPos);
    yPos += nameLines.length * 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (settings.company_owner) {
      doc.text(settings.company_owner, 14, yPos);
      yPos += 4;
    }
    if (settings.company_address) {
      const addrLines = doc.splitTextToSize(settings.company_address, 120);
      doc.text(addrLines, 14, yPos);
      yPos += addrLines.length * 4;
    }
    if (settings.company_phone) {
      doc.text(settings.company_phone, 14, yPos);
      yPos += 4;
    }
    if (settings.company_email) {
      doc.text(settings.company_email, 14, yPos);
      yPos += 4;
    }
    if (settings.company_siret) {
      doc.text(`SIRET : ${settings.company_siret}`, 14, yPos);
      yPos += 4;
    }
    if (settings.company_acaced) {
      doc.text(`ACACED : ${settings.company_acaced}`, 14, yPos);
      yPos += 4;
    }

    const clientInfoY = Math.max(95, yPos + 25);
    let currentY = clientInfoY;

    doc.setFontSize(12);
    doc.text(`Date d'édition: ${format(new Date(), "dd/MM/yyyy")}`, 140, 45);

    // Client & Animal Info (Side by Side)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Informations du Client", 14, currentY - 10);
    doc.text("Informations de l'Animal", 105, currentY - 10);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Left Column: Client
    doc.text(`Nom: ${stay.owner_name || "-"}`, 14, currentY);
    let leftY = currentY + 7;
    if (stay.owner_address) {
      const addrLines = doc.splitTextToSize(
        `Adresse: ${stay.owner_address}`,
        80,
      );
      doc.text(addrLines, 14, leftY);
      leftY += addrLines.length * 5;
    }
    if (stay.owner_phone) {
      const phoneLines = doc.splitTextToSize(
        `Téléphone: ${stay.owner_phone}`,
        80,
      );
      doc.text(phoneLines, 14, leftY);
      leftY += phoneLines.length * 5;
    }
    if (stay.owner_email) {
      doc.text(`Email: ${stay.owner_email}`, 14, leftY);
      leftY += 7;
    }

    // Right Column: Animal
    doc.text(`Nom: ${stay.cat_name || "-"}`, 105, currentY);
    let rightY = currentY + 7;
    doc.text(
      `Age: ${stay.cat_age || (stay.cat_birth_date ? calculateAge(stay.cat_birth_date) : "-")}`,
      105,
      rightY,
    );
    rightY += 7;
    doc.text(`Race: ${stay.cat_breed || "-"}`, 105, rightY);
    rightY += 7;
    doc.text(`Couleur: ${stay.cat_color || "-"}`, 105, rightY);
    rightY += 7;
    doc.text(`N° Puce: ${stay.cat_chip_number || "-"}`, 105, rightY);
    rightY += 7;

    // Health Info (Right Column)
    doc.setFont("helvetica", "bold");
    doc.text("Santé de l'animal:", 105, rightY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    rightY += 10;
    doc.text(
      `Vaccins (TC): ${formatDateSafe(stay.cat_vaccine_tc_date, "___/___/_____")}`,
      105,
      rightY,
    );
    rightY += 5;
    doc.text(
      `Leucose (L): ${formatDateSafe(stay.cat_vaccine_l_date, "___/___/_____")}`,
      105,
      rightY,
    );
    rightY += 5;
    doc.text(
      `Parasitaire: ${formatDateSafe(stay.cat_parasite_treatment_date, "___/___/_____")}`,
      105,
      rightY,
    );
    rightY += 5;

    // Stay Details (Below Client Info)
    currentY = Math.max(leftY, rightY) + 15;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Détails du Séjour", 14, currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    currentY += 10;
    doc.text(
      `Date d'arrivée: ${format(new Date(stay.arrival_date), "dd/MM/yyyy")}`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(
      `Date de départ prévue: ${format(new Date(stay.planned_departure), "dd/MM/yyyy")}`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(`Box attribué: ${stay.box_number}`, 14, currentY);
    currentY += 7;

    currentY += 10;

    if (settings.general_conditions) {
      doc.setFontSize(14);
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.text("Conditions Générales", 14, currentY);
      currentY += 10;
      doc.setFontSize(8);

      const splitText = doc.splitTextToSize(settings.general_conditions, 180);
      for (let i = 0; i < splitText.length; i++) {
        if (currentY > 280) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(splitText[i], 14, currentY);
        currentY += 4;
      }
      currentY += 10;
    }

    // Signatures
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.text("Signatures", 14, currentY);
    doc.setFontSize(10);
    doc.text("Le Client (lu et approuvé)", 14, currentY + 10);
    doc.text(settings.company_name || "La Pension", 120, currentY + 10);

    doc.save(
      `Contrat_${stay.owner_name}_${stay.cat_name}_${stay.arrival_date}.pdf`,
    );
  };

  const generateHealthSheetPDF = (stay: Stay) => {
    const doc = new jsPDF();

    // Logo
    if (settings.logo) {
      try {
        const formatMatch = settings.logo.match(
          /data:image\/([a-zA-Z]*);base64,/,
        );
        const imageFormat = formatMatch ? formatMatch[1].toUpperCase() : "JPEG";
        doc.addImage(settings.logo, imageFormat, 14, 10, 30, 30);
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
      }
    }

    doc.setFontSize(20);
    doc.text("Fiche d'admission et de suivi sanitaire", 105, 25, {
      align: "center",
    });

    // Company Info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");

    let yPos = 45;
    const companyName = settings.company_name || "LA PENSION DU CHEMIN VERT";
    const nameLines = doc.splitTextToSize(companyName, 120);
    doc.text(nameLines, 14, yPos);
    yPos += nameLines.length * 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (settings.company_owner) {
      doc.text(settings.company_owner, 14, yPos);
      yPos += 4;
    }
    if (settings.company_address) {
      const addrLines = doc.splitTextToSize(settings.company_address, 120);
      doc.text(addrLines, 14, yPos);
      yPos += addrLines.length * 4;
    }
    if (settings.company_phone) {
      doc.text(settings.company_phone, 14, yPos);
      yPos += 4;
    }
    if (settings.company_email) {
      doc.text(settings.company_email, 14, yPos);
      yPos += 4;
    }
    if (settings.company_siret) {
      doc.text(`SIRET : ${settings.company_siret}`, 14, yPos);
      yPos += 4;
    }
    if (settings.company_acaced) {
      doc.text(`ACACED : ${settings.company_acaced}`, 14, yPos);
      yPos += 4;
    }

    const clientInfoY = Math.max(95, yPos + 25);
    let currentY = clientInfoY;

    doc.setFontSize(12);
    doc.text(`Date d'édition: ${format(new Date(), "dd/MM/yyyy")}`, 140, 45);

    // Client & Animal Info (Side by Side)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Informations du Client", 14, currentY - 10);
    doc.text("Informations de l'Animal", 105, currentY - 10);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Left Column: Client
    doc.text(`Nom: ${stay.owner_name || "-"}`, 14, currentY);
    let leftY = currentY + 7;
    if (stay.owner_address) {
      const addrLines = doc.splitTextToSize(
        `Adresse: ${stay.owner_address}`,
        80,
      );
      doc.text(addrLines, 14, leftY);
      leftY += addrLines.length * 5;
    }
    if (stay.owner_phone) {
      const phoneLines = doc.splitTextToSize(
        `Téléphone: ${stay.owner_phone}`,
        80,
      );
      doc.text(phoneLines, 14, leftY);
      leftY += phoneLines.length * 5;
    }
    if (stay.owner_email) {
      doc.text(`Email: ${stay.owner_email}`, 14, leftY);
      leftY += 7;
    }

    // Right Column: Animal
    doc.text(`Nom: ${stay.cat_name || "-"}`, 105, currentY);
    let rightY = currentY + 7;
    doc.text(
      `Age: ${stay.cat_age || (stay.cat_birth_date ? calculateAge(stay.cat_birth_date) : "-")}`,
      105,
      rightY,
    );
    rightY += 7;
    doc.text(`Race: ${stay.cat_breed || "-"}`, 105, rightY);
    rightY += 7;
    doc.text(`Couleur: ${stay.cat_color || "-"}`, 105, rightY);
    rightY += 7;
    doc.text(`N° Puce: ${stay.cat_chip_number || "-"}`, 105, rightY);
    rightY += 7;

    // Health Info (Right Column)
    doc.setFont("helvetica", "bold");
    doc.text("Santé de l'animal:", 105, rightY + 5);
    doc.setFont("helvetica", "normal");
    rightY += 10;
    doc.text(
      `Vaccins (TC): ${formatDateSafe(stay.cat_vaccine_tc_date, "___/___/_____")}`,
      105,
      rightY,
    );
    rightY += 5;
    doc.text(
      `Leucose (L): ${formatDateSafe(stay.cat_vaccine_l_date, "___/___/_____")}`,
      105,
      rightY,
    );
    rightY += 5;
    doc.text(
      `Parasitaire: ${formatDateSafe(stay.cat_parasite_treatment_date, "___/___/_____")}`,
      105,
      rightY,
    );
    rightY += 5;

    // Stay Details (Below Client Info)
    currentY = Math.max(leftY, rightY) + 15;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Détails du Séjour", 14, currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    currentY += 10;
    doc.text(
      `Date d'arrivée: ${format(new Date(stay.arrival_date), "dd/MM/yyyy")}`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(
      `Date de départ prévue: ${format(new Date(stay.planned_departure), "dd/MM/yyyy")}`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(`Box attribué: ${stay.box_number}`, 14, currentY);
    currentY += 7;

    currentY += 15;

    // Health Checkboxes
    const rawHealth =
      settings.health_conditions ||
      "Nez qui coule\nYeux qui pleurent\nDémangeaisons";
    const healthOptions = rawHealth
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Poids de l'animal à l'arrivée :", 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(".......................... kg", 75, currentY);
    currentY += 15;

    if (healthOptions.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        "État de santé à l'arrivée (à cocher par le client) :",
        14,
        currentY,
      );
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      let startY = currentY;
      healthOptions.forEach((opt: string, index: number) => {
        const xPos = index % 2 === 0 ? 14 : 105;
        const yPosRect = startY + Math.floor(index / 2) * 8;

        if (yPosRect > 280) {
          doc.addPage();
          startY = 20 - Math.floor(index / 2) * 8;
        }

        doc.rect(xPos, yPosRect - 3, 4, 4);
        doc.text(opt, xPos + 6, yPosRect);
        currentY = yPosRect + 8;
      });

      // Champ libre pour Autre
      const otherIndex = healthOptions.length;
      const xOther = otherIndex % 2 === 0 ? 14 : 105;
      const yOther = startY + Math.floor(otherIndex / 2) * 8;
      doc.rect(xOther, yOther - 3, 4, 4);
      doc.text(
        "Autre (préciser) : ............................................................................",
        xOther + 6,
        yOther,
      );

      currentY = yOther + 15;
    }

    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Medications
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Prise de médicaments / Posologie :", 14, currentY);
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      ".....................................................................................................................................................",
      14,
      currentY,
    );
    currentY += 8;
    doc.text(
      ".....................................................................................................................................................",
      14,
      currentY,
    );
    currentY += 15;

    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    // Routine Alimentaire
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ROUTINE ALIMENTAIRE", 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.text("Type d'alimentation :", 14, currentY);
    currentY += 6;
    doc.setFont("helvetica", "normal");

    const alimentairesTypes = ["Croquettes", "Pâtée", "Mixte", "Humide"];
    alimentairesTypes.forEach((t, i) => {
      doc.rect(14 + i * 35, currentY - 3, 4, 4);
      doc.text(t, 20 + i * 35, currentY);
    });
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Quantité totale par jour :", 14, currentY);
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.text(
      "- de croquettes : ..................................................................................................................",
      14,
      currentY,
    );
    currentY += 6;
    doc.text(
      "- sachets ou boîtes de pâtée : .....................................................................................................",
      14,
      currentY,
    );
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Mode de distribution :", 14, currentY);
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.rect(14, currentY - 3, 4, 4);
    doc.text(
      "À volonté (Le chat se régule seul sur sa journée).",
      20,
      currentY,
    );
    currentY += 8;
    doc.rect(14, currentY - 3, 4, 4);
    doc.text("Fractionné en ........ repas par jour.", 20, currentY);
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Consignes particulières / Restrictions :", 14, currentY);
    currentY += 8;
    doc.setFont("helvetica", "normal");
    doc.text(
      ".....................................................................................................................................................",
      14,
      currentY,
    );
    currentY += 8;
    doc.text(
      ".....................................................................................................................................................",
      14,
      currentY,
    );
    currentY += 8;
    doc.text(
      ".....................................................................................................................................................",
      14,
      currentY,
    );
    currentY += 15;

    // Signatures
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.text("Signatures", 14, currentY);
    doc.setFontSize(10);
    doc.text("Le Client (lu et approuvé)", 14, currentY + 10);
    doc.text(settings.company_name || "La Pension", 120, currentY + 10);

    doc.save(
      `Fiche_Sanitaire_${stay.owner_name}_${stay.cat_name}_${stay.arrival_date}.pdf`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-[#E5DED2] shadow-sm">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900">
          Contrats & Fiches Sanitaires
        </h2>
        <div className="relative w-full sm:w-56">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            placeholder="Rechercher un séjour..."
            className="pl-8 pr-3 py-1.5 bg-[#FAF8F4] border border-[#E4DDD1] rounded-lg text-xs w-full outline-none focus:bg-white focus:border-emerald-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED2] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px] text-[13px]">
          <thead>
            <tr className="bg-[#F4F0E8] border-b border-[#E5DED2]">
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                ID
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                Client
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                Animal
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                Dates
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStays.map((stay) => (
              <tr
                key={stay.id}
                className="border-b border-[#F0E9DC] hover:bg-[#FAF8F4] transition-colors"
              >
                <td className="px-3.5 py-2.5 text-xs font-semibold text-stone-400 tabular-nums">
                  #{stay.id}
                </td>
                <td className="px-3.5 py-2.5 font-medium text-stone-700">
                  {stay.owner_name}
                </td>
                <td className="px-3.5 py-2.5 font-semibold text-stone-900">{stay.cat_name}</td>
                <td className="px-3.5 py-2.5 text-xs text-stone-600 tabular-nums">
                  {format(new Date(stay.arrival_date), "dd/MM/yyyy")} au{" "}
                  {format(new Date(stay.planned_departure), "dd/MM/yyyy")}
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateContractPDF(stay)}
                          className="text-sky-700 hover:text-sky-900 text-xs font-semibold bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                          title="Générer le contrat"
                        >
                          <FileText size={14} /> Contrat
                        </button>
                        {(stay.contract_urls || []).length === 0 &&
                          !uploadingId && (
                            <label
                              className={`cursor-pointer text-emerald-800 hover:text-emerald-950 text-xs font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${uploadingId === stay.id + "_contract" ? "opacity-50 pointer-events-none" : ""}`}
                            >
                              <Upload size={14} />{" "}
                              {uploadingId === stay.id + "_contract"
                                ? "Envoi..."
                                : "Uploader Signé"}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  if (e.target.files?.[0])
                                    handleUploadScan(
                                      stay,
                                      e.target.files[0],
                                      "contract",
                                    );
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        {(stay.contract_urls || []).map((url, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-0 group/item"
                          >
                            <button
                              onClick={() => openBase64File(url)}
                              className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1 rounded-l-lg text-[10px] font-semibold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                            >
                              <FileText size={12} /> C{idx + 1}
                            </button>
                            <button
                              onClick={() => removeContract(stay, idx)}
                              className="bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-1 rounded-r-lg hover:bg-rose-100 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateHealthSheetPDF(stay)}
                          className="text-amber-800 hover:text-amber-950 text-xs font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                          title="Générer la fiche d'admission"
                        >
                          <HeartPulse size={14} /> Fiche Sanitaire
                        </button>
                        {!stay.health_sheet_scan_url && !uploadingId && (
                          <label
                            className={`cursor-pointer text-emerald-800 hover:text-emerald-950 text-xs font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${uploadingId === stay.id + "_health_sheet" ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            <Upload size={14} />{" "}
                            {uploadingId === stay.id + "_health_sheet"
                              ? "Envoi..."
                              : "Uploader Signé"}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                if (e.target.files?.[0])
                                  handleUploadScan(
                                    stay,
                                    e.target.files[0],
                                    "health_sheet",
                                  );
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                        {stay.health_sheet_scan_url && (
                          <div className="flex items-center gap-0 group/item">
                            <button
                              onClick={() =>
                                openBase64File(stay.health_sheet_scan_url!)
                              }
                              className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1 rounded-l-lg text-[10px] font-semibold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                            >
                              <HeartPulse size={12} /> Signée
                            </button>
                            <button
                              onClick={() => removeHealthSheet(stay)}
                              className="bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-1 rounded-r-lg hover:bg-rose-100 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {uploadingId?.startsWith(stay.id) && (
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          Téléchargement en cours...
                        </span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStays.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-stone-400">
                  Aucun séjour trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const BILLING_MONTH_OPTIONS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

const BILLING_QUARTER_OPTIONS = [
  { value: 1, label: "T1 (Jan - Mar)" },
  { value: 2, label: "T2 (Avr - Jun)" },
  { value: 3, label: "T3 (Jul - Sep)" },
  { value: 4, label: "T4 (Oct - Déc)" },
];

const matchesBillingPeriod = (
  dateStr: string | undefined,
  mode: "month" | "quarter" | "year",
  year: string,
  month: string,
  quarter: number,
) => {
  if (!dateStr || dateStr.length < 4) return false;
  if (dateStr.substring(0, 4) !== year) return false;
  if (mode === "year") return true;
  const m = parseInt(dateStr.substring(5, 7), 10);
  if (Number.isNaN(m)) return false;
  if (mode === "month") return dateStr.substring(5, 7) === month;
  const startMonth = (quarter - 1) * 3 + 1;
  return m >= startMonth && m <= startMonth + 2;
};

const getInvoiceEncashedAmount = (inv: Invoice) => {
  const isEncashed =
    !inv.status || inv.status === "paid" || inv.status === "partially_paid";
  if (!isEncashed) return 0;
  return inv.type === "final"
    ? inv.amount - (inv.deposit_amount || 0)
    : inv.amount;
};

function AllInvoicesView({
  settings,
  onUpdate,
  stays,
  clients,
  showToast,
  askConfirm,
  initialMonth,
  onClearInitialMonth,
  showHiddenMenu = false,
}: {
  settings: Settings;
  onUpdate: () => void;
  stays: Stay[];
  clients: Client[];
  showToast: (m: string, t?: "success" | "error") => void;
  askConfirm: (t: string, m: string, c: () => void, d?: boolean) => void;
  initialMonth?: string | null;
  onClearInitialMonth?: () => void;
  showHiddenMenu?: boolean;
}) {
  const now = new Date();
  const currentYearStr = format(now, "yyyy");
  const currentMonthStr = format(now, "MM");
  const currentQuarterNum = Math.floor(now.getMonth() / 3) + 1;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<"month" | "quarter" | "year">(
    "month",
  );
  const [selectedYear, setSelectedYear] = useState(
    initialMonth && /^\d{4}-\d{2}$/.test(initialMonth)
      ? initialMonth.substring(0, 4)
      : currentYearStr,
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth && /^\d{4}-\d{2}$/.test(initialMonth)
      ? initialMonth.substring(5, 7)
      : currentMonthStr,
  );
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterNum);

  useEffect(() => {
    if (initialMonth && /^\d{4}-\d{2}$/.test(initialMonth)) {
      setPeriodType("month");
      setSelectedYear(initialMonth.substring(0, 4));
      setSelectedMonth(initialMonth.substring(5, 7));
      if (onClearInitialMonth) onClearInitialMonth();
    }
  }, [initialMonth]);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchStay, setSearchStay] = useState("");

  // Hidden complementary menu state
  const [hiddenEntries, setHiddenEntries] = useState<BillingAdjustment[]>([]);
  const [entryDate, setEntryDate] = useState(format(now, "yyyy-MM-dd"));
  const [entryClientId, setEntryClientId] = useState("");
  const [entryComment, setEntryComment] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);
  const [hiddenPeriodType, setHiddenPeriodType] = useState<
    "month" | "quarter" | "year"
  >("month");
  const [hiddenYear, setHiddenYear] = useState(currentYearStr);
  const [hiddenMonth, setHiddenMonth] = useState(currentMonthStr);
  const [hiddenQuarter, setHiddenQuarter] = useState(currentQuarterNum);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices/all");
      setInvoices(await res.json());
    } catch (err) {
      showToast("Erreur lors de la récupération des factures", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (!showHiddenMenu) return;
    const unsubscribe = subscribeBillingAdjustments((items) => {
      setHiddenEntries(items);
    });
    return () => unsubscribe();
  }, [showHiddenMenu]);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "fr", { sensitivity: "base" }),
    );
  }, [clients]);

  const availableInvoiceYears = useMemo(() => {
    const years = new Set<string>([currentYearStr, selectedYear]);
    invoices.forEach((inv) => {
      const y = inv.created_at?.substring(0, 4);
      if (y && /^\d{4}$/.test(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [invoices, currentYearStr, selectedYear]);

  const availableHiddenYears = useMemo(() => {
    const years = new Set<string>([currentYearStr, hiddenYear]);
    invoices.forEach((inv) => {
      const y = inv.created_at?.substring(0, 4);
      if (y && /^\d{4}$/.test(y)) years.add(y);
    });
    hiddenEntries.forEach((entry) => {
      const y = entry.date?.substring(0, 4);
      if (y && /^\d{4}$/.test(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [invoices, hiddenEntries, currentYearStr, hiddenYear]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchPeriod = matchesBillingPeriod(
        inv.created_at,
        periodType,
        selectedYear,
        selectedMonth,
        selectedQuarter,
      );
      const matchStatus = filterStatus === "all" || inv.status === filterStatus;
      return matchPeriod && matchStatus;
    });
  }, [
    invoices,
    periodType,
    selectedYear,
    selectedMonth,
    selectedQuarter,
    filterStatus,
  ]);

  const totalCA = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, inv) => acc + getInvoiceEncashedAmount(inv),
      0,
    );
  }, [filteredInvoices]);

  const filteredHiddenEntries = useMemo(() => {
    return hiddenEntries
      .filter((entry) =>
        matchesBillingPeriod(
          entry.date,
          hiddenPeriodType,
          hiddenYear,
          hiddenMonth,
          hiddenQuarter,
        ),
      )
      .sort((a, b) => {
        const cmpDate = (b.date || "").localeCompare(a.date || "");
        if (cmpDate !== 0) return cmpDate;
        return (b.created_at || "").localeCompare(a.created_at || "");
      });
  }, [
    hiddenEntries,
    hiddenPeriodType,
    hiddenYear,
    hiddenMonth,
    hiddenQuarter,
  ]);

  const hiddenPeriodTotal = useMemo(() => {
    return filteredHiddenEntries.reduce(
      (acc, entry) => acc + (Number(entry.amount) || 0),
      0,
    );
  }, [filteredHiddenEntries]);

  const officialPeriodCAForHidden = useMemo(() => {
    return invoices
      .filter((inv) =>
        matchesBillingPeriod(
          inv.created_at,
          hiddenPeriodType,
          hiddenYear,
          hiddenMonth,
          hiddenQuarter,
        ),
      )
      .reduce((acc, inv) => acc + getInvoiceEncashedAmount(inv), 0);
  }, [invoices, hiddenPeriodType, hiddenYear, hiddenMonth, hiddenQuarter]);

  const combinedHiddenAndOfficialTotal =
    hiddenPeriodTotal + officialPeriodCAForHidden;

  const handleAddHiddenEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDate) {
      showToast("Veuillez saisir une date", "error");
      return;
    }
    if (!entryClientId) {
      showToast("Veuillez sélectionner un client", "error");
      return;
    }
    const parsedAmount = Number(entryAmount);
    if (entryAmount.trim() === "" || Number.isNaN(parsedAmount)) {
      showToast("Veuillez saisir un montant valide", "error");
      return;
    }

    const selectedClient = clients.find(
      (c) => String(c.id) === String(entryClientId),
    );
    setSavingEntry(true);
    try {
      const res = await fetch("/api/billing-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: entryDate,
          client_id: entryClientId,
          client_name: selectedClient?.name || "",
          comment: entryComment.trim(),
          amount: parsedAmount,
          created_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      setEntryComment("");
      setEntryAmount("");
      setEntryClientId("");
      showToast("Entrée ajoutée !");
    } catch {
      showToast("Erreur lors de l'ajout de l'entrée", "error");
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteHiddenEntry = (entry: BillingAdjustment) => {
    askConfirm(
      "Supprimer cette entrée ?",
      "Voulez-vous supprimer définitivement cette ligne de la base de données ?",
      async () => {
        try {
          const res = await fetch(`/api/billing-adjustments/${entry.id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error();
          showToast("Entrée supprimée !");
        } catch {
          showToast("Erreur lors de la suppression", "error");
        }
      },
      true,
    );
  };

  const handleQuickPaid = async (inv: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inv, status: "paid" }),
      });
      if (!res.ok) throw new Error();
      showToast("Facture marquée comme Payée !");
      fetchInvoices();
      onUpdate();
    } catch (e) {
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-stone-500">
        Chargement des données comptables...
      </div>
    );

  const currentStay = stays.find((s) => s.id === selectedStayId);

  return (
    <div className="space-y-4">
      {/* Stay Selector Modal for NEW invoice */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 transform animate-in zoom-in-95 duration-200 border border-stone-100">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight">
                Nouvelle Facture
              </h3>
              <button
                onClick={() => setIsAddingNew(false)}
                className="p-1.5 hover:bg-stone-50 rounded-full transition-colors"
              >
                <X size={20} className="text-stone-400" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-stone-500 text-xs font-medium">
                Sélectionnez le séjour concerné :
              </p>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-2.5 pl-9 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Rechercher Client ou Animal..."
                  value={searchStay}
                  onChange={(e) => setSearchStay(e.target.value)}
                />
                <Edit
                  className="absolute left-3 top-2.5 text-stone-300"
                  size={16}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {stays
                  .filter(
                    (s) =>
                      s.owner_name
                        ?.toLowerCase()
                        .includes(searchStay.toLowerCase()) ||
                      s.cat_name
                        ?.toLowerCase()
                        .includes(searchStay.toLowerCase()),
                  )
                  .slice(0, 10)
                  .map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStayId(s.id);
                        setIsAddingNew(false);
                      }}
                      className="w-full p-3 text-left bg-stone-50 hover:bg-emerald-50 border border-stone-100 rounded-xl transition-all flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-semibold text-xs text-stone-900 group-hover:text-emerald-700">
                          {s.owner_name}
                        </p>
                        <p className="text-[11px] text-stone-400 font-medium italic group-hover:text-emerald-600">
                          Pour {s.cat_name} ({formatDateSafe(s.arrival_date)})
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-stone-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"
                      />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Form Modal (when a stay is selected) */}
      {selectedStayId && currentStay && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 space-y-4 transform animate-in zoom-in-95 duration-200 border border-stone-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight">
                  Gestion Facture
                </h3>
                <p className="text-stone-400 text-xs font-medium italic">
                  {currentStay.owner_name} • {currentStay.cat_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedStayId(null);
                  fetchInvoices();
                }}
                className="p-1.5 hover:bg-stone-50 rounded-full transition-colors"
              >
                <X size={20} className="text-stone-400" />
              </button>
            </div>

            <InvoiceSection
              stay={currentStay}
              settings={settings}
              showToast={showToast}
              askConfirm={askConfirm}
              onUpdate={() => {
                fetchInvoices();
                onUpdate();
              }}
            />

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedStayId(null);
                  fetchInvoices();
                }}
                className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl font-semibold text-xs hover:bg-stone-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#E5DED2]">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-stone-900 tracking-tight">
            Journal des Facturations
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            Pilotage de la trésorerie et suivi des encaissements
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-[#13382C] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#0E2B22] transition-all shadow-sm active:scale-95"
          >
            <Plus size={15} /> Nouvelle Facture
          </button>
          <div className="bg-amber-50 text-amber-950 border border-amber-200 py-2 px-4 rounded-xl flex flex-col items-center min-w-[140px] tabular-nums">
            <span className="text-[10px] font-semibold text-amber-800">
              CA Encaissé (Période)
            </span>
            <span className="text-lg font-bold">{totalCA.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5DED2] space-y-4">
        <div className="flex flex-wrap items-center gap-2 bg-[#FAF8F4] border border-[#EDE6DA] p-1.5 rounded-xl">
          <div className="inline-flex items-center rounded-lg bg-[#EFE9DD] p-0.5 border border-[#E4DDD1]">
            {(
              [
                { id: "month", label: "Mois" },
                { id: "quarter", label: "Trimestre" },
                { id: "year", label: "Année" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriodType(opt.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  periodType === opt.id
                    ? "bg-[#13382C] text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {periodType === "month" && (
            <select
              className="min-w-[130px] p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {BILLING_MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          )}

          {periodType === "quarter" && (
            <select
              className="min-w-[140px] p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all"
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
            >
              {BILLING_QUARTER_OPTIONS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
          )}

          <select
            className="min-w-[95px] p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all tabular-nums"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableInvoiceYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="flex-1 min-w-[160px] p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(
              settings.invoice_statuses || DEFAULT_INVOICE_STATUS_LABELS,
            ).map(([val, config]) => (
              <option key={val} value={val}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#EDE6DA]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#F4F0E8] border-b border-[#E5DED2] text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                <th className="px-3.5 py-2.5">Date</th>
                <th className="px-3.5 py-2.5">N° Facture</th>
                <th className="px-3.5 py-2.5">Client / Animal</th>
                <th className="px-3.5 py-2.5">Statut / Paiement</th>
                <th className="px-3.5 py-2.5">Montant</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E9DC]">
              {filteredInvoices.map((inv) => {
                const statusConfig = getInvoiceStatusConfig(
                  inv.status,
                  settings,
                );
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#FAF8F4] transition-colors group"
                  >
                    <td className="px-3.5 py-2.5 text-xs text-stone-500 font-medium tabular-nums">
                      {formatDateSafe(inv.created_at)}
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-stone-900 tabular-nums">
                      {inv.invoice_number}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-stone-800">
                          {inv.owner_name || "-"}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {inv.cat_name || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <div
                          onClick={() =>
                            inv.status === "partially_paid" &&
                            handleQuickPaid(inv)
                          }
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold w-fit flex items-center gap-1 border transition-all cursor-default ${inv.status === "partially_paid" ? "hover:bg-emerald-600 hover:text-white hover:border-emerald-600 cursor-pointer" : ""} ${statusConfig.bg} ${statusConfig.color} border-current/20`}
                          title={
                            inv.status === "partially_paid"
                              ? "Cliquer pour marquer comme Payé"
                              : ""
                          }
                        >
                          {inv.status === "partially_paid" && (
                            <CreditCard size={11} />
                          )}
                          {statusConfig.label}
                        </div>
                        {inv.payment_method && (
                          <span className="text-[10px] text-stone-400 font-medium ml-0.5">
                            {inv.payment_method}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 tabular-nums">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900 text-sm">
                          {inv.type === "final"
                            ? (inv.amount - (inv.deposit_amount || 0)).toFixed(
                                2,
                              )
                            : inv.amount.toFixed(2)}{" "}
                          €
                        </span>
                        {inv.type === "final" && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                            Final (Acompte déduit)
                          </span>
                        )}
                        {inv.type === "deposit" && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                            Acompte
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          title="Gérer / Éditer"
                          onClick={() => setSelectedStayId(inv.stay_id)}
                          className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => {
                            askConfirm(
                              "Supprimer la facture ?",
                              "Supprimer définitivement cette facture ? Cela impactera le CA.",
                              async () => {
                                try {
                                  const res = await fetch(
                                    `/api/invoices/${inv.id}`,
                                    { method: "DELETE" },
                                  );
                                  if (!res.ok) throw new Error();
                                  showToast("Facture supprimée !");
                                  fetchInvoices();
                                  onUpdate();
                                } catch (err) {
                                  showToast("Erreur suppression", "error");
                                }
                              },
                              true,
                            );
                          }}
                          className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="bg-stone-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="text-stone-300" size={24} />
                    </div>
                    <h4 className="text-sm text-stone-900 font-bold">
                      Aucune facturation
                    </h4>
                    <p className="text-stone-400 text-xs">
                      Ajustez vos filtres ou créez votre première facture.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showHiddenMenu && (
        <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border-2 border-emerald-900/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EDE6DA]">
            <div>
              <h3 className="font-display text-base sm:text-lg font-semibold text-[#13382C] tracking-tight">
                Suivi Complémentaire
              </h3>
              <p className="text-[11px] text-stone-500">
                Registre privé synchronisé sur vos appareils (exclu des factures
                officielles, statistiques et exports)
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#FAF8F4] border border-[#E4DDD1] text-stone-700 tabular-nums self-start sm:self-auto">
              {filteredHiddenEntries.length} ligne
              {filteredHiddenEntries.length > 1 ? "s" : ""} sur la période
            </span>
          </div>

          {/* Quick-Add Form */}
          <form
            onSubmit={handleAddHiddenEntry}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-[#FAF8F4] p-3 rounded-xl border border-[#EDE6DA]"
          >
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-semibold text-stone-500 uppercase">
                Date
              </label>
              <input
                type="date"
                required
                className="w-full p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-medium text-stone-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 tabular-nums"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-semibold text-stone-500 uppercase">
                Client
              </label>
              <select
                required
                className="w-full p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-medium text-stone-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20"
                value={entryClientId}
                onChange={(e) => setEntryClientId(e.target.value)}
              >
                <option value="">Sélectionner un client...</option>
                {sortedClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className="text-[10px] font-semibold text-stone-500 uppercase">
                Commentaire
              </label>
              <input
                type="text"
                placeholder="Commentaire..."
                className="w-full p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs text-stone-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20"
                value={entryComment}
                onChange={(e) => setEntryComment(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-semibold text-stone-500 uppercase">
                Montant (€)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 tabular-nums"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
              />
            </div>

            <div className="sm:col-span-1 flex justify-end">
              <button
                type="submit"
                disabled={savingEntry}
                title="Ajouter la ligne"
                aria-label="Ajouter la ligne"
                className="w-full sm:w-10 h-[34px] bg-[#13382C] hover:bg-[#0E2B22] text-white rounded-lg font-semibold flex items-center justify-center transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </div>
          </form>

          {/* Period Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-[#FAF8F4] border border-[#EDE6DA] p-1.5 rounded-xl">
            <div className="inline-flex items-center rounded-lg bg-[#EFE9DD] p-0.5 border border-[#E4DDD1]">
              {(
                [
                  { id: "month", label: "Mois" },
                  { id: "quarter", label: "Trimestre" },
                  { id: "year", label: "Année" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHiddenPeriodType(opt.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    hiddenPeriodType === opt.id
                      ? "bg-[#13382C] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {hiddenPeriodType === "month" && (
              <select
                className="min-w-[130px] p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20"
                value={hiddenMonth}
                onChange={(e) => setHiddenMonth(e.target.value)}
              >
                {BILLING_MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}

            {hiddenPeriodType === "quarter" && (
              <select
                className="min-w-[140px] p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20"
                value={hiddenQuarter}
                onChange={(e) => setHiddenQuarter(Number(e.target.value))}
              >
                {BILLING_QUARTER_OPTIONS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            )}

            <select
              className="min-w-[95px] p-2 bg-white border border-[#E4DDD1] rounded-lg text-xs font-semibold text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 tabular-nums"
              value={hiddenYear}
              onChange={(e) => setHiddenYear(e.target.value)}
            >
              {availableHiddenYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Entries Table */}
          <div className="overflow-x-auto rounded-xl border border-[#EDE6DA]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F4F0E8] border-b border-[#E5DED2] text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Client</th>
                  <th className="px-3.5 py-2.5">Commentaire</th>
                  <th className="px-3.5 py-2.5 text-right">Montant</th>
                  <th className="px-3.5 py-2.5 text-right w-14">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E9DC]">
                {filteredHiddenEntries.map((entry) => {
                  const matchedClient = clients.find(
                    (c) => String(c.id) === String(entry.client_id),
                  );
                  const displayClient =
                    matchedClient?.name || entry.client_name || "Client inconnu";
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#FAF8F4] transition-colors"
                    >
                      <td className="px-3.5 py-2.5 text-xs text-stone-600 font-medium tabular-nums whitespace-nowrap">
                        {formatDateSafe(entry.date)}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-stone-800">
                        {displayClient}
                      </td>
                      <td className="px-3.5 py-2.5 text-stone-600">
                        {entry.comment || (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-stone-900 tabular-nums whitespace-nowrap">
                        {(Number(entry.amount) || 0).toFixed(2)} €
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          type="button"
                          title="Supprimer"
                          onClick={() => handleDeleteHiddenEntry(entry)}
                          className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredHiddenEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-xs text-stone-400"
                    >
                      Aucune entrée sur cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Footer (Always visible) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E5DED2] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase">
                Total période
              </span>
              <span className="text-lg font-bold text-stone-900 tabular-nums mt-1">
                {hiddenPeriodTotal.toFixed(2)} €
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-amber-800 uppercase">
                Chiffre d'affaires (période)
              </span>
              <span className="text-lg font-bold text-amber-950 tabular-nums mt-1">
                {officialPeriodCAForHidden.toFixed(2)} €
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#13382C] text-white border border-[#13382C] flex flex-col justify-between shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-200 uppercase">
                Total cumulé (Période + CA)
              </span>
              <span className="text-lg font-bold text-white tabular-nums mt-1">
                {combinedHiddenAndOfficialTotal.toFixed(2)} €
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function NavItem({
  active,
  onClick,
  onContextMenu,
  icon,
  label,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onContextMenu?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 whitespace-nowrap ${
        active
          ? "bg-[#EFF4F0] text-[#13382C] font-semibold shadow-sm"
          : "text-[#C7DCD1] hover:bg-white/10 hover:text-white font-medium"
      }`}
    >
      <span className={active ? "text-emerald-700" : "text-amber-200/80"}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
