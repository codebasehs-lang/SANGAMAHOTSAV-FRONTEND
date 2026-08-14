/**
 * Registration.test.jsx
 *
 * UI-level tests for the Devotee Registration page.
 * Every scenario here mirrors a real browser interaction a tester would perform.
 *
 * Run:  npm run test:run
 * Watch: npm test
 */

import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Registration from './Registration';
import api from '@/lib/api';

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getErrorMessage: (err) =>
    err?.response?.data?.error?.message || err?.message || 'Something went wrong.',
}));

vi.mock('country-state-city', () => ({
  Country: {
    getAllCountries: () => [
      { isoCode: 'IN', name: 'India' },
      { isoCode: 'US', name: 'United States' },
    ],
  },
  State: {
    getStatesOfCountry: (code) => {
      if (code === 'IN') {
        return [
          { isoCode: 'KA', name: 'Karnataka' },
          { isoCode: 'OD', name: 'Odisha' },
        ];
      }
      return [];
    },
  },
  City: {
    getCitiesOfState: (country, stateCode) => {
      if (country === 'IN' && stateCode === 'KA') {
        return [{ name: 'Bengaluru' }, { name: 'Mysuru' }];
      }
      if (country === 'IN' && stateCode === 'OD') {
        return [{ name: 'Bhubaneswar' }];
      }
      return [];
    },
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** React-hook-form sets the `name` attribute via register(); use it to locate inputs. */
const field = (name) => document.querySelector(`[name="${name}"]`);

/** The amount-paid input is uniquely identified by step="0.01". */
const amountInput = () => document.querySelector('input[step="0.01"]');

/**
 * Fill in the minimum fields required to pass Zod validation and submit.
 * Uses fireEvent for selects (more reliable with react-hook-form) and
 * userEvent for text inputs.
 */
async function fillMinimumRequiredFields(user) {
  await user.type(field('name'), 'Rama Das');
  await user.type(field('mobileNumber'), '9876543210');
  await user.type(field('email'), 'test@example.com');
  await user.type(field('comingFrom'), 'Mumbai');
  fireEvent.change(field('gender'), { target: { value: 'MALE' } });
  fireEvent.change(field('country'), { target: { value: 'IN' } });
  fireEvent.change(field('state'), { target: { value: 'Karnataka' } });
  fireEvent.change(field('district'), { target: { value: 'Bengaluru' } });
  // Select an accommodation so that amountPaid is auto-calculated
  await user.click(screen.getByRole('radio', { name: /Dormitory/i }));
  await waitFor(() => expect(amountInput()).toHaveValue(5000));
  // Upload a payment screenshot (required for non-Brahmachari)
  const mockFile = new File(['img'], 'payment.jpg', { type: 'image/jpeg' });
  await user.upload(document.querySelector('input[type="file"]'), mockFile);
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(async () => {
  // Availability fetch returns empty (no dormitory closed by default)
  api.get.mockResolvedValue({ data: { data: [] } });
  api.post.mockResolvedValue({ data: {} });
  window.scrollTo = vi.fn();
  URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');

  await act(async () => {
    render(<Registration />);
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── 1. Initial Render ───────────────────────────────────────────────────────

describe('Initial Render', () => {
  it('renders the page heading', () => {
    expect(screen.getByText('Devotee Registration')).toBeInTheDocument();
  });

  it('renders all major form sections', () => {
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Family Members / Relatives')).toBeInTheDocument();
    expect(screen.getByText('Travel Details')).toBeInTheDocument();
    expect(screen.getByText('Accommodation Preferences')).toBeInTheDocument();
    expect(screen.getByText('Payment Details')).toBeInTheDocument();
  });

  it('shows the event title', () => {
    expect(screen.getByText(/Sanga Mahotsav/i)).toBeInTheDocument();
  });

  it('defaults arrival date to 02-oct-2026', () => {
    expect(field('arrivalDate')).toHaveValue('02-oct-2026');
  });

  it('defaults departure date to 07-oct-2026', () => {
    expect(field('departureDate')).toHaveValue('07-oct-2026');
  });

  it('defaults devotee category to DISCIPLE', () => {
    expect(field('devoteeCategory')).toHaveValue('DISCIPLE');
  });

  it('defaults amountPaid to 0 (nothing selected)', () => {
    expect(amountInput()).toHaveValue(0);
  });

  it('state dropdown is disabled until country is selected', () => {
    expect(field('state')).toBeDisabled();
  });

  it('district dropdown is disabled until state is selected', () => {
    expect(field('district')).toBeDisabled();
  });

  it('"No family members added" placeholder text is shown', () => {
    expect(screen.getByText(/No family members added/i)).toBeInTheDocument();
  });

  it('submit button is visible', () => {
    expect(screen.getByRole('button', { name: /Submit Registration/i })).toBeInTheDocument();
  });
});

// ─── 2. Required-Field Validation ───────────────────────────────────────────

describe('Required Field Validation', () => {
  it('shows "Name is required" when name is left empty', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('shows "Gender is required" when gender is not selected', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText('Gender is required')).toBeInTheDocument();
    });
  });

  it('shows mobile validation error for non-numeric input', async () => {
    const user = userEvent.setup();
    await user.type(field('mobileNumber'), 'abcde');
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid 10-15 digit number/i)).toBeInTheDocument();
    });
  });

  it('shows mobile validation error for too-short number', async () => {
    const user = userEvent.setup();
    await user.type(field('mobileNumber'), '12345');
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid 10-15 digit number/i)).toBeInTheDocument();
    });
  });

  it('shows email validation error for invalid email', async () => {
    const user = userEvent.setup();
    await user.type(field('email'), 'notanemail');
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows "Country is required" when country is not selected', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText('Country is required')).toBeInTheDocument();
    });
  });

  it('rejects a name with invalid characters', async () => {
    const user = userEvent.setup();
    await user.type(field('name'), 'Rama@Das123');
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText(/Name can only contain letters/i)).toBeInTheDocument();
    });
  });

  it('rejects a name longer than 150 characters', async () => {
    const user = userEvent.setup();
    await user.type(field('name'), 'A'.repeat(151));
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText(/at most 150 characters/i)).toBeInTheDocument();
    });
  });

  it('shows payment screenshot error for non-Brahmachari without file', async () => {
    const user = userEvent.setup();
    // Fill everything except screenshot
    await user.type(field('name'), 'Rama Das');
    await user.type(field('mobileNumber'), '9876543210');
    await user.type(field('email'), 'test@example.com');
    await user.type(field('comingFrom'), 'Mumbai');
    fireEvent.change(field('gender'), { target: { value: 'MALE' } });
    fireEvent.change(field('country'), { target: { value: 'IN' } });
    fireEvent.change(field('state'), { target: { value: 'Karnataka' } });
    fireEvent.change(field('district'), { target: { value: 'Bengaluru' } });
    await user.click(screen.getByRole('radio', { name: /Dormitory/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(5000));

    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText(/Payment screenshot is required/i)).toBeInTheDocument();
    });
  });
});

// ─── 3. Attendance Type ──────────────────────────────────────────────────────

describe('Attendance Type', () => {
  it('"Regular attendee" radio is checked by default', () => {
    expect(screen.getByRole('radio', { name: /Regular attendee/i })).toBeChecked();
  });

  it('selecting "Non attending" sets amount to 2000', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Non attending devotee contribution/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(2000));
  });

  it('selecting "Attending but not staying" sets amount to 3500', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Attending but not staying/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(3500));
  });

  it('selecting non-attending disables accommodation radio buttons', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Non attending devotee contribution/i }));
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Dormitory/i })).toBeDisabled();
    });
  });

  it('shows "accommodation is disabled" description when non-attending is selected', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Non attending devotee contribution/i }));
    expect(
      screen.getByText(/Accommodation is disabled because non attending/i)
    ).toBeInTheDocument();
  });

  it('switching back to regular attendee re-enables accommodation', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Non attending devotee contribution/i }));
    await user.click(screen.getByRole('radio', { name: /Regular attendee/i }));
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Dormitory/i })).not.toBeDisabled();
    });
  });
});

// ─── 4. Accommodation Amount Calculation ─────────────────────────────────────

describe('Accommodation Amount Calculation', () => {
  it('Dormitory → ₹5,000', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Dormitory/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(5000));
  });

  it('Non AC Sharing → ₹6,000', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Non AC Sharing/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(6000));
  });

  it('AC Sharing → ₹7,000', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /AC Sharing/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(7000));
  });

  it('Deluxe AC (family) → ₹18,000', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Deluxe AC/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(18000));
  });

  it('Premium AC (family) → ₹19,500', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Premium AC/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(19500));
  });

  it('only one accommodation option is selected at a time', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Non AC Sharing/i }));
    await user.click(screen.getByRole('radio', { name: /AC Sharing/i }));
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /AC Sharing/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /Non AC Sharing/i })).not.toBeChecked();
    });
  });
});

// ─── 5. Extra Charges (visible only for Family Accommodation) ────────────────

describe('Extra Charges', () => {
  it('extra charge checkboxes are hidden before family accommodation is selected', () => {
    expect(
      screen.queryByRole('checkbox', { name: /Add extra devotee/i })
    ).not.toBeInTheDocument();
  });

  it('extra charge checkboxes appear after selecting Deluxe AC', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Deluxe AC/i }));
    expect(
      await screen.findByRole('checkbox', { name: /Add extra devotee/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /Children \(\+12 years\)/i })
    ).toBeInTheDocument();
  });

  it('selecting "Extra devotee" adds ₹3,500 to the accommodation total', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Deluxe AC/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(18000));
    await user.click(await screen.findByRole('checkbox', { name: /Add extra devotee/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(21500)); // 18000 + 3500
  });

  it('selecting "Children +12 years" adds ₹1,000 to the accommodation total', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Deluxe AC/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(18000));
    await user.click(await screen.findByRole('checkbox', { name: /Children \(\+12 years\)/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(19000)); // 18000 + 1000
  });

  it('both extra charges combined add ₹4,500', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Deluxe AC/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(18000));
    await user.click(await screen.findByRole('checkbox', { name: /Add extra devotee/i }));
    await user.click(screen.getByRole('checkbox', { name: /Children \(\+12 years\)/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(22500)); // 18000 + 3500 + 1000
  });
});

// ─── 6. Brahmachari Ashram Mode ──────────────────────────────────────────────

describe('Brahmachari Ashram Mode', () => {
  beforeEach(async () => {
    fireEvent.change(field('devoteeAshram'), { target: { value: 'BRAHMACHARI' } });
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Dormitory/i })).toBeDisabled();
    });
  });

  it('disables all accommodation radio buttons', () => {
    expect(screen.getByRole('radio', { name: /Dormitory/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Non AC Sharing/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /AC Sharing/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Deluxe AC/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Premium AC/i })).toBeDisabled();
  });

  it('disables the "Add" family member button', () => {
    expect(screen.getByRole('button', { name: /Add/i })).toBeDisabled();
  });

  it('shows "Optional for Brahmachari" hint for payment screenshot', () => {
    expect(
      screen.getByText(/Optional for Brahmachari registration/i)
    ).toBeInTheDocument();
  });

  it('sets amount to 0 (no accommodation cost for Brahmachari)', () => {
    expect(amountInput()).toHaveValue(0);
  });
});

// ─── 7. Family Members ───────────────────────────────────────────────────────

describe('Family Members', () => {
  it('clicking Add inserts a new family member row', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add/i }));
    // A new row with Name/Age/Category/Gender inputs should appear
    const rows = document.querySelectorAll('[name^="familyMembers"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('clicking Add twice shows two family member rows', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add/i }));
    await user.click(screen.getByRole('button', { name: /Add/i }));
    // Each row has 4 fields: name, age, devoteeCategory, gender
    const nameFields = document.querySelectorAll('[name^="familyMembers"][name$=".name"]');
    expect(nameFields).toHaveLength(2);
  });

  it('clicking the trash icon removes the family member row', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add/i }));
    const trashButton = screen.getByRole('button', { name: '' }); // Trash2 icon, no text
    // Count rows before removal
    expect(document.querySelectorAll('[name$=".name"]').length).toBeGreaterThan(0);
    await user.click(trashButton);
    expect(
      document.querySelectorAll('[name^="familyMembers"][name$=".name"]')
    ).toHaveLength(0);
  });

  it('"No family members added" message disappears after adding a member', async () => {
    const user = userEvent.setup();
    expect(screen.getByText(/No family members added/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Add/i }));
    expect(screen.queryByText(/No family members added/i)).not.toBeInTheDocument();
  });
});

// ─── 8. Services (max 2) ─────────────────────────────────────────────────────

describe('Services Selection (max 2)', () => {
  it('allows selecting up to 2 services', async () => {
    const user = userEvent.setup();
    const [first, second] = screen.getAllByRole('checkbox').filter(
      (cb) => cb.name === 'services'
    );
    await user.click(first);
    await user.click(second);
    expect(first).toBeChecked();
    expect(second).toBeChecked();
  });

  it('disables remaining services after 2 are selected', async () => {
    const user = userEvent.setup();
    const serviceCheckboxes = screen.getAllByRole('checkbox').filter(
      (cb) => cb.name === 'services'
    );
    await user.click(serviceCheckboxes[0]);
    await user.click(serviceCheckboxes[1]);
    // Third service should now be disabled
    await waitFor(() => {
      expect(serviceCheckboxes[2]).toBeDisabled();
    });
  });

  it('re-enables a service after unchecking one of the two selected', async () => {
    const user = userEvent.setup();
    const serviceCheckboxes = screen.getAllByRole('checkbox').filter(
      (cb) => cb.name === 'services'
    );
    await user.click(serviceCheckboxes[0]);
    await user.click(serviceCheckboxes[1]);
    await user.click(serviceCheckboxes[0]); // uncheck first
    await waitFor(() => {
      expect(serviceCheckboxes[2]).not.toBeDisabled();
    });
  });

  it('shows "Need Journey Prasad" checkbox', () => {
    expect(screen.getByRole('checkbox', { name: /Need Journey Prasad/i })).toBeInTheDocument();
  });

  it('shows "Coming with own 4-wheeler" checkbox', () => {
    expect(
      screen.getByRole('checkbox', { name: /Coming with own 4-wheeler/i })
    ).toBeInTheDocument();
  });
});

// ─── 9. Country → State → District Cascade ───────────────────────────────────

describe('Country / State / District Cascade', () => {
  it('state dropdown becomes enabled after selecting a country', async () => {
    expect(field('state')).toBeDisabled();
    fireEvent.change(field('country'), { target: { value: 'IN' } });
    await waitFor(() => expect(field('state')).not.toBeDisabled());
  });

  it('state dropdown is populated with states for the selected country', () => {
    fireEvent.change(field('country'), { target: { value: 'IN' } });
    expect(screen.getByRole('option', { name: 'Karnataka' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Odisha' })).toBeInTheDocument();
  });

  it('district dropdown becomes enabled after selecting a state', async () => {
    fireEvent.change(field('country'), { target: { value: 'IN' } });
    await waitFor(() => expect(field('state')).not.toBeDisabled());
    fireEvent.change(field('state'), { target: { value: 'Karnataka' } });
    await waitFor(() => expect(field('district')).not.toBeDisabled());
  });

  it('district dropdown is populated with cities for the selected state', async () => {
    fireEvent.change(field('country'), { target: { value: 'IN' } });
    fireEvent.change(field('state'), { target: { value: 'Karnataka' } });
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Bengaluru' })).toBeInTheDocument();
    });
  });

  it('changing country resets state and district', async () => {
    fireEvent.change(field('country'), { target: { value: 'IN' } });
    fireEvent.change(field('state'), { target: { value: 'Karnataka' } });
    // Change country — state should be cleared
    fireEvent.change(field('country'), { target: { value: 'US' } });
    await waitFor(() => expect(field('state')).toHaveValue(''));
    expect(field('district')).toHaveValue('');
  });
});

// ─── 10. Donation Items ───────────────────────────────────────────────────────

describe('Donation Items', () => {
  it('selecting "Arcana Seva" (₹3,000) adds to the amount', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Dormitory/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(5000));
    const arcanaCheckbox = screen.getByRole('checkbox', { name: /Add this donation/i,
      // Arcana Seva checkbox — find within the Arcana Seva label container
    });
    // Find Arcana Seva donation checkbox
    const arcanaLabel = screen.getByText('Arcana Seva').closest('label');
    const arcanaCheck = within(arcanaLabel).getByRole('checkbox');
    await user.click(arcanaCheck);
    await waitFor(() => expect(amountInput()).toHaveValue(8000)); // 5000 + 3000
  });

  it('shows custom amount field for Vyaspuja Dakshina when selected', async () => {
    const user = userEvent.setup();
    const vyasLabel = screen.getByText('Vyaspuja Dakshina').closest('label');
    const vyasCheck = within(vyasLabel).getByRole('checkbox');
    await user.click(vyasCheck);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
    });
  });

  it('Vyaspuja Dakshina custom amount is added to total', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /Dormitory/i }));
    await waitFor(() => expect(amountInput()).toHaveValue(5000));
    const vyasLabel = screen.getByText('Vyaspuja Dakshina').closest('label');
    const vyasCheck = within(vyasLabel).getByRole('checkbox');
    await user.click(vyasCheck);
    const customInput = await screen.findByPlaceholderText('Enter amount');
    await user.clear(customInput);
    await user.type(customInput, '1000');
    await waitFor(() => expect(amountInput()).toHaveValue(6000)); // 5000 + 1000
  });

  it('shows purpose + amount fields for custom purpose donation when selected', async () => {
    const user = userEvent.setup();
    const purposeLabel = screen.getByText('Purpose').closest('label');
    const purposeCheck = within(purposeLabel).getByRole('checkbox');
    await user.click(purposeCheck);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter purpose')).toBeInTheDocument();
    });
  });
});

// ─── 11. Form Submission ─────────────────────────────────────────────────────

describe('Form Submission', () => {
  it('shows success screen after a valid submission', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });
    await fillMinimumRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByText('Registration Submitted')).toBeInTheDocument();
    });
    expect(screen.getByText(/Your registration has been received/i)).toBeInTheDocument();
  });

  it('calls the API with a FormData payload on submit', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });
    await fillMinimumRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/registrations', expect.any(FormData));
    });
  });

  it('shows error toast overlay when the API returns an error', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      message: 'Server error',
      response: { data: { error: { message: 'Mobile number already registered.' } } },
    });
    await fillMinimumRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(
        screen.getByText('Mobile number already registered.')
      ).toBeInTheDocument();
    });
  });

  it('closes the error toast when the X button is clicked', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      message: 'Server error',
      response: { data: { error: { message: 'Something failed.' } } },
    });
    await fillMinimumRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => screen.getByText('Something failed.'));
    await user.click(screen.getByRole('button', { name: /Close error popup/i }));
    expect(screen.queryByText('Something failed.')).not.toBeInTheDocument();
  });

  it('"Submit Another Registration" button re-shows the form after success', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });
    await fillMinimumRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => screen.getByText('Registration Submitted'));
    await user.click(screen.getByRole('button', { name: /Submit Another Registration/i }));
    expect(screen.getByText('Devotee Registration')).toBeInTheDocument();
  });

  it('shows "Submitting..." label while the request is in-flight', async () => {
    const user = userEvent.setup();
    // Never-resolving promise simulates a slow server
    api.post.mockReturnValueOnce(new Promise(() => {}));
    await fillMinimumRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /Submit Registration/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submitting/i })).toBeInTheDocument();
    });
  });
});

// ─── 12. Modals ───────────────────────────────────────────────────────────────

describe('Modals', () => {
  it('opens the Scan and Pay QR modal when button is clicked', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Scan and Pay/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Scan and Pay')).toBeInTheDocument();
  });

  it('closes the QR modal when the overlay close button is clicked', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Scan and Pay/i }));
    await screen.findByRole('dialog');
    // Modal close button (the X button in the modal header)
    await user.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('opens the venue map modal when the venue button is clicked', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Bhubaneswar/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/ARC The Boutique Hotel/i)).toBeInTheDocument();
  });
});

// ─── 13. Dormitory Closed / Availability ─────────────────────────────────────

describe('Dormitory Availability', () => {
  it('shows dormitory closed message when availability says full for selected gender', async () => {
    const user = userEvent.setup();
    // Re-render with a closed dormitory for MALE
    api.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            accommodationType: 'DORMITORY',
            gender: 'MALE',
            isOpen: false,
            statusMessage: 'Dormitory is full for Prabhuji.',
          },
        ],
      },
    });

    // Render fresh with the new mock
    const { unmount } = await act(async () =>
      render(<Registration />)
    );

    // Select male gender
    fireEvent.change(document.querySelectorAll('[name="gender"]')[1], {
      target: { value: 'MALE' },
    });

    await waitFor(() => {
      expect(screen.getByText('Dormitory is full for Prabhuji.')).toBeInTheDocument();
    });

    unmount();
  });
});

// ─── 14. Preferred Subject ────────────────────────────────────────────────────

describe('Preferred Subject', () => {
  it('shows "Other subject" text input only when "Other" is selected', async () => {
    expect(
      screen.queryByRole('textbox', { name: /Other subject/i })
    ).not.toBeInTheDocument();
    fireEvent.change(field('preferredSubject'), { target: { value: 'OTHER' } });
    await waitFor(() => {
      expect(field('preferredSubjectOther')).toBeInTheDocument();
    });
  });

  it('hides "Other subject" field when a non-OTHER option is selected', async () => {
    fireEvent.change(field('preferredSubject'), { target: { value: 'OTHER' } });
    await waitFor(() => expect(field('preferredSubjectOther')).toBeInTheDocument());
    fireEvent.change(field('preferredSubject'), { target: { value: 'BHAGAVAD_GITA' } });
    await waitFor(() => expect(field('preferredSubjectOther')).not.toBeInTheDocument());
  });
});
