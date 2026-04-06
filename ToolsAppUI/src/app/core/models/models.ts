export type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER';
export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'IN_MAINTENANCE' | 'RETIRED';
export type LocationType = 'WAREHOUSE' | 'JOB_SITE' | 'OFFICE';
export type TransferStatus = 'ACTIVE' | 'RETURNED';
export type MaintenanceStatus = 'PENDING' | 'COMPLETED';
export type MaintenanceType = 'SCHEDULED' | 'REPAIR' | 'CALIBRATION';
export type AlertType = 'MAINTENANCE_DUE' | 'OVERDUE_RETURN' | 'GENERAL';
export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PRO';

export interface AuthResponse {
  token: string;
  userId: number;
  tenantId: number;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  companyName: string;
  email: string;
  password: string;
  fullName: string;
}

export interface Asset {
  id: number;
  tenantId: number;
  name: string;
  serialNumber?: string;
  category?: string;
  status: AssetStatus;
  qrCode: string;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
  imageUrl?: string;
  warrantyMonths?: number;
  warrantyExpiresAt?: string;
  metrologyDate?: string;
  metrologyExpiryDate?: string;
  currentLocationId?: number;
  currentLocationName?: string;
  createdAt: string;
}

export interface AssetRequest {
  name: string;
  serialNumber?: string;
  category?: string;
  status?: AssetStatus;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
  imageUrl?: string;
  warrantyMonths?: number;
  metrologyDate?: string;
  metrologyExpiryDate?: string;
  locationId?: number;
}

export interface Location {
  id: number;
  tenantId: number;
  name: string;
  address?: string;
  type: LocationType;
  active: boolean;
}

export interface LocationRequest {
  name: string;
  address?: string;
  type: LocationType;
}

export interface Transfer {
  id: number;
  tenantId: number;
  assetId: number;
  assetName?: string;
  assetSerialNumber?: string;
  fromLocationId?: number;
  fromLocationName?: string;
  toLocationId?: number;
  toLocationName?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  transferDate: string;
  returnDate?: string;
  indefinitePeriod?: boolean;
  notes?: string;
  status: TransferStatus;
}

export interface TransferRequest {
  assetId: number;
  fromLocationId?: number;
  toLocationId?: number;
  assignedToUserId?: number;
  returnDate?: string;
  indefinitePeriod?: boolean;
  notes?: string;
}

export interface CategoryStats {
  category: string;
  total: number;
  available: number;
  inUse: number;
  inMaintenance: number;
  retired: number;
}

export interface MaintenanceRecord {
  id: number;
  tenantId: number;
  assetId: number;
  assetName?: string;
  type: MaintenanceType;
  scheduledDate?: string;
  completedDate?: string;
  cost?: number;
  technicianName?: string;
  notes?: string;
  status: MaintenanceStatus;
}

export interface MaintenanceRequest {
  assetId: number;
  type: MaintenanceType;
  scheduledDate?: string;
  cost?: number;
  technicianName?: string;
  notes?: string;
}

export interface Alert {
  id: number;
  tenantId: number;
  assetId?: number;
  assetName?: string;
  type?: AlertType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppUser {
  id: number;
  tenantId: number;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  qrCode?: string;
  createdAt: string;
}

export interface UserRequest {
  email: string;
  password?: string;
  fullName: string;
  role: UserRole;
}

export interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  inUseAssets: number;
  inMaintenanceAssets: number;
  retiredAssets: number;
  overdueTransfers: number;
  pendingMaintenance: number;
  unreadAlerts: number;
}
