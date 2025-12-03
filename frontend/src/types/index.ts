// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  profession?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

// RFP types
export interface RFPItem {
  name: string;
  quantity: number;
  specifications?: string;
}

export interface RFPStructuredData {
  items?: RFPItem[];
  budget?: number;
  deliveryDeadline?: string;
  paymentTerms?: string;
  warrantyRequirements?: string;
  additionalTerms?: string;
}

export interface RFP {
  _id: string;
  title: string;
  description: string;
  status: 'draft' | 'sent' | 'receiving' | 'completed';
  structuredData?: RFPStructuredData;
  vendors?: (string | Vendor)[];
  createdAt: string;
  updatedAt?: string;
}

// Vendor types
export interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  category?: string[];
  rating: number;
}

export interface VendorWithCategoryString extends Vendor {
  categoryString?: string;
}

// Proposal types
export interface ProposalParsedData {
  totalCost?: number;
  deliveryTimeline?: string;
  paymentTerms?: string;
  warrantyOffered?: string;
}

export interface ProposalAIAnalysis {
  completenessScore?: number;
  priceCompetitiveness?: string;
}

export interface Proposal {
  _id: string;
  rfpId: string;
  vendorId?: Vendor;
  status: 'pending' | 'received' | 'analyzed';
  parsedData?: ProposalParsedData;
  aiAnalysis?: ProposalAIAnalysis;
  receivedAt?: string;
  createdAt: string;
}

// Comparison types
export interface ComparisonProposal {
  vendorId: string;
  vendorName: string;
  totalCost?: number;
  deliveryTimeline?: string;
  paymentTerms?: string;
  warrantyOffered?: string;
  completenessScore?: number;
  termsCompliance?: string;
}

export interface ComparisonAIRecommendation {
  bestVendorId: string;
  overallScore?: Record<string, number>;
  reasoning?: string;
  priceComparison?: string;
}

export interface ComparisonSummary {
  totalProposals: number;
  lowestPrice?: number;
  highestPrice?: number;
  averageCompleteness: number;
}

export interface ComparisonData {
  hasProposals: boolean;
  proposals: ComparisonProposal[];
  aiRecommendation?: ComparisonAIRecommendation;
  summary: ComparisonSummary;
}

// Dashboard stats
export interface DashboardStats {
  total: number;
  draft: number;
  sent: number;
  receiving: number;
  completed: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  profession: string;
}
