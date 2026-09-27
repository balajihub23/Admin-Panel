import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminVehicle {
  id: number;
  regNumber: string;
  vehicleName: string;
  category: string;
  machineryModel: string;
  machinerySubCategory: string;
  experience: string;
  driverName?: string;
  driverPhone?: string;
  driverId?: number;
  mfgYear: string;
  machineClass: string;
  chassisVin: string;
  engineSerial: string;
  powertrain?: string;
  status: string;
  isActive: boolean;
  rejectionReason?: string;
  fetchMode?: 'AUTO_VAHAN' | 'MANUAL';
  isVahanSynced?: boolean;
  submittedOn?: string;
  vehicleDescription?: string;
  documents?: {
    rcFront?: { name?: string; url?: string; status?: string };
    rcBack?: { name?: string; url?: string; status?: string };
    insurance?: { name?: string; url?: string; policyNumber?: string; provider?: string; status?: string };
    agreement?: { name?: string; url?: string; agreementType?: string; status?: string };
    photos?: { front?: string; side?: string; rear?: string; cabin?: string; engineSerialPlate?: string };
  };
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  private vehiclesSubject = new BehaviorSubject<AdminVehicle[]>([]);

  getVehicles(): Observable<AdminVehicle[]> {
    this.http.get<any>(`${this.baseUrl}/api/v1/vehicles`).subscribe({
      next: (res) => {
        if (res && res.success && Array.isArray(res.data)) {
          const isValidUrl = (u: any) => u && typeof u === 'string' && u.trim().length > 0 && !u.includes('unsplash.com');

          const mapped: AdminVehicle[] = res.data.map((item: any) => ({
            id: item.id,
            regNumber: item.regNumber,
            vehicleName: item.vehicleName,
            category: item.category || 'Machinery',
            machineryModel: item.machineryModel || item.vehicleName,
            machinerySubCategory: item.machinerySubCategory || 'Backhoe',
            experience: item.experience || '1-3 years',
            driverName: item.driverName || 'Driver Partner',
            driverPhone: item.driverPhone || '7074953565',
            driverId: item.driverId || item.userId || 1,
            mfgYear: item.mfgYear || '2023',
            machineClass: item.machineClass || 'Earth Moving (Loader)',
            chassisVin: item.chassisVin || 'VIN9918204',
            engineSerial: item.engineSerial || 'ENG-C4-8821',
            powertrain: item.powertrain || 'DIESEL',
            status: item.status || 'UNDER_REVIEW',
            isActive: item.isActive ?? false,
            rejectionReason: item.rejectionReason,
            fetchMode: item.fetchMode || 'AUTO_VAHAN',
            isVahanSynced: item.isVahanSynced ?? true,
            submittedOn: item.submittedOn || 'Recent',
            vehicleDescription: item.vehicleDescription || '',
            documents: {
              rcFront: { name: 'RC_Front.png', url: isValidUrl(item.rcFrontUrl) ? item.rcFrontUrl : '', status: isValidUrl(item.rcFrontUrl) ? 'VERIFIED' : 'NOT_UPLOADED' },
              rcBack: { name: 'RC_Back.png', url: isValidUrl(item.rcBackUrl) ? item.rcBackUrl : '', status: isValidUrl(item.rcBackUrl) ? 'VERIFIED' : 'NOT_UPLOADED' },
              insurance: { name: 'Insurance_Policy.pdf', url: isValidUrl(item.insuranceUrl) ? item.insuranceUrl : '', status: isValidUrl(item.insuranceUrl) ? 'VERIFIED' : 'NOT_UPLOADED' },
              photos: {
                front: isValidUrl(item.frontPhotoUrl) ? item.frontPhotoUrl : '',
                side: isValidUrl(item.sidePhotoUrl) ? item.sidePhotoUrl : '',
                rear: isValidUrl(item.rearPhotoUrl) ? item.rearPhotoUrl : '',
                cabin: isValidUrl(item.cabinPhotoUrl) ? item.cabinPhotoUrl : '',
                engineSerialPlate: isValidUrl(item.enginePlatePhotoUrl) ? item.enginePlatePhotoUrl : ''
              }
            }
          }));
          this.vehiclesSubject.next(mapped);
          this.saveLocal(mapped);
        }
      },
      error: (err) => console.warn('Backend GET vehicles error:', err)
    });

    return this.vehiclesSubject.asObservable();
  }

  approveVehicle(vehicleId: number): Observable<boolean> {
    this.http.put<any>(`${this.baseUrl}/api/v1/vehicles/${vehicleId}/approve`, {}).subscribe({
      next: () => console.log(`Vehicle ${vehicleId} approved on DB backend`),
      error: (err) => console.warn('Backend approve fallback:', err)
    });

    const current = [...this.vehiclesSubject.value];
    const item = current.find(v => v.id === vehicleId);
    if (item) {
      item.status = 'APPROVED';
      item.isActive = true;
      item.rejectionReason = undefined;
      this.vehiclesSubject.next(current);
      this.saveLocal(current);

      this.sendNotificationToUser(
        'Vehicle Verification Approved!',
        `Your vehicle registration (${item.regNumber} - ${item.machineryModel || item.vehicleName}) has been approved by Admin!`,
        'VEHICLE',
        item.driverId
      );
    }
    return of(true);
  }

  rejectVehicle(vehicleId: number, reason: string = 'Verification documents or chassis details incomplete.'): Observable<boolean> {
    this.http.put<any>(`${this.baseUrl}/api/v1/vehicles/${vehicleId}/reject`, { reason }).subscribe({
      next: () => console.log(`Vehicle ${vehicleId} rejected on DB backend`),
      error: (err) => console.warn('Backend reject fallback:', err)
    });

    const current = [...this.vehiclesSubject.value];
    const item = current.find(v => v.id === vehicleId);
    if (item) {
      item.status = 'REJECTED';
      item.isActive = false;
      item.rejectionReason = reason || 'Verification documents or chassis details incomplete.';
      this.vehiclesSubject.next(current);
      this.saveLocal(current);

      this.sendNotificationToUser(
        'Vehicle Verification Rejected',
        `Your vehicle registration (${item.regNumber}) was rejected. Reason: ${item.rejectionReason}`,
        'VEHICLE',
        item.driverId
      );
    }
    return of(true);
  }

  private sendNotificationToUser(title: string, message: string, type: string, targetUserId?: number): void {
    const payload = {
      title,
      message,
      notificationType: type,
      targetType: targetUserId ? 'INDIVIDUAL_USER' : 'ALL_DRIVERS',
      targetUserId: targetUserId || 1,
      deepLink: '/profile'
    };

    this.http.post(`${this.baseUrl}/api/v1/notifications/admin/send`, payload).subscribe({
      next: () => console.log('Driver notification dispatched successfully'),
      error: (err) => console.warn('Notification send fallback:', err)
    });
  }

  addVehicle(vehicle: AdminVehicle): void {
    const current = [vehicle, ...this.vehiclesSubject.value];
    this.vehiclesSubject.next(current);
    this.saveLocal(current);
  }

  private saveLocal(list: AdminVehicle[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rentron_shared_vehicles', JSON.stringify(list));
      localStorage.setItem('admin_vehicles_list', JSON.stringify(list));
    }
  }
}
