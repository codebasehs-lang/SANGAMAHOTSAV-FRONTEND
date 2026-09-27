import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SmsCampaigns from './SmsCampaigns';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  getErrorMessage: (error) => error.message,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isViewer: false }),
}));

const donor = { id: 2, name: 'Donor', mobileNumber: '9000000002', donationAmount: 500 };
const attendee = { id: 3, name: 'Attendee', mobileNumber: '9000000003' };

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url === '/sms/donation-only-recipients') {
      return Promise.resolve({ data: { data: [donor] } });
    }
    if (url === '/sms/not-staying-recipients') {
      return Promise.resolve({ data: { data: [attendee] } });
    }
    return Promise.resolve({ data: { data: [] } });
  });
  api.post.mockResolvedValue({
    data: { data: { channel: 'WHATSAPP', campaignId: 1, sentCount: 1, failedCount: 0, totalRecipients: 1 } },
  });
});

describe('targeted WhatsApp campaigns', () => {
  it('sends the selected non-staying devotee with the correct campaign type', async () => {
    render(<SmsCampaigns />);
    const [channel, campaignType, recipients] = screen.getAllByRole('combobox');

    fireEvent.change(campaignType, { target: { value: 'NOT_STAYING' } });
    expect(channel).toBeDisabled();
    expect(recipients).toHaveValue('NOT_STAYING_ONLY');
    await waitFor(() => expect(screen.getByText('Attendee')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Send non-staying confirmation (0)' })).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Send non-staying confirmation (1)' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/sms/campaigns', {
        type: 'NOT_STAYING',
        channel: 'WHATSAPP',
        registrationIds: [3],
      })
    );
  });

  it('retains the donation workflow and clears selection when changing categories', async () => {
    render(<SmsCampaigns />);
    const [, campaignType] = screen.getAllByRole('combobox');
    fireEvent.change(campaignType, { target: { value: 'DONATION' } });
    await waitFor(() => expect(screen.getByText('Donor')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(campaignType, { target: { value: 'NOT_STAYING' } });
    await waitFor(() => expect(screen.getByText('Attendee')).toBeInTheDocument());
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Send non-staying confirmation (0)' })).toBeDisabled();
  });
});
