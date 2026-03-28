"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Gamepad2,
  GraduationCap,
  Info,
  KeyRound,
  Mail,
  RefreshCw,
  Scale,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

const HERO_POINTS = [
  "Vous voyez immédiatement l’impact comptable de chaque décision.",
  "Le bilan & le compte de résultat évoluent pendant la partie.",
  "Le rythme est pensé pour apprendre sans décrocher.",
];

const SUPPORT_NUMBERS = [
  { value: "4", label: "univers d’entreprise" },
  { value: "8", label: "décisions par trimestre" },
  { value: "1h", label: "pour une partie complète" },
];

const AUDIENCE_STRIPS = [
  "Lycées, BTS & CFA",
  "CCI & organismes de formation",
  "Animation en classe ou en autonomie",
];

const LEARNING_PILLARS = [
  {
    title: "Voir",
    text: "Les mécanismes comptables deviennent visibles au lieu de rester abstraits.",
    icon: Scale,
  },
  {
    title: "Décider",
    text: "Achats, ventes, trésorerie, recrutement : chaque choix change l’équilibre.",
    icon: Building2,
  },
  {
    title: "Comprendre",
    text: "Les QCM et le score final transforment l’action en raisonnement solide.",
    icon: BookOpen,
  },
];

const JOURNEY_STEPS = [
  {
    index: "01",
    title: "Choisissez une entreprise",
    text: "Manufacture, transport, commerce ou labo : chaque partie a sa personnalité.",
  },
  {
    index: "02",
    title: "Pilotez trimestre après trimestre",
    text: "Charges, achats, créances, ventes, événements et arbitrages stratégiques.",
  },
  {
    index: "03",
    title: "Lisez les conséquences",
    text: "Résultat net, trésorerie, solvabilité et équilibre du bilan deviennent concrets.",
  },
  {
    index: "04",
    title: "Ancrez les bons réflexes",
    text: "Les notions ne sont plus récitées : elles sont vécues, testées, retenues.",
  },
];

const ENTRY_OPTIONS = [
  {
    title: "J’ai un code",
    subtitle: "Rejoindre une session en quelques secondes",
    description: "Entrez le code donné par votre formateur et commencez directement.",
    accent: "emerald",
    icon: KeyRound,
  },
  {
    title: "Je joue seul",
    subtitle: "S’entraîner à son rythme",
    description: "Partie autonome, historique sauvegardé et progression dans votre compte.",
    accent: "cyan",
    icon: Gamepad2,
    href: "/auth/register?redirectTo=/jeu&orgType=individuel",
    cta: "Créer Mon Accès",
  },
  {
    title: "Je suis formateur",
    subtitle: "Animer et suivre une classe",
    description: "Créez des sessions, partagez un code, récupérez les résultats.",
    accent: "amber",
    icon: GraduationCap,
    href: "/auth/login",
    cta: "Ouvrir Le Tableau De Bord",
    secondaryHref: "/auth/register",
    secondaryCta: "Créer Un Compte",
  },
];

const PRINCIPLES = [
  {
    title: "Actif = Passif",
    text: "Le jeu montre l’équilibre du bilan à chaque étape, sans jargon inutile.",
    icon: Scale,
  },
  {
    title: "Partie Double",
    text: "Chaque opération crée deux effets. Vous les voyez apparaître au bon endroit.",
    icon: RefreshCw,
  },
  {
    title: "Produits − Charges",
    text: "Le résultat n’est plus une formule sèche : il devient la conséquence de vos choix.",
    icon: TrendingUp,
  },
];

const COMMERCIAL_POINTS = [
  "Pensé pour un usage de groupe, pas seulement pour le solo.",
  "Assez lisible pour rassurer un responsable pédagogique.",
  "Assez engageant pour donner envie à une promotion d’entrer dans le jeu.",
];

const FOOTER_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales", icon: Info },
  { href: "/cgu", label: "CGU", icon: FileText },
  { href: "/confidentialite", label: "Politique de confidentialité", icon: Shield },
  { href: "/contact", label: "Contact", icon: Mail },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
      <Sparkles className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function SupportColumn({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: typeof Scale;
}) {
  return (
    <div className="space-y-4 border-t border-white/10 pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0 first:md:border-l-0 first:md:pl-0">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/6 text-cyan-200">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="max-w-sm text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function JourneyRow({
  index,
  title,
  text,
}: {
  index: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-4 border-t border-white/10 py-5 first:border-t-0 first:pt-0 md:grid-cols-[80px_minmax(0,1fr)]">
      <div className="text-sm font-semibold tracking-[0.28em] text-cyan-300">{index}</div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="max-w-xl text-sm leading-6 text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function PrincipleColumn({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: typeof Scale;
}) {
  return (
    <div className="space-y-4 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 first:lg:border-l-0 first:lg:pl-0">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="max-w-sm text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

type EntryAccent = "emerald" | "cyan" | "amber";

function getEntryAccentClasses(accent: EntryAccent) {
  if (accent === "emerald") {
    return {
      border: "border-emerald-400/20",
      icon: "text-emerald-300 border-emerald-400/20 bg-emerald-400/10",
      button: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
      secondaryButton: "border-emerald-400/20 text-emerald-100 hover:bg-emerald-400/10",
    };
  }

  if (accent === "amber") {
    return {
      border: "border-amber-400/20",
      icon: "text-amber-200 border-amber-400/20 bg-amber-400/10",
      button: "bg-amber-300 text-slate-950 hover:bg-amber-200",
      secondaryButton: "border-amber-400/20 text-amber-50 hover:bg-amber-400/10",
    };
  }

  return {
    border: "border-cyan-400/20",
    icon: "text-cyan-200 border-cyan-400/20 bg-cyan-400/10",
    button: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    secondaryButton: "border-cyan-400/20 text-cyan-50 hover:bg-cyan-400/10",
  };
}

function EntryPanel({
  title,
  subtitle,
  description,
  accent,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  description: string;
  accent: EntryAccent;
  icon: typeof KeyRound;
  children: React.ReactNode;
}) {
  const classes = getEntryAccentClasses(accent);

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-[1.75rem] border bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 ${classes.border}`}
    >
      <div className="space-y-5">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${classes.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{subtitle}</p>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();

    if (trimmed.match(/^KIC-[A-Z0-9]{4}$/)) {
      router.push(`/jeu?code=${trimmed}`);
      return;
    }

    if (trimmed.match(/^[A-Z0-9]{8}$/)) {
      const res = await fetch("/api/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (data.valid) {
        router.push("/jeu?access=bypass");
        return;
      }
      setCodeError("Code invalide ou expiré.");
      return;
    }

    setCodeError("Format invalide. Exemple : KIC-4A2B");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <section className="relative overflow-hidden px-6 pb-20 pt-6 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.08),transparent_18%),radial-gradient(circle_at_78%_74%,rgba(16,185,129,0.12),transparent_20%),linear-gradient(180deg,#020617_0%,#08111f_52%,#020617_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48vw] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_54%)] lg:block" />
        <div className="pointer-events-none absolute left-0 top-32 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />

        <div className="relative mx-auto max-w-7xl">
          <header className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-cyan-200">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Pierre Médan
                </p>
                <p className="text-sm font-semibold text-white">JE DEVIENS PATRON</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <a href="#parcours" className="rounded-full px-3 py-2 transition-colors hover:bg-white/6 hover:text-white">
                Le parcours
              </a>
              <a href="#acces" className="rounded-full px-3 py-2 transition-colors hover:bg-white/6 hover:text-white">
                Commencer
              </a>
              <Link
                href="/auth/login"
                className="rounded-full border border-white/12 bg-white/6 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Se connecter
              </Link>
            </nav>
          </header>

          <div className="grid min-h-[calc(100svh-88px)] items-center gap-12 py-8 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:py-10">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-xl space-y-8"
            >
              <SectionEyebrow>Jeu sérieux de comptabilité</SectionEyebrow>

              <div className="flex flex-wrap gap-2">
                {AUDIENCE_STRIPS.map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="space-y-5">
                <h1 className="max-w-[13ch] text-5xl font-bold leading-[0.92] tracking-[-0.04em] text-white text-balance sm:text-6xl lg:text-7xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
                  La comptabilité devient un terrain d’apprentissage concret.
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                  Un simulateur premium pensé pour formateurs, écoles et
                  établissements qui veulent faire comprendre la logique
                  comptable par la décision, la visualisation et le jeu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#acces"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  Commencer
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="#parcours"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Voir Le Fonctionnement
                </a>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-6">
                {HERO_POINTS.map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
                {COMMERCIAL_POINTS.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs leading-5 text-slate-400"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 24 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
              className="relative"
            >
              <div className="relative mx-auto aspect-[1.08/1] w-full max-w-3xl overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(11,18,32,0.7),rgba(9,52,73,0.24))] shadow-[0_35px_120px_rgba(2,8,23,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_24%)]" />
                <div className="absolute left-5 top-5 z-10 max-w-[220px] rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Pour Formateurs & Établissements
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Une expérience pédagogique claire, visible et crédible dès
                    les premiers instants.
                  </p>
                </div>

                <motion.div
                  animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
                  transition={shouldReduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src="/hero.png"
                    alt="Interface du jeu JE DEVIENS PATRON"
                    fill
                    priority
                    quality={92}
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-contain object-center"
                  />
                </motion.div>

                <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-3 p-5 sm:p-6">
                  {SUPPORT_NUMBERS.map((item) => (
                    <div
                      key={item.label}
                      className="min-w-[120px] flex-1 rounded-2xl border border-white/12 bg-slate-950/62 px-4 py-3 backdrop-blur"
                    >
                      <p className="text-2xl font-black text-cyan-200">{item.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-slate-950/55 px-6 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-2xl space-y-4">
            <SectionEyebrow>Pourquoi ça marche</SectionEyebrow>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
              Une expérience pédagogique qui se comprend en quelques secondes.
            </h2>
            <p className="text-sm leading-7 text-slate-400 sm:text-base">
              JE DEVIENS PATRON aide les apprenants à relier décisions de gestion,
              effets comptables et lecture des résultats dans un même parcours,
              clair pour la classe et crédible pour un établissement.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {LEARNING_PILLARS.map((pillar) => (
              <SupportColumn
                key={pillar.title}
                title={pillar.title}
                text={pillar.text}
                icon={pillar.icon}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="parcours" className="px-6 py-18 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <SectionEyebrow>Le parcours</SectionEyebrow>
            <h2 className="max-w-md text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
              Une partie suit une logique claire du début à la fin.
            </h2>
            <p className="max-w-md text-sm leading-7 text-slate-400 sm:text-base">
              Chaque étape donne une vision directe de ce que l’entreprise fait,
              de ce que la comptabilité enregistre et de ce que le formateur peut
              exploiter ensuite dans son animation ou son débrief.
            </p>

            <div className="rounded-[1.75rem] border border-cyan-400/15 bg-cyan-400/7 p-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Pensé pour la classe, crédible pour l’institution</h3>
                  <p className="text-sm leading-6 text-slate-400">
                    Le jeu aide à engager les apprenants pendant la séance tout en
                    donnant au responsable pédagogique un cadre sérieux, lisible
                    et simple à déployer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/65 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
            {JOURNEY_STEPS.map((step) => (
              <JourneyRow
                key={step.index}
                index={step.index}
                title={step.title}
                text={step.text}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="acces"
        className="border-y border-white/8 bg-[linear-gradient(180deg,rgba(8,17,31,0.82),rgba(2,8,23,1))] px-6 py-18 sm:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-2xl space-y-4">
            <SectionEyebrow>Commencer</SectionEyebrow>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
              Trois entrées, une seule logique : aller vite.
            </h2>
            <p className="text-sm leading-7 text-slate-400 sm:text-base">
              Que vous soyez apprenant, joueur autonome ou formateur, vous trouvez
              immédiatement le bon point d’entrée pour commencer une session,
              tester le jeu ou piloter une classe.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <EntryPanel
              title={ENTRY_OPTIONS[0].title}
              subtitle={ENTRY_OPTIONS[0].subtitle}
              description={ENTRY_OPTIONS[0].description}
              accent={ENTRY_OPTIONS[0].accent}
              icon={ENTRY_OPTIONS[0].icon}
            >
              <form onSubmit={handleCode} className="space-y-3">
                <label
                  htmlFor="session-code"
                  className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
                >
                  Code De Session
                </label>
                <input
                  id="session-code"
                  name="session-code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  placeholder="KIC-4A2B ou code accès…"
                  maxLength={8}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  aria-describedby="session-code-help session-code-error"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center font-mono text-lg font-bold uppercase tracking-[0.24em] text-white placeholder:text-slate-500 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/20"
                />
                <p id="session-code-help" className="text-xs leading-5 text-slate-500">
                  Saisissez le code fourni par votre formateur.
                </p>
                {codeError ? (
                  <p
                    id="session-code-error"
                    className="text-xs text-rose-300"
                    role="alert"
                    aria-live="polite"
                  >
                    {codeError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
                >
                  Rejoindre La Session
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </EntryPanel>

            <EntryPanel
              title={ENTRY_OPTIONS[1].title}
              subtitle={ENTRY_OPTIONS[1].subtitle}
              description={ENTRY_OPTIONS[1].description}
              accent={ENTRY_OPTIONS[1].accent}
              icon={ENTRY_OPTIONS[1].icon}
            >
              <div className="space-y-4">
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                    <span>1 crédit par partie</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                    <span>Historique & résultats conservés</span>
                  </div>
                </div>
                <Link
                  href={ENTRY_OPTIONS[1].href!}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  {ENTRY_OPTIONS[1].cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </EntryPanel>

            <EntryPanel
              title={ENTRY_OPTIONS[2].title}
              subtitle={ENTRY_OPTIONS[2].subtitle}
              description={ENTRY_OPTIONS[2].description}
              accent={ENTRY_OPTIONS[2].accent}
              icon={ENTRY_OPTIONS[2].icon}
            >
              <div className="space-y-4">
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
                    <span>Codes de session pour la classe</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
                    <span>Suivi des scores & résultats</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link
                    href={ENTRY_OPTIONS[2].href!}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                  >
                    {ENTRY_OPTIONS[2].cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href={ENTRY_OPTIONS[2].secondaryHref!}
                    className="inline-flex w-full items-center justify-center rounded-full border border-amber-400/20 px-5 py-3 text-sm font-semibold text-amber-50 transition-colors hover:bg-amber-400/10"
                  >
                    {ENTRY_OPTIONS[2].secondaryCta}
                  </Link>
                </div>
              </div>
            </EntryPanel>
          </div>
        </div>
      </section>

      <section className="px-6 py-18 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-2xl space-y-4">
            <SectionEyebrow>Ce qu’on retient</SectionEyebrow>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
              Les trois idées que le jeu rend enfin intuitives.
            </h2>
            <p className="text-sm leading-7 text-slate-400 sm:text-base">
              Le jeu fait ressortir les fondamentaux que les apprenants doivent
              vraiment maîtriser pour comprendre le bilan, la partie double et
              la formation du résultat.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <PrincipleColumn
                key={principle.title}
                title={principle.title}
                text={principle.text}
                icon={principle.icon}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-18 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,20,36,0.96),rgba(5,35,47,0.92))] px-6 py-10 shadow-2xl shadow-cyan-950/25 sm:px-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.6fr)] lg:items-end">
            <div className="space-y-4">
              <SectionEyebrow>Dernier pas</SectionEyebrow>
              <h2 className="max-w-lg text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
                Un outil conçu pour donner envie d’apprendre et assez solide pour être adopté en formation.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                JE DEVIENS PATRON réunit mise en situation, visualisation comptable
                et exploitation pédagogique dans une expérience simple à présenter,
                simple à lancer et simple à faire vivre avec un groupe.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="#acces"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
              >
                Choisir Mon Point D’entrée
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Contacter Pierre Médan
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-6 py-10 text-sm sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-slate-400">
            {FOOTER_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 transition-colors hover:text-cyan-200"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-white/8 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Pierre Médan — Tous droits réservés</p>
            <p>Hébergé par Vercel · DNS OVH</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
