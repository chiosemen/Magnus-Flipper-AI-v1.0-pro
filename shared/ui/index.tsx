import * as React from 'react';

export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(16, 22, 28, 0.8)',
      border: '1px solid rgba(0, 196, 255, 0.2)',
      borderRadius: 16,
      padding: 16
    }}>{children}</div>
  );
}

export function PrimaryButton({ title, onClick }: { title: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: '#00C4FF',
      color: '#00151C',
      borderRadius: 12,
      padding: '12px 16px',
      fontWeight: 800
    }}>{title}</button>
  );
}
