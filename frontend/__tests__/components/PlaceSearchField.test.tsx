import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import PlaceSearchField from '@/app/components/PlaceSearchField';
import { astrologyAPI, type PlaceMatch } from '@/lib/api';

jest.mock('@/lib/api', () => ({ astrologyAPI: { searchPlaces: jest.fn() } }));

const BIHAR: PlaceMatch = { name: 'Aurangabad, Bihar, India', latitude: 24.7522, longitude: 84.3742, timezone: 'Asia/Kolkata', utc_offset: 'UTC+5:30' };
const MAHA: PlaceMatch = { name: 'Aurangabad, Maharashtra, India', latitude: 19.8762, longitude: 75.3433, timezone: 'Asia/Kolkata', utc_offset: 'UTC+5:30' };

function Harness({ onChoose }: { onChoose: (p: PlaceMatch | null) => void }) {
  const [text, setText] = useState('');
  const [chosen, setChosen] = useState<PlaceMatch | null>(null);
  return (
    <PlaceSearchField id="place" value={text} onTextChange={setText} chosen={chosen}
      onChoose={(p) => { setChosen(p); onChoose(p); }} date="1990-05-15" time="10:30" />
  );
}

describe('PlaceSearchField', () => {
  it('suggests places as you type and confirms the one picked', async () => {
    (astrologyAPI.searchPlaces as jest.Mock).mockResolvedValue([MAHA, BIHAR]);
    const onChoose = jest.fn();
    render(<Harness onChoose={onChoose} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Aurang' } });
    fireEvent.click(await screen.findByText('Aurangabad, Bihar, India'));
    expect(astrologyAPI.searchPlaces).toHaveBeenCalledWith('Aurang', '1990-05-15', '10:30', true);
    expect(onChoose).toHaveBeenCalledWith(BIHAR);
    await waitFor(() => expect(screen.getByTestId('chosen-place')).toHaveTextContent('24.75°N, 84.37°E'));
  });

  it('says so when nothing matches', async () => {
    (astrologyAPI.searchPlaces as jest.Mock).mockResolvedValue([]);
    render(<Harness onChoose={jest.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Xyzzy' } });
    expect(await screen.findByText(/No place found/)).toBeInTheDocument();
  });
});
