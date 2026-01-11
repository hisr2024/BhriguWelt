import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const pushMock = jest.fn();
const createAndSaveBirthChartMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/lib/context/EncryptionContext', () => ({
  useEncryption: () => ({ encryptionKey: null }),
}));

jest.mock('@/lib/birthChartManager', () => {
  const actual = jest.requireActual('@/lib/birthChartManager');
  return {
    ...actual,
    createAndSaveBirthChart: (...args: unknown[]) => createAndSaveBirthChartMock(...args),
  };
});

import CreateBirthChartForm from '@/app/birth-chart/CreateBirthChartForm';

describe('CreateBirthChartForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    createAndSaveBirthChartMock.mockReset();
  });

  it('renders the birth chart form fields', () => {
    render(<CreateBirthChartForm />);

    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/place of birth/i)).toBeInTheDocument();
  });

  it('submits and navigates on success', async () => {
    createAndSaveBirthChartMock.mockResolvedValue({ success: true });

    render(<CreateBirthChartForm />);

    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/time of birth/i), { target: { value: '12:00' } });
    fireEvent.change(screen.getByLabelText(/place of birth/i), { target: { value: 'Delhi' } });

    fireEvent.click(screen.getByRole('button', { name: /create birth chart/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/birth-chart/view');
    });
  });

  it('shows a friendly error on failure', async () => {
    createAndSaveBirthChartMock.mockResolvedValue({ success: false, message: 'Unable to save' });

    render(<CreateBirthChartForm />);

    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/time of birth/i), { target: { value: '12:00' } });
    fireEvent.change(screen.getByLabelText(/place of birth/i), { target: { value: 'Delhi' } });

    fireEvent.click(screen.getByRole('button', { name: /create birth chart/i }));

    expect(await screen.findByText(/unable to save/i)).toBeInTheDocument();
  });
});

describe('getItemSafe', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns null when storage throws', async () => {
    jest.doMock('@/lib/storage', () => ({
      getItem: jest.fn().mockRejectedValue(new Error('boom')),
    }));

    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(() => {
        const { getItemSafe } = require('@/lib/storage-safe');
        getItemSafe('reports', 'missing')
          .then((result: unknown) => {
            expect(result).toBeNull();
            resolve();
          })
          .catch(reject);
      });
    });
  });
});
