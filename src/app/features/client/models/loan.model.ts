export type LoanStatus = 'APPROVED' | 'OVERDUE' | 'REPAID' | 'REJECTED';

/**
 * Enumeracija za vrste kredita
 */
export enum LoanTypeOption {
  PERSONAL = 'PERSONAL',      // Gotovinski
  MORTGAGE = 'MORTGAGE',      // Stambeni
  AUTO = 'AUTO',              // Auto
  REFINANCING = 'REFINANCING', // Refinansirajući
  STUDENT = 'STUDENT'         // Studentski
}

/**
 * Labele za vrste kredita
 */
export const LoanTypeLabels: Record<LoanTypeOption | 'BUSINESS', string> = {
  [LoanTypeOption.PERSONAL]: 'Keš kredit',
  [LoanTypeOption.MORTGAGE]: 'Stambeni kredit',
  [LoanTypeOption.AUTO]: 'Auto kredit',
  [LoanTypeOption.STUDENT]: 'Studentski kredit',
  [LoanTypeOption.REFINANCING]: 'Refinansirajući kredit',
  'BUSINESS': 'Poslovni kredit'
};

/**
 * Periodi otplate za različite vrste kredita (u mesecima)
 */
export const LoanRepaymentTerms: Record<LoanTypeOption, number[]> = {
  [LoanTypeOption.PERSONAL]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.AUTO]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.MORTGAGE]: [60, 120, 180, 240, 300, 360],
  [LoanTypeOption.STUDENT]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.REFINANCING]: [12, 24, 36, 48, 60, 72, 84]
};

/**
 * Enumeracija za tip kamatne stope
 */
export enum InterestRateType {
  FIXED = 'FIXED',       // Fiksna
  VARIABLE = 'VARIABLE'  // Varijabilna
}

/**
 * Labele za tip kamatne stope
 */
export const InterestRateTypeLabels: Record<InterestRateType, string> = {
  [InterestRateType.FIXED]: 'Fiksna',
  [InterestRateType.VARIABLE]: 'Varijabilna'
};


/**
 * Enumeracija za valute
 */
export enum Currency {
  RSD = 'RSD',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF'
}

/**
 * Labele za valute sa opisima
 */
export const CurrencyLabels: Record<Currency, string> = {
  [Currency.RSD]: 'RSD - Srpski dinar',
  [Currency.EUR]: 'EUR - Evro',
  [Currency.USD]: 'USD - američki dolar',
  [Currency.GBP]: 'GBP - britanska funta',
  [Currency.CHF]: 'CHF - švajcarski franak'
};

/**
 * Enumeracija za status zaposlenja
 */
export enum EmploymentStatus {
  PERMANENT = 'PERMANENT',   // Stalno
  TEMPORARY = 'TEMPORARY',   // Privremeno
  UNEMPLOYED = 'UNEMPLOYED'  // Nezaposlen
}

/**
 * Labele za status zaposlenja
 */
export const EmploymentStatusLabels: Record<EmploymentStatus, string> = {
  [EmploymentStatus.PERMANENT]: 'Stalno',
  [EmploymentStatus.TEMPORARY]: 'Privremeno',
  [EmploymentStatus.UNEMPLOYED]: 'Nezaposlen'
};


export type InstallmentStatus = 'PAID' | 'UNPAID' | 'LATE';

export const InstallmentStatusLabels: Record<InstallmentStatus, string> = {
  'PAID': 'Plaćeno',
  'UNPAID': 'Neplaćeno',
  'LATE': 'Kasni'
};

export interface Installment {
  id?: number | string;
  expectedDueDate: string;
  actualPaymentDate?: string | null;
  amount: number;
  currency: string;
  interestRateAtPayment: number;
  status: InstallmentStatus;
}

export interface Loan {
  id: string | number;
  type: LoanTypeOption | string;
  number: string;
  amount: number;
  currency: string;
  status: LoanStatus | string;
  remainingDebt: number;
  contractDate: string;
  dueDate: string;
  repaymentPeriod?: number;
  nominalInterestRate?: number;
  effectiveInterestRate?: number;
  nextInstallmentAmount?: number;
  nextInstallmentDate?: string;
}


/**
 * DTO za slanje zahteva na backend
 */
export interface LoanRequestDto {
  loanType: string;
  interestRateType: string;
  amount: number;
  currency: string;
  repaymentPeriod: number;
  purpose: string;
  monthlyIncome: number;
  employmentStatus: string;
  employmentPeriod: number;
  accountNumber: string;
  contactPhone: string;
}

/**
 * Interfejs za odgovor nakon uspešnog podnošenja zahteva
 */
export interface LoanRequestResponse {
  id: string | number;
  requestNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
  createdAt: string;
}

