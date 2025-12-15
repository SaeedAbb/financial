export interface Saving {
  id: number;
  uuid: string;
  amount: number;
  savingType: SavingType;
  savingDate: string; // ISO date string (yyyy-MM-dd)
  comments?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface CreateSavingRequest {
  amount: number;
  savingType: SavingType;
  savingDate: string; // ISO date string (yyyy-MM-dd)
  comments?: string;
}

export interface UpdateSavingRequest {
  amount: number;
  savingType: SavingType;
  savingDate: string; // ISO date string (yyyy-MM-dd)
  comments?: string;
}

export interface SavingsSummary {
  totalAmount: number;
  totalCount: number;
  cashAmount: number;
  goldAmount: number;
  otherAmount: number;
}

export interface PagedSavings {
  content: Saving[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}

export enum SavingType {
  CASH = 'CASH',
  GOLD = 'GOLD',
  OTHER = 'OTHER'
}

export interface SavingTypeOption {
  label: string;
  value: SavingType;
  icon: string;
}

export const SAVING_TYPE_OPTIONS: SavingTypeOption[] = [
  {
    label: 'Cash',
    value: SavingType.CASH,
    icon: 'pi pi-dollar'
  },
  {
    label: 'Gold',
    value: SavingType.GOLD,
    icon: 'pi pi-star'
  },
  {
    label: 'Other',
    value: SavingType.OTHER,
    icon: 'pi pi-box'
  }
];

export function getSavingTypeLabel(type: SavingType): string {
  const option = SAVING_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label || type;
}

export function getSavingTypeIcon(type: SavingType): string {
  const option = SAVING_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.icon || 'pi pi-circle';
}