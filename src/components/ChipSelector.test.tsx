import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChipSelector from './ChipSelector';

const OPTIONS = ['Option A', 'Option B', 'Option C'];

describe('ChipSelector', () => {
  it('renders the label', () => {
    render(<ChipSelector label="Medications" options={OPTIONS} value={[]} onChange={jest.fn()} />);
    expect(screen.getByLabelText(/medications/i)).toBeInTheDocument();
  });

  it('renders pre-selected values as chips', () => {
    render(<ChipSelector label="Medications" options={OPTIONS} value={['Option A']} onChange={jest.fn()} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('calls onChange when a chip is removed', async () => {
    const onChange = jest.fn();
    render(<ChipSelector label="Medications" options={OPTIONS} value={['Option A']} onChange={onChange} />);
    const deleteButton = screen.getByTestId('CancelIcon');
    await userEvent.click(deleteButton);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
