import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationAutocomplete from './LocationAutocomplete';

const mockFetch = global.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions as jest.Mock;

const renderComponent = (value = '', onChange = jest.fn()) =>
  render(<LocationAutocomplete value={value} onChange={onChange} />);

describe('LocationAutocomplete', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders a Location text field', () => {
    renderComponent();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
  });

  it('displays the initial value', () => {
    renderComponent('Sydney NSW, Australia');
    expect((screen.getByLabelText(/Location/i) as HTMLInputElement).value).toBe('Sydney NSW, Australia');
  });

  it('fetches suggestions as the user types', async () => {
    mockFetch.mockResolvedValueOnce({
      suggestions: [
        { placePrediction: { text: { text: 'Surry Hills NSW, Australia' } } },
        { placePrediction: { text: { text: 'Sutherland NSW, Australia' } } },
      ],
    });

    renderComponent();
    await userEvent.type(screen.getByLabelText(/Location/i), 'Sur');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ input: 'Sur', includedRegionCodes: ['au'] })
      );
    });
  });

  it('displays suggestions returned by the API', async () => {
    mockFetch.mockResolvedValueOnce({
      suggestions: [
        { placePrediction: { text: { text: 'Surry Hills NSW, Australia' } } },
      ],
    });

    renderComponent();
    await userEvent.type(screen.getByLabelText(/Location/i), 'Sur');

    await waitFor(() => {
      expect(screen.getByText('Surry Hills NSW, Australia')).toBeInTheDocument();
    });
  });

  it('calls onChange when a suggestion is selected', async () => {
    const onChange = jest.fn();
    mockFetch.mockResolvedValueOnce({
      suggestions: [
        { placePrediction: { text: { text: 'Surry Hills NSW, Australia' } } },
      ],
    });

    render(<LocationAutocomplete value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/Location/i), 'Sur');

    await waitFor(() => screen.getByText('Surry Hills NSW, Australia'));
    await userEvent.click(screen.getByText('Surry Hills NSW, Australia'));

    expect(onChange).toHaveBeenCalledWith('Surry Hills NSW, Australia');
  });

  it('calls onChange on blur with whatever was typed', async () => {
    const onChange = jest.fn();
    renderComponent('', onChange);
    await userEvent.type(screen.getByLabelText(/Location/i), 'North Sydney');
    screen.getByLabelText(/Location/i).blur();
    expect(onChange).toHaveBeenCalledWith('North Sydney');
  });

  it('shows no suggestions when fetch returns empty', async () => {
    mockFetch.mockResolvedValueOnce({ suggestions: [] });
    renderComponent();
    await userEvent.type(screen.getByLabelText(/Location/i), 'zzz');
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
