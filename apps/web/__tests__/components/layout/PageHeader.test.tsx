import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/layout/PageHeader';

describe('PageHeader', () => {
  it('renders title correctly', () => {
    render(<PageHeader title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Test Page" subtitle="Test Subtitle" />);
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    render(
      <PageHeader
        title="Test Page"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Test' },
        ]}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader
        title="Test Page"
        actions={<button type="button">Action</button>}
      />
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('uses design tokens for typography', () => {
    const { container } = render(<PageHeader title="Test Page" />);

    const title = container.querySelector('h1');
    expect(title).toHaveClass('text-h1', 'font-heading', 'font-bold', 'text-foreground');
  });

  it('has proper accessibility structure', () => {
    render(
      <PageHeader
        title="Test Page"
        breadcrumbs={[{ label: 'Home' }]}
      />
    );

    const nav = screen.getByLabelText('Breadcrumb');
    expect(nav).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    render(<PageHeader title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });
});
