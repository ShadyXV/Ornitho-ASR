import type { ReactNode } from 'react';
import {
  BarChart3,
  Bot,
  FlaskConical,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';

interface AppShellProps {
  title: string;
  description: string;
  providerCount?: number;
  targetCount?: number;
  apiStatus?: 'active' | 'paused';
  children: ReactNode;
  actions?: ReactNode;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tests', label: 'Tests', icon: FlaskConical },
  { to: '/models', label: 'Models', icon: Bot },
  { to: '/reports', label: 'Evaluation Reports', icon: BarChart3 },
  { to: '/settings', label: 'System Settings', icon: Settings },
];

export function AppShell({
  title,
  description,
  providerCount = 0,
  targetCount = 0,
  apiStatus = 'active',
  children,
  actions,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f6f9fb] text-slate-950">
      <div className="flex min-h-screen w-full bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
        <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 overflow-hidden bg-gradient-to-b from-[#005b69] via-[#018d95] to-[#0cbfc0] text-white lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-3 px-8 py-8">
            <BrandMark />
            <span className="text-xl font-semibold tracking-normal">Ornitho ASR</span>
          </Link>

          <nav className="space-y-2 px-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'bg-slate-950/25 shadow-inner' : 'text-white/90 hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto px-0 pb-0">
            <div className="relative h-80 overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-44 rounded-t-[52%] bg-[#005166]/70" />
              <div className="absolute inset-x-0 bottom-10 h-40 rounded-t-[56%] bg-[#30c6bd]/70" />
              <div className="absolute inset-x-0 bottom-0 h-28 rounded-t-[58%] bg-[#00445d]/80" />
              <div className="absolute bottom-[8.5rem] left-12 h-16 w-16 rounded-full bg-white/90 shadow-lg">
                <div className="absolute left-7 top-14 h-16 w-1.5 rounded-full bg-orange-300" />
                <div className="absolute left-3 top-8 h-8 w-10 rounded-full bg-[#43aeb6]" />
                <div className="absolute left-11 top-6 h-2 w-3 rounded-full bg-orange-500" />
              </div>
              <div className="absolute right-4 bottom-24 flex h-16 items-end gap-1 opacity-80">
                {[14, 28, 46, 64, 42, 26, 18].map((height, index) => (
                  <span key={index} className="w-1.5 rounded-full bg-white" style={{ height }} />
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
              <div className="flex min-w-0 items-center gap-4">
                <div className="lg:hidden">
                  <BrandMark />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-normal text-slate-950 lg:text-3xl">{title}</h1>
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <HeaderPill tone={apiStatus === 'active' ? 'emerald' : 'amber'} icon={<ShieldCheck className="h-4 w-4" />}>
                  API {apiStatus === 'active' ? 'Active' : 'Paused'}
                </HeaderPill>
                <HeaderPill tone="amber" icon={<Gauge className="h-4 w-4" />}>
                  {providerCount} Provider{providerCount === 1 ? '' : 's'} Ready
                </HeaderPill>
                <HeaderPill tone="violet" icon={<Target className="h-4 w-4" />}>
                  {targetCount} Test Target{targetCount === 1 ? '' : 's'}
                </HeaderPill>
                {actions}
                <Link to="/settings" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100" aria-label="Help">
                  <HelpCircle className="h-5 w-5" />
                </Link>
                <Link to="/settings" className="grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-5 py-3 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                        isActive ? 'bg-teal-700 text-white' : 'border border-slate-200 text-slate-700'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </header>

          <main className="px-5 py-6 lg:px-7">{children}</main>
        </div>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6ee7d8] to-[#006277] shadow-lg">
      <span className="relative block h-8 w-8 rounded-full bg-[#0f766e]">
        <span className="absolute left-2 top-2 h-4 w-5 rounded-full bg-[#8be3db]" />
        <span className="absolute right-0 top-3 h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-orange-400" />
        <span className="absolute right-1 top-3 h-1.5 w-1.5 rounded-full bg-slate-950" />
      </span>
    </div>
  );
}

function HeaderPill({ tone, icon, children }: { tone: 'emerald' | 'amber' | 'violet'; icon: ReactNode; children: ReactNode }) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    violet: 'border-violet-200 bg-violet-50 text-violet-800',
  };

  return (
    <span className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function ShellCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <h2 className="text-xl font-bold tracking-normal text-slate-950">{title}</h2>
      {description && <p className="pb-0.5 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function EmptyPlaceholderScreen({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <ShellCard className="grid min-h-[360px] place-items-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-50 text-teal-700">{icon}</div>
        <h2 className="mt-5 text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </ShellCard>
  );
}

export function StatusDot({ active }: { active: boolean }) {
  return <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-lime-500' : 'bg-amber-500'}`} />;
}
