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
  TrendingUp,
  Users,
} from "lucide-react";

const HERO_POINTS = [
  "Chaque décision produit immédiatement un effet financier qui déclenche une conséquence financière.",
  "Les explications permettent une séance vivante sans sacrifier la rigueur comptable.",
  "Le formateur (optionnel) dispose d’un format clair, crédible et simple à déployer.",
];

const SUPPORT_NUMBERS = [
  { value: "4", label: "univers métier" },
  { value: "8", label: "décisions / trimestre" },
  { value: "1h45", label: "de jeu max" },
  { value: "100%", label: "guidé pas à pas" },
];

const HERO_TAGS = ["Décider", "Visualiser", "Débriefer"];


const LEARNING_PILLARS = [
  {
    title: "Voir",
    text: "Les mécanismes comptables deviennent observables au lieu de rester théoriques ou abstraits.",
    icon: Scale,
  },
  {
    title: "Décider",
    text: "Achats, ventes, trésorerie, recrutement : chaque choix modifie immédiatement l’équilibre de l’entreprise.",
    icon: Building2,
  },
  {
    title: "Comprendre",
    text: "Le jeu, le score final et le débriefing transforment l’action en raisonnement durable. Les principes comptables sont respectés. Les rendez-vous avec le comptable ne sont plus un charabia technique : chaque notion comptable est expliquée et mise en évidence en fonction des flux financiers.",
    icon: BookOpen,
  },
];

const JOURNEY_STEPS = [
  {
    index: "01",
    title: "Choisissez un univers d’entreprise",
    text: "Manufacture, transport, commerce ou laboratoire : chaque partie donne un contexte clair et une dynamique différente.",
  },
  {
    index: "02",
    title: "Faites agir les apprenants",
    text: "Charges, achats, créances, ventes, événements et arbitrages stratégiques rythment la séance trimestre après trimestre.",
  },
  {
    index: "03",
    title: "Lisez les effets comptables",
    text: "Résultat net, trésorerie, solvabilité, équilibre du bilan et bien d’autres indicateurs deviennent visibles, discutables, expliqués et mémorisables.",
  },
  {
    index: "04",
    title: "Le compte rendu financier final",
    text: "Le compte rendu financier final permet de consolider durablement les notions comptables et financières. Celles-ci ne sont plus simplement apprises ou récitées : elles sont expérimentées au cours du jeu, puis structurées et renforcées lors du débriefing.",
  },
];

const ENTRY_OPTIONS: Array<{
  title: string;
  subtitle: string;
  description: string;
  accent: EntryAccent;
  icon: typeof KeyRound;
  href?: string;
  cta?: string;
  secondaryHref?: string;
  secondaryCta?: string;
}> = [
  {
    title: "J’ai un code",
    subtitle: "Entrer dans la séance immédiatement",
    description: "Saisissez le code diffusé par votre formateur et démarrez la partie sans configuration supplémentaire.",
    accent: "emerald",
    icon: KeyRound,
  },
  {
    title: "Je joue seul",
    subtitle: "Découvrir l’expérience en autonomie",
    description: "Idéal pour tester le jeu, réviser à son rythme ou préparer une future séance de formation.",
    accent: "cyan",
    icon: Gamepad2,
    href: "/auth/register?redirectTo=/jeu&orgType=individuel",
    cta: "Découvrir En Solo",
  },
  {
    title: "Je suis formateur",
    subtitle: "Lancer, animer, suivre une promotion",
    description: "Créez des sessions, diffusez un code d’accès et récupérez les résultats de la classe.",
    accent: "amber",
    icon: GraduationCap,
    href: "/auth/login",
    cta: "Accéder Au Tableau De Bord",
    secondaryHref: "/auth/register",
    secondaryCta: "Créer Un Accès Formateur",
  },
];

const PRINCIPLES = [
  {
    title: "Actif = Passif",
    text: "L’équilibre du bilan se voit à chaque étape, sans laisser l’apprenant seul face à une règle abstraite.",
    icon: Scale,
  },
  {
    title: "Partie Double",
    text: "Chaque opération produit deux effets complémentaires, visibles immédiatement dans les bons postes.",
    icon: RefreshCw,
  },
  {
    title: "Produits − Charges",
    text: "Le résultat se lit comme la conséquence directe des choix de gestion, pas comme une formule à réciter.",
    icon: TrendingUp,
  },
];

const FOOTER_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales", icon: Info },
  { href: "/cgu", label: "CGU", icon: FileText },
  { href: "/confidentialite", label: "Politique de confidentialité", icon: Shield },
  { href: "/contact", label: "Contact", icon: Mail },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden="true" />
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
    <div className="grid gap-3 border-t border-white/10 py-4 first:border-t-0 first:pt-0 sm:grid-cols-[72px_minmax(0,1fr)]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/6 text-cyan-200">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm leading-6 text-slate-400">{text}</p>
      </div>
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
    <div className="grid gap-3 border-t border-white/10 py-3 first:border-t-0 first:pt-0 md:grid-cols-[80px_minmax(0,1fr)]">
      <div>
        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold tracking-[0.24em] text-cyan-200">
          {index}
        </span>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm leading-6 text-slate-400">{text}</p>
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
    <div className="space-y-3 border-t border-white/10 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 first:lg:border-l-0 first:lg:pl-0">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-sm leading-6 text-slate-400">{text}</p>
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
      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.98))] p-5 shadow-[0_26px_90px_rgba(2,8,23,0.34)] ${classes.border}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_34%)] opacity-70" />
      <div className="relative space-y-4">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${classes.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{subtitle}</p>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="relative mt-8">{children}</div>
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
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="relative overflow-hidden px-6 pb-8 pt-6 sm:px-8 sm:pb-10 lg:px-12 lg:pb-12">
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
              <Link
                href="/auth/login"
                className="rounded-full border border-white/12 bg-white/6 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Se connecter
              </Link>
            </nav>
          </header>

          <div className="grid gap-6 pb-4 pt-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center xl:gap-10">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="space-y-6 lg:pb-6"
            >
              <SectionEyebrow>Jeu sérieux · Comptabilité · Gestion d'entreprise</SectionEyebrow>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
                  JE DEVIENS PATRON
                </p>
                <h1 className="max-w-[12ch] text-5xl font-bold leading-[0.92] tracking-[-0.045em] text-white text-balance sm:text-6xl lg:text-7xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
                  Savoir dépenser pour gagner plus.
                </h1>
                <p className="text-base leading-7 text-slate-300 sm:text-lg">
                  Un jeu sérieux conçu pour comprendre comment les mouvements
                  d’argent peuvent vous enrichir et vous appauvrir : l’apprenant
                  est guidé et tout mouvement de trésorerie est expliqué tout au
                  long du jeu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                >
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  Espace Formateur
                </Link>
                <Link
                  href="/auth/register?redirectTo=/jeu&orgType=individuel"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                  Jouer En Solo
                </Link>
                <a
                  href="#acces"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  J'ai Un Code
                </a>
              </div>

              <div className="grid gap-3 border-t border-white/10 pt-6 grid-cols-2 sm:grid-cols-4">
                {SUPPORT_NUMBERS.map((item) => (
                  <div key={item.label} className="space-y-2 border-l border-white/10 pl-4 first:border-l-0 first:pl-0">
                    <p className="text-2xl font-black tracking-[-0.04em] text-white">{item.value}</p>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-white/10 pt-6">
                {HERO_POINTS.map((point, index) => (
                  <div key={point} className="grid gap-3 sm:grid-cols-[52px_minmax(0,1fr)]">
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                      0{index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{point}</p>
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
              <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(8,15,28,0.96),rgba(6,32,43,0.92))] p-2.5 shadow-[0_40px_140px_rgba(2,8,23,0.68)] sm:p-3">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(250,204,21,0.09),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_24%)]" />
                <div className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 rounded-full border border-white/12 bg-slate-950/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur">
                  Simulation d’entreprise & lecture comptable
                </div>

                <motion.div
                  animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
                  transition={shouldReduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="relative min-h-[280px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/55 sm:min-h-[360px]"
                >
                  <Image
                    src="/hero.png"
                    alt="Illustration du jeu sérieux JE DEVIENS PATRON montrant stratégie, finance, produit et croissance"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04),rgba(2,6,23,0.26))]" />
                </motion.div>

                <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl border border-white/12 bg-slate-950/78 p-4 backdrop-blur-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
                    Dans le jeu
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold leading-7 text-white sm:text-2xl sm:leading-8">
                    Le même espace relie stratégie, produit, finance et résultat.
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {HERO_TAGS.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-slate-950/55 px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-5">
            <SectionEyebrow>Pourquoi ça marche</SectionEyebrow>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
              Une expérience pédagogique pensée pour des séances de travail en autonomie ou guidé.
            </h2>
            <p className="text-sm leading-7 text-slate-400 sm:text-base">
              JEDEVIENSPATRON.fr relie les décisions de gestion, les effets
              comptables et la lecture des résultats dans un même parcours.
              L’apprenant voit enfin la logique, et l’équipe pédagogique
              (optionnelle) garde un format exploitable avant, pendant et après
              la séance grâce aux nombreux indicateurs financiers disponibles.
            </p>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
                Un même outil, deux promesses tenues
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Donner envie d’entrer dans le jeu côté apprenant, en se challengeant
                ou challengeant les autres joueurs pour obtenir le meilleur score,
                le meilleur résultat comptable ou financier tout en offrant un cadre
                rassurant pour un responsable pédagogique ou un établissement.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {LEARNING_PILLARS.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.25 }}
              >
                <SupportColumn
                  title={pillar.title}
                  text={pillar.text}
                  icon={pillar.icon}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="parcours" className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-5">
            <SectionEyebrow>Le parcours</SectionEyebrow>
            <h2 className="max-w-md text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
              Un parcours ludique structuré pour faire comprendre le fonctionnement de l'entreprise, la comptabilité et la prise de décision.
            </h2>
            <p className="max-w-md text-sm leading-7 text-slate-400 sm:text-base">
              Chaque partie suit une progression claire, de l’activité de
              l’entreprise jusqu’à l’analyse des résultats. Les apprenants
              peuvent jouer en autonomie ou dans le cadre d’une animation
              encadrée. À chaque étape, ils agissent, observent les conséquences
              de leurs choix et relient directement les décisions prises aux
              mécanismes comptables et financiers.
            </p>

            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/7 p-5">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Pensé pour les apprenants, crédible pour les formateurs</h3>
                  <p className="text-sm leading-6 text-slate-400">
                    Utilisable en autonomie ou en animation pédagogique, le jeu
                    s’adapte aussi bien à l’entraînement individuel qu’aux
                    séances encadrées.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/65 p-4 shadow-xl shadow-slate-950/30 sm:p-6">
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
        className="border-y border-white/8 bg-[linear-gradient(180deg,rgba(8,17,31,0.82),rgba(2,8,23,1))] px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="max-w-2xl space-y-4">
            <SectionEyebrow>Commencer</SectionEyebrow>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
              Trois entrées, une seule promesse : démarrer sans friction.
            </h2>
            <p className="text-sm leading-7 text-slate-400 sm:text-base">
              Apprenant, joueur autonome ou formateur : chacun trouve immédiatement
              la bonne porte d’entrée pour rejoindre une session, découvrir
              l’expérience ou piloter une promotion.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.25 }}
            >
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
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
              viewport={{ once: true, amount: 0.25 }}
            >
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
                      <span>Historique et résultats conservés</span>
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
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
              viewport={{ once: true, amount: 0.25 }}
            >
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
                      <span>Suivi des scores et résultats</span>
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
            </motion.div>
          </div>
        </div>
      </section>


      <section className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="max-w-2xl space-y-4">
            <SectionEyebrow>Ce qu’on retient</SectionEyebrow>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
              Les trois idées que le jeu rend enfin intuitives.
            </h2>
            <p className="text-sm leading-7 text-slate-400 sm:text-base">
              Le jeu rend visible et compréhensible les trois notions souvent
              perçues comme abstraites : l'équilibre du bilan, la partie double
              et la formation du résultat.
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

      <section className="px-6 pb-8 sm:px-8 sm:pb-10 lg:px-12 lg:pb-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(12,20,36,0.96),rgba(5,35,47,0.92))] px-5 py-8 shadow-2xl shadow-cyan-950/25 sm:px-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)] lg:items-center">
            <div className="space-y-4">
              <SectionEyebrow>Dernier pas</SectionEyebrow>
              <h2 className="max-w-lg text-3xl font-bold tracking-[-0.03em] text-white text-balance sm:text-4xl [font-family:Georgia,Times,'Times_New_Roman',serif]">
                Un format engageant pour la classe, les apprenants, solide pour votre offre de formation.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                JEDEVIENSPATRON.fr associe mise en situation, visualisation comptable
                et exploitation pédagogique dans une expérience facile à présenter,
                rapide à prendre en main et simple à déployer auprès d'un groupe
                ou d'une promotion.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="#acces"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
              >
                Découvrir le jeu
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Échanger sur un usage en formation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-6 py-8 text-sm sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap gap-x-4 gap-y-3 text-slate-400">
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
