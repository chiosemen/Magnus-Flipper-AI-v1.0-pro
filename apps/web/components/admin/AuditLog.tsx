'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionShell } from '@/lib/ui-contracts/SectionShell';
import type { SectionState } from '@/lib/ui-contracts/types';

export type AuditLogEventType =
  | 'scraper_paused'
  | 'scraper_resumed'
  | 'rate_limit_changed'
  | 'marketplace_toggled'
  | 'system_error'
  | 'config_changed';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditLogEventType;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogProps {
  entries: AuditLogEntry[];
  isLoading?: boolean;
  error?: Error;
  defaultExpanded?: boolean;
}

const EVENT_TYPE_CONFIG = {
  scraper_paused: {
    icon: '⏸️',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    label: 'Paused',
  },
  scraper_resumed: {
    icon: '▶️',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    label: 'Resumed',
  },
  rate_limit_changed: {
    icon: '⚡',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    label: 'Rate Change',
  },
  marketplace_toggled: {
    icon: '🔄',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    label: 'Toggle',
  },
  system_error: {
    icon: '❌',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    label: 'Error',
  },
  config_changed: {
    icon: '⚙️',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    label: 'Config',
  },
} as const;

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function AuditLog({ entries, isLoading, error, defaultExpanded = false }: AuditLogProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const sectionState: SectionState<AuditLogEntry[]> = {
    state: error ? 'error' : isLoading ? 'loading' : entries.length === 0 ? 'empty' : 'ready',
    data: entries,
    error,
  };

  return (
    <SectionShell
      sectionId="audit-log"
      state={sectionState}
      renderLoading={() => <LoadingState isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />}
      renderEmpty={() => <EmptyState isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />}
      renderError={(err) => <ErrorState error={err} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />}
      renderReady={(data) => <ReadyState entries={data} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />}
    />
  );
}

interface BaseStateProps {
  isExpanded: boolean;
  onToggle: () => void;
}

function LoadingState({ isExpanded, onToggle }: BaseStateProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Audit Log</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        {isExpanded && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function EmptyState({ isExpanded, onToggle }: BaseStateProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Audit Log</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        {isExpanded && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-sm text-muted-foreground">
              No audit log entries yet
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Admin actions will be logged here
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function ErrorState({ error, isExpanded, onToggle }: BaseStateProps & { error: Error }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Audit Log</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        {isExpanded && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-sm font-medium text-foreground mb-2">
              Failed to load audit log
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function ReadyState({ entries, isExpanded, onToggle }: BaseStateProps & { entries: AuditLogEntry[] }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">Audit Log</h3>
            <Badge variant="outline" className="bg-muted">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        {isExpanded && (
          <div className="space-y-0 border border-border rounded-lg overflow-hidden">
            {entries.map((entry, index) => (
              <LogEntry
                key={entry.id}
                entry={entry}
                isLast={index === entries.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function LogEntry({ entry, isLast }: { entry: AuditLogEntry; isLast: boolean }) {
  const config = EVENT_TYPE_CONFIG[entry.eventType];

  return (
    <div
      className={`flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors ${
        !isLast ? 'border-b border-border' : ''
      }`}
    >
      <Badge variant="outline" className={`${config.color} gap-1.5 flex-shrink-0`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          {entry.message}
        </p>
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <div className="mt-1 text-xs text-muted-foreground font-mono">
            {JSON.stringify(entry.metadata, null, 2)}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formatTime(entry.timestamp)}
      </span>
    </div>
  );
}
