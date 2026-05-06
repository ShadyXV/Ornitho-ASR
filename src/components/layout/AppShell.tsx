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
import logoAsset from '../../assets/ornitho/logo.png';
import sidebarIllustration from '../../assets/ornitho/sidebar-illustration.png';

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
        <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 overflow-hidden bg-[#004664] text-white lg:flex lg:flex-col">
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

          <div className="min-h-0 flex-1 px-0 pt-8">
            <div className="relative h-full min-h-0 overflow-hidden">
              <img
                src={sidebarIllustration}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-bottom"
              />
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
    <img src={logoAsset} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover shadow-lg" />
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
