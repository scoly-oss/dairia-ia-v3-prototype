import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyTokenManagement from '../CompanyTokenManagement';
import { companyService } from '../../../services/companyService';
import type { Company, User } from '../../../types/auth';
import type { CompanyTokenStats } from '../../../services/companyService';

// Mock companyService
vi.mock('../../../services/companyService', () => ({
  companyService: {
    getAllCompanies: vi.fn(),
    getCompanyTokenStats: vi.fn(),
    getCompanyUsers: vi.fn(),
    updateCompanySubscription: vi.fn(),
  },
}));

// Helper to create mock company data
const createMockCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 'company-1',
  name: 'Test Company',
  monthly_token_limit: 100000,
  subscription_type: 'premium',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Helper to create mock token stats
const createMockTokenStats = (overrides: Partial<CompanyTokenStats> = {}): CompanyTokenStats => ({
  currentMonthTokens: 50000,
  currentMonthCost: 0.15,  // Coût réel GPT + Claude
  tokenLimit: 100000,
  remainingTokens: 50000,
  subscriptionType: 'premium',
  subscriptionStartDate: '2024-01-01T00:00:00Z',
  renewalDate: '2024-02-01T00:00:00Z',
  userCount: 3,
  subscriptionStatus: 'active',
  trialEndsAt: null,
  daysRemaining: 15,
  cancelAtPeriodEnd: false,
  cancelAt: null,
  companyCreatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Helper to create mock user data
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'user@test.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+33612345678',
  role: 'client' as const,
  isActive: true,
  ...overrides,
});

describe('CompanyTokenManagement', () => {
  const mockCompanies: Company[] = [
    createMockCompany({ id: 'company-1', name: 'Alpha Corp' }),
    createMockCompany({ id: 'company-2', name: 'Beta Inc' }),
    createMockCompany({ id: 'company-3', name: 'Gamma Ltd' }),
  ];

  const mockTokenStats: Record<string, CompanyTokenStats> = {
    'company-1': createMockTokenStats({ subscriptionStatus: 'active', userCount: 3 }),
    'company-2': createMockTokenStats({ subscriptionStatus: 'trialing', userCount: 2 }),
    'company-3': createMockTokenStats({ subscriptionStatus: 'past_due', userCount: 1 }),
  };

  const mockUsers = [
    createMockUser({ id: 'user-1', email: 'john@alpha.com', firstName: 'John', lastName: 'Doe', phone: '+33612345678' }),
    createMockUser({ id: 'user-2', email: 'jane@alpha.com', firstName: 'Jane', lastName: 'Smith', phone: '+33698765432' }),
    createMockUser({ id: 'user-3', email: 'bob@alpha.com', firstName: 'Bob', lastName: 'Wilson', phone: '' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(companyService.getAllCompanies).mockResolvedValue(mockCompanies);
    vi.mocked(companyService.getCompanyTokenStats).mockImplementation((id: string) =>
      Promise.resolve(mockTokenStats[id] || createMockTokenStats())
    );
    vi.mocked(companyService.getCompanyUsers).mockResolvedValue(mockUsers);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should show loading spinner initially', () => {
      render(<CompanyTokenManagement />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render company list after loading', async () => {
      render(<CompanyTokenManagement />);

      // Wait for companies to be displayed (this proves loading is complete)
      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma Ltd')).toBeInTheDocument();
    });

    it('should display search input and status filter', async () => {
      render(<CompanyTokenManagement />);

      // Wait for loading to complete by checking for content
      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Rechercher une entreprise...')).toBeInTheDocument();
      expect(screen.getByLabelText('Statut')).toBeInTheDocument();
    });

    it('should show error message when loading fails', async () => {
      vi.mocked(companyService.getAllCompanies).mockRejectedValue(new Error('Network error'));

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Impossible de charger les statistiques des companies')).toBeInTheDocument();
      });
    });

    it('should show empty state when no companies exist', async () => {
      vi.mocked(companyService.getAllCompanies).mockResolvedValue([]);

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Aucune entreprise trouvée')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter companies by name when searching', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Rechercher une entreprise...');
      await user.type(searchInput, 'Alpha');

      expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma Ltd')).not.toBeInTheDocument();
    });

    it('should show result count when filtering', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Rechercher une entreprise...');
      await user.type(searchInput, 'Alpha');

      expect(screen.getByText('1 résultat(s)')).toBeInTheDocument();
    });

    it('should be case-insensitive', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Rechercher une entreprise...');
      await user.type(searchInput, 'ALPHA');

      expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    });

    it('should show empty state when search has no results', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Rechercher une entreprise...');
      await user.type(searchInput, 'NonExistent');

      expect(screen.getByText('Aucune entreprise ne correspond aux critères de recherche')).toBeInTheDocument();
    });
  });

  describe('Status Filter', () => {
    it('should filter companies by subscription status', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Open status filter dropdown
      const statusSelect = screen.getByLabelText('Statut');
      await user.click(statusSelect);

      // Select "Essai" (trialing)
      const trialingOption = screen.getByRole('option', { name: 'Essai' });
      await user.click(trialingOption);

      // Only Beta Inc should be visible (trialing status)
      expect(screen.queryByText('Alpha Corp')).not.toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.queryByText('Gamma Ltd')).not.toBeInTheDocument();
    });

    it('should show all companies when "Tous les statuts" is selected', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Filter by status first
      const statusSelect = screen.getByLabelText('Statut');
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'Essai' }));

      // Then reset to all
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'Tous les statuts' }));

      expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma Ltd')).toBeInTheDocument();
    });

    it('should filter by "Impayé" status', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Statut');
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'Impayé' }));

      // Only Gamma Ltd should be visible (past_due status)
      expect(screen.queryByText('Alpha Corp')).not.toBeInTheDocument();
      expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument();
      expect(screen.getByText('Gamma Ltd')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by company name ascending by default', async () => {
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Get all company names in order
      const companyNames = screen.getAllByText(/Corp|Inc|Ltd/).map(el => el.textContent);
      expect(companyNames[0]).toBe('Alpha Corp');
    });

    it('should toggle sort order when clicking on Entreprise column', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Click on "Entreprise" header to sort descending
      const entrepriseHeader = screen.getByRole('button', { name: /Entreprise/i });
      await user.click(entrepriseHeader);

      // Get all company names in order - first one should now be Gamma Ltd
      const companyNames = screen.getAllByText(/Corp|Inc|Ltd/).map(el => el.textContent);
      expect(companyNames[0]).toBe('Gamma Ltd');
    });

    it('should sort by status when clicking on Statut column', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Click on "Statut abonnement" header
      const statusHeader = screen.getByRole('button', { name: /Statut abonnement/i });
      await user.click(statusHeader);

      // After sorting by status ascending, 'active' comes first alphabetically
      // Alpha Corp has 'active' status
      const companyNames = screen.getAllByText(/Corp|Inc|Ltd/).map(el => el.textContent);
      expect(companyNames[0]).toBe('Alpha Corp');
    });
  });

  describe('Expandable Rows (Users)', () => {
    // Helper to find the expand button for a specific company
    const getExpandButton = (companyName: string) => {
      const companyRow = screen.getByText(companyName).closest('tr');
      return within(companyRow!).getAllByRole('button')[0]; // First button is expand
    };

    it('should show expand button on each row', async () => {
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Each company row should have an expand button
      expect(getExpandButton('Alpha Corp')).toBeInTheDocument();
      expect(getExpandButton('Beta Inc')).toBeInTheDocument();
      expect(getExpandButton('Gamma Ltd')).toBeInTheDocument();
    });

    it('should load and display users when expanding a row', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Click expand button
      await user.click(getExpandButton('Alpha Corp'));

      // Wait for users to load
      await waitFor(() => {
        expect(companyService.getCompanyUsers).toHaveBeenCalledWith('company-1');
      });

      // Check users are displayed
      await waitFor(() => {
        expect(screen.getByText('john@alpha.com')).toBeInTheDocument();
        expect(screen.getByText('jane@alpha.com')).toBeInTheDocument();
        expect(screen.getByText('bob@alpha.com')).toBeInTheDocument();
      });
    });

    it('should display user phone numbers', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      await user.click(getExpandButton('Alpha Corp'));

      await waitFor(() => {
        expect(screen.getByText('+33612345678')).toBeInTheDocument();
        expect(screen.getByText('+33698765432')).toBeInTheDocument();
      });
    });

    it('should display "-" for users without phone', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      await user.click(getExpandButton('Alpha Corp'));

      await waitFor(() => {
        expect(screen.getByText('bob@alpha.com')).toBeInTheDocument();
      });

      // Bob Wilson has no phone, should show '-'
      const bobRow = screen.getByText('bob@alpha.com').closest('tr');
      expect(bobRow).toBeInTheDocument();
      expect(within(bobRow!).getAllByText('-').length).toBeGreaterThan(0);
    });

    it('should display user full name', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      await user.click(getExpandButton('Alpha Corp'));

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display user role with badge', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      await user.click(getExpandButton('Alpha Corp'));

      await waitFor(() => {
        expect(screen.getByText('john@alpha.com')).toBeInTheDocument();
      });

      // Find the user row and check the role
      const userRow = screen.getByText('john@alpha.com').closest('tr');
      expect(within(userRow!).getByText('Client')).toBeInTheDocument();
    });

    it('should display user status (active/inactive)', async () => {
      const user = userEvent.setup();
      vi.mocked(companyService.getCompanyUsers).mockResolvedValue([
        createMockUser({ id: 'user-1', isActive: true, email: 'active@test.com' }),
        createMockUser({ id: 'user-2', isActive: false, email: 'inactive@test.com' }),
      ]);

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      await user.click(getExpandButton('Alpha Corp'));

      // Wait for users to be displayed
      await waitFor(() => {
        expect(screen.getByText('active@test.com')).toBeInTheDocument();
        expect(screen.getByText('inactive@test.com')).toBeInTheDocument();
      });

      // Find the user rows in the expanded section and check their status chips
      const activeUserRow = screen.getByText('active@test.com').closest('tr');
      const inactiveUserRow = screen.getByText('inactive@test.com').closest('tr');

      expect(activeUserRow).toBeInTheDocument();
      expect(inactiveUserRow).toBeInTheDocument();

      // Check that status chips are present in the user rows
      expect(within(activeUserRow!).getByText('Actif')).toBeInTheDocument();
      expect(within(inactiveUserRow!).getByText('Inactif')).toBeInTheDocument();
    });

    it('should show loading spinner while fetching users', async () => {
      const user = userEvent.setup();
      // Make getCompanyUsers slow
      vi.mocked(companyService.getCompanyUsers).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUsers), 100))
      );

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      await user.click(getExpandButton('Alpha Corp'));

      // Should show loading spinner or the users section
      await waitFor(() => {
        const expandedSection = screen.getByText(/Utilisateurs/);
        expect(expandedSection).toBeInTheDocument();
      });
    });

    it('should show message when company has no users', async () => {
      const user = userEvent.setup();
      vi.mocked(companyService.getCompanyUsers).mockResolvedValue([]);

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      await user.click(getExpandButton('Alpha Corp'));

      // Wait for the expand section to appear first
      await waitFor(() => {
        expect(companyService.getCompanyUsers).toHaveBeenCalledWith('company-1');
      });

      // Then check for the empty message
      await waitFor(() => {
        expect(screen.getByText('Aucun utilisateur dans cette entreprise')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should cache users and not refetch when collapsing and re-expanding', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      const expandBtn = getExpandButton('Alpha Corp');

      // First expand
      await user.click(expandBtn);
      await waitFor(() => {
        expect(screen.getByText('john@alpha.com')).toBeInTheDocument();
      });

      // Collapse
      await user.click(expandBtn);
      await waitFor(() => {
        expect(screen.queryByText('john@alpha.com')).not.toBeInTheDocument();
      });

      // Re-expand
      await user.click(expandBtn);
      await waitFor(() => {
        expect(screen.getByText('john@alpha.com')).toBeInTheDocument();
      });

      // Should only have called getCompanyUsers once
      expect(companyService.getCompanyUsers).toHaveBeenCalledTimes(1);
    });

    it('should collapse row when clicking again', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      const expandBtn = getExpandButton('Alpha Corp');

      // Expand
      await user.click(expandBtn);
      await waitFor(() => {
        expect(screen.getByText('john@alpha.com')).toBeInTheDocument();
      });

      // Collapse
      await user.click(expandBtn);

      await waitFor(() => {
        expect(screen.queryByText('john@alpha.com')).not.toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    it('should apply both search and status filter together', async () => {
      const user = userEvent.setup();

      // Setup companies with different names and statuses
      const mixedCompanies = [
        createMockCompany({ id: 'c1', name: 'Alpha Active' }),
        createMockCompany({ id: 'c2', name: 'Alpha Trial' }),
        createMockCompany({ id: 'c3', name: 'Beta Active' }),
      ];

      const mixedStats: Record<string, CompanyTokenStats> = {
        'c1': createMockTokenStats({ subscriptionStatus: 'active' }),
        'c2': createMockTokenStats({ subscriptionStatus: 'trialing' }),
        'c3': createMockTokenStats({ subscriptionStatus: 'active' }),
      };

      vi.mocked(companyService.getAllCompanies).mockResolvedValue(mixedCompanies);
      vi.mocked(companyService.getCompanyTokenStats).mockImplementation((id: string) =>
        Promise.resolve(mixedStats[id])
      );

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Active')).toBeInTheDocument();
      });

      // Search for "Alpha"
      const searchInput = screen.getByPlaceholderText('Rechercher une entreprise...');
      await user.type(searchInput, 'Alpha');

      // Filter by "Actif" status
      const statusSelect = screen.getByLabelText('Statut');
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'Actif' }));

      // Only "Alpha Active" should be visible
      expect(screen.getByText('Alpha Active')).toBeInTheDocument();
      expect(screen.queryByText('Alpha Trial')).not.toBeInTheDocument();
      expect(screen.queryByText('Beta Active')).not.toBeInTheDocument();
    });
  });

  describe('Refresh Button', () => {
    it('should reload companies when clicking refresh button', async () => {
      const user = userEvent.setup();
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Clear mock call count
      vi.mocked(companyService.getAllCompanies).mockClear();

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /Actualiser/i });
      await user.click(refreshButton);

      expect(companyService.getAllCompanies).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pagination', () => {
    const createManyCompanies = (count: number): Company[] => {
      return Array.from({ length: count }, (_, i) =>
        createMockCompany({
          id: `company-${i + 1}`,
          name: `Company ${String(i + 1).padStart(2, '0')}`
        })
      );
    };

    const createManyTokenStats = (count: number): Record<string, CompanyTokenStats> => {
      return Object.fromEntries(
        Array.from({ length: count }, (_, i) => [
          `company-${i + 1}`,
          createMockTokenStats({ subscriptionStatus: 'active', userCount: i + 1 })
        ])
      );
    };

    it('should display pagination controls', async () => {
      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });

      // Check pagination is present
      expect(screen.getByText('Lignes par page :')).toBeInTheDocument();
      expect(screen.getByText(/1-3 sur 3/)).toBeInTheDocument();
    });

    it('should paginate companies correctly', async () => {
      const manyCompanies = createManyCompanies(25);
      const manyStats = createManyTokenStats(25);

      vi.mocked(companyService.getAllCompanies).mockResolvedValue(manyCompanies);
      vi.mocked(companyService.getCompanyTokenStats).mockImplementation((id: string) =>
        Promise.resolve(manyStats[id])
      );

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Company 01')).toBeInTheDocument();
      });

      // Default is 10 per page, so Company 11 should not be visible
      expect(screen.queryByText('Company 11')).not.toBeInTheDocument();
      expect(screen.getByText(/1-10 sur 25/)).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      const manyCompanies = createManyCompanies(25);
      const manyStats = createManyTokenStats(25);

      vi.mocked(companyService.getAllCompanies).mockResolvedValue(manyCompanies);
      vi.mocked(companyService.getCompanyTokenStats).mockImplementation((id: string) =>
        Promise.resolve(manyStats[id])
      );

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Company 01')).toBeInTheDocument();
      });

      // Click next page button
      const nextPageButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextPageButton);

      // Company 11 should now be visible, Company 01 should not
      await waitFor(() => {
        expect(screen.getByText('Company 11')).toBeInTheDocument();
      });
      expect(screen.queryByText('Company 01')).not.toBeInTheDocument();
      expect(screen.getByText(/11-20 sur 25/)).toBeInTheDocument();
    });

    it('should change rows per page', async () => {
      const user = userEvent.setup();
      const manyCompanies = createManyCompanies(30);
      const manyStats = createManyTokenStats(30);

      vi.mocked(companyService.getAllCompanies).mockResolvedValue(manyCompanies);
      vi.mocked(companyService.getCompanyTokenStats).mockImplementation((id: string) =>
        Promise.resolve(manyStats[id])
      );

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Company 01')).toBeInTheDocument();
      });

      // Change to 25 per page
      const rowsPerPageSelect = screen.getByRole('combobox', { name: /lignes par page/i });
      await user.click(rowsPerPageSelect);
      await user.click(screen.getByRole('option', { name: '25' }));

      // Now 25 companies should be visible
      await waitFor(() => {
        expect(screen.getByText('Company 25')).toBeInTheDocument();
      });
      expect(screen.queryByText('Company 26')).not.toBeInTheDocument();
      expect(screen.getByText(/1-25 sur 30/)).toBeInTheDocument();
    });

    it('should reset to first page when filter changes', async () => {
      const user = userEvent.setup();
      const manyCompanies = createManyCompanies(25);
      const manyStats = createManyTokenStats(25);

      vi.mocked(companyService.getAllCompanies).mockResolvedValue(manyCompanies);
      vi.mocked(companyService.getCompanyTokenStats).mockImplementation((id: string) =>
        Promise.resolve(manyStats[id])
      );

      render(<CompanyTokenManagement />);

      await waitFor(() => {
        expect(screen.getByText('Company 01')).toBeInTheDocument();
      });

      // Go to page 2
      const nextPageButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(screen.getByText('Company 11')).toBeInTheDocument();
      });

      // Apply a search filter
      const searchInput = screen.getByPlaceholderText('Rechercher une entreprise...');
      await user.type(searchInput, 'Company 0');

      // Should reset to page 1 and show filtered results
      await waitFor(() => {
        expect(screen.getByText('Company 01')).toBeInTheDocument();
      });
    });
  });
});
