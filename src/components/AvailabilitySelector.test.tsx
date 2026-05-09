import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvailabilitySelector, { formatAvailability } from './AvailabilitySelector';

describe('formatAvailability', () => {
  it('returns raw string when JSON is invalid', () => {
    expect(formatAvailability('Weekdays')).toBe('Weekdays');
    expect(formatAvailability('')).toBe('');
  });

  it('returns raw when parsed object is missing fields', () => {
    expect(formatAvailability(JSON.stringify({ days: ['Mon'] }))).toBe(JSON.stringify({ days: ['Mon'] }));
  });

  it('formats 7 days as "Every day"', () => {
    const v = JSON.stringify({ days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], time_window: '06:00-12:00' });
    expect(formatAvailability(v)).toBe('Every day · Morning (06:00-12:00)');
  });

  it('formats Mon–Fri as "Weekdays"', () => {
    const v = JSON.stringify({ days: ['Mon','Tue','Wed','Thu','Fri'], time_window: '12:00-18:00' });
    expect(formatAvailability(v)).toBe('Weekdays · Afternoon (12:00-18:00)');
  });

  it('formats Sat+Sun as "Weekends"', () => {
    const v = JSON.stringify({ days: ['Sat','Sun'], time_window: '06:00-22:00' });
    expect(formatAvailability(v)).toBe('Weekends · Full Day (06:00-22:00)');
  });

  it('lists individual days when no shorthand applies', () => {
    const v = JSON.stringify({ days: ['Mon','Wed','Fri'], time_window: '18:00-22:00' });
    expect(formatAvailability(v)).toBe('Mon, Wed, Fri · Evening (18:00-22:00)');
  });

  it('shows raw time_window for custom presets', () => {
    const v = JSON.stringify({ days: ['Tue'], time_window: '08:30-14:00' });
    expect(formatAvailability(v)).toBe('Tue · 08:30-14:00');
  });

  it('shows Morning label for 06:00-12:00 preset', () => {
    const v = JSON.stringify({ days: ['Mon','Tue','Wed','Thu','Fri'], time_window: '06:00-12:00' });
    expect(formatAvailability(v)).toContain('Morning (06:00-12:00)');
  });

  it('shows Evening label for 18:00-22:00 preset', () => {
    const v = JSON.stringify({ days: ['Sat','Sun'], time_window: '18:00-22:00' });
    expect(formatAvailability(v)).toContain('Evening (18:00-22:00)');
  });
});

describe('AvailabilitySelector component', () => {
  const renderSelector = (value = '{}', onChange = jest.fn()) =>
    render(<AvailabilitySelector value={value} onChange={onChange} />);

  it('renders day checkboxes and time preset buttons', () => {
    renderSelector();
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day =>
      expect(screen.getByLabelText(day)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Morning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Afternoon/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Evening/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Full Day/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Custom/i })).toBeInTheDocument();
  });

  it('initialises checked days from JSON value', () => {
    const v = JSON.stringify({ days: ['Mon', 'Wed'], time_window: '06:00-12:00' });
    renderSelector(v);
    expect(screen.getByLabelText('Mon')).toBeChecked();
    expect(screen.getByLabelText('Wed')).toBeChecked();
    expect(screen.getByLabelText('Tue')).not.toBeChecked();
  });

  it('toggling a day checkbox calls onChange with updated days', async () => {
    const onChange = jest.fn();
    renderSelector('{}', onChange);
    onChange.mockClear();
    await userEvent.click(screen.getByLabelText('Mon'));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(JSON.parse(lastCall).days).toContain('Mon');
  });

  it('"Weekdays" chip selects Mon–Fri', async () => {
    const onChange = jest.fn();
    renderSelector('{}', onChange);
    onChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Weekdays' }));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(JSON.parse(lastCall).days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  });

  it('"Weekends" chip selects Sat+Sun', async () => {
    const onChange = jest.fn();
    renderSelector('{}', onChange);
    onChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Weekends' }));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(JSON.parse(lastCall).days).toEqual(['Sat', 'Sun']);
  });

  it('"Every day" chip selects all 7 days', async () => {
    const onChange = jest.fn();
    renderSelector('{}', onChange);
    onChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Every day' }));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(JSON.parse(lastCall).days).toHaveLength(7);
  });

  it('"Clear" chip removes all days', async () => {
    const v = JSON.stringify({ days: ['Mon'], time_window: '' });
    const onChange = jest.fn();
    renderSelector(v, onChange);
    onChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(JSON.parse(lastCall).days).toHaveLength(0);
  });

  it('shows custom time inputs when Custom preset is selected', async () => {
    renderSelector();
    await userEvent.click(screen.getByRole('button', { name: /Custom/i }));
    expect(screen.getByLabelText(/From/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/To/i)).toBeInTheDocument();
  });

  it('hides custom time inputs for non-custom presets', () => {
    renderSelector();
    expect(screen.queryByLabelText(/From/i)).not.toBeInTheDocument();
  });

  it('shows "Weekdays selected" summary when Mon–Fri are checked', async () => {
    renderSelector('{}');
    await userEvent.click(screen.getByRole('button', { name: 'Weekdays' }));
    expect(screen.getByText(/weekdays selected/i)).toBeInTheDocument();
  });

  it('shows "Every day selected" summary when all 7 days checked', async () => {
    renderSelector('{}');
    await userEvent.click(screen.getByRole('button', { name: 'Every day' }));
    expect(screen.getByText(/every day selected/i)).toBeInTheDocument();
  });
});
