import { AlertCircle, WifiOff, Database, Info } from 'lucide-react';

type BannerVariant = 'demo' | 'offline' | 'error' | 'empty' | 'info';

interface AppStateBannerProps {
  variant: BannerVariant;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantConfig = {
  demo: {
    icon: Info,
    bgClass: 'bg-accent-500/10 border-accent-500/30',
    textClass: 'text-accent-400',
  },
  offline: {
    icon: WifiOff,
    bgClass: 'bg-warning/10 border-warning/30',
    textClass: 'text-warning',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-error/10 border-error/30',
    textClass: 'text-error',
  },
  empty: {
    icon: Database,
    bgClass: 'bg-surface-elevated border-border-subtle',
    textClass: 'text-text-secondary',
  },
  info: {
    icon: Info,
    bgClass: 'bg-info/10 border-info/30',
    textClass: 'text-info',
  },
};

export function AppStateBanner({ variant, title, message, action }: AppStateBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border p-4 ${config.bgClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={`flex-shrink-0 mt-0.5 ${config.textClass}`} size={20} />
        <div className="flex-1">
          <h3 className={`font-medium ${config.textClass}`}>{title}</h3>
          {message && (
            <p className="text-text-secondary text-sm mt-1">{message}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 px-4 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-surface-base"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
