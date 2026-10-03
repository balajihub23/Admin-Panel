import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleMasterService, VehicleType, VehicleModel, VehicleSubModel } from '../../../shared/services/vehicle-master.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-vehicle-master-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-master-list.component.html',
  styleUrls: ['./vehicle-master-list.component.scss']
})
export class VehicleMasterListComponent implements OnInit {
  private masterService = inject(VehicleMasterService);
  private toastService = inject(ToastService);

  activeTab: 'TYPES' | 'MODELS' | 'SUB_MODELS' = 'TYPES';
  isLoading: boolean = false;

  // Master Lists
  vehicleTypes: VehicleType[] = [];
  vehicleModels: VehicleModel[] = [];
  vehicleSubModels: VehicleSubModel[] = [];

  // Dropdown helper lists for forms
  filteredModelsForSubModelForm: VehicleModel[] = [];

  // Modal State
  showModal: boolean = false;
  modalType: 'TYPE' | 'MODEL' | 'SUB_MODEL' = 'TYPE';
  isEditMode: boolean = false;
  isSaving: boolean = false;

  // Form Models
  typeForm: VehicleType = { name: '', code: '', description: '', iconUrl: '', displayOrder: 0, active: true };
  modelForm: VehicleModel = { vehicleTypeId: 0, name: '', code: '', description: '', iconUrl: '', displayOrder: 0, active: true };
  subModelForm: VehicleSubModel = {
    vehicleModelId: 0,
    vehicleTypeId: 0,
    name: '',
    code: '',
    description: '',
    manufacturer: '',
    machineClass: '',
    horsePower: '',
    capacity: '',
    fuelType: '',
    iconUrl: '',
    displayOrder: 0,
    active: true
  };

  ngOnInit(): void {
    this.loadAllMasters();
  }

  loadAllMasters(): void {
    this.isLoading = true;
    this.masterService.getVehicleTypes().subscribe({
      next: (res) => {
        this.vehicleTypes = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load vehicle types', err);
      }
    });

    this.masterService.getModels().subscribe({
      next: (res) => {
        this.vehicleModels = res.data || [];
      },
      error: (err) => console.error('Failed to load vehicle models', err)
    });

    this.masterService.getSubModels().subscribe({
      next: (res) => {
        this.vehicleSubModels = res.data || [];
      },
      error: (err) => console.error('Failed to load vehicle sub-models', err)
    });
  }

  setTab(tab: 'TYPES' | 'MODELS' | 'SUB_MODELS'): void {
    this.activeTab = tab;
  }

  // --- TYPE MODAL & ACTIONS ---

  openAddTypeModal(): void {
    this.isEditMode = false;
    this.isSaving = false;
    this.modalType = 'TYPE';
    this.typeForm = { name: '', code: '', description: '', iconUrl: '', displayOrder: this.vehicleTypes.length + 1, active: true };
    this.showModal = true;
  }

  openEditTypeModal(type: VehicleType): void {
    this.isEditMode = true;
    this.isSaving = false;
    this.modalType = 'TYPE';
    this.typeForm = { ...type };
    this.showModal = true;
  }

  saveType(): void {
    if (this.isSaving) return;
    if (!this.typeForm.name || !this.typeForm.name.trim()) {
      this.toastService.showError('Name is required');
      return;
    }
    if (!this.typeForm.code || !this.typeForm.code.trim()) {
      this.toastService.showError('Code is required');
      return;
    }

    this.isSaving = true;
    if (this.isEditMode && this.typeForm.id) {
      this.masterService.updateVehicleType(this.typeForm.id, this.typeForm).subscribe({
        next: () => {
          this.isSaving = false;
          this.toastService.showSuccess('Vehicle type updated successfully!');
          this.closeModal();
          this.loadAllMasters();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastService.showError(err.error?.message || 'Failed to update vehicle type');
        }
      });
    } else {
      this.masterService.createVehicleType(this.typeForm).subscribe({
        next: () => {
          this.isSaving = false;
          this.toastService.showSuccess('Vehicle type created successfully!');
          this.closeModal();
          this.loadAllMasters();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastService.showError(err.error?.message || 'Failed to create vehicle type');
        }
      });
    }
  }

  toggleTypeStatus(type: VehicleType): void {
    const newStatus = !type.active;
    this.masterService.changeVehicleTypeStatus(type.id!, newStatus).subscribe({
      next: () => {
        type.active = newStatus;
        this.toastService.showSuccess(`Vehicle type ${type.name} ${newStatus ? 'activated' : 'deactivated'}`);
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Failed to update status')
    });
  }

  deleteType(type: VehicleType): void {
    if (confirm(`Deactivate vehicle type '${type.name}'? Existing registrations will remain intact.`)) {
      this.masterService.deleteVehicleType(type.id!).subscribe({
        next: () => {
          this.toastService.showSuccess(`Vehicle type ${type.name} deactivated.`);
          this.loadAllMasters();
        },
        error: (err) => this.toastService.showError(err.error?.message || 'Failed to delete')
      });
    }
  }

  // --- MODEL MODAL & ACTIONS ---

  openAddModelModal(): void {
    this.isEditMode = false;
    this.isSaving = false;
    this.modalType = 'MODEL';
    const defaultTypeId = this.vehicleTypes.length > 0 ? this.vehicleTypes[0].id! : 0;
    this.modelForm = { vehicleTypeId: defaultTypeId, name: '', code: '', description: '', iconUrl: '', displayOrder: this.vehicleModels.length + 1, active: true };
    this.showModal = true;
  }

  openEditModelModal(model: VehicleModel): void {
    this.isEditMode = true;
    this.isSaving = false;
    this.modalType = 'MODEL';
    this.modelForm = { ...model };
    this.showModal = true;
  }

  saveModel(): void {
    if (this.isSaving) return;
    if (!this.modelForm.vehicleTypeId) {
      this.toastService.showError('Vehicle Type selection is required');
      return;
    }
    if (!this.modelForm.name || !this.modelForm.name.trim()) {
      this.toastService.showError('Model Name is required');
      return;
    }

    this.isSaving = true;
    if (this.isEditMode && this.modelForm.id) {
      this.masterService.updateModel(this.modelForm.id, this.modelForm).subscribe({
        next: () => {
          this.isSaving = false;
          this.toastService.showSuccess('Vehicle model updated successfully!');
          this.closeModal();
          this.loadAllMasters();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastService.showError(err.error?.message || 'Failed to update vehicle model');
        }
      });
    } else {
      this.masterService.createModel(this.modelForm).subscribe({
        next: () => {
          this.isSaving = false;
          this.toastService.showSuccess('Vehicle model created successfully!');
          this.closeModal();
          this.loadAllMasters();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastService.showError(err.error?.message || 'Failed to create vehicle model');
        }
      });
    }
  }

  toggleModelStatus(model: VehicleModel): void {
    const newStatus = !model.active;
    this.masterService.changeModelStatus(model.id!, newStatus).subscribe({
      next: () => {
        model.active = newStatus;
        this.toastService.showSuccess(`Vehicle model ${model.name} ${newStatus ? 'activated' : 'deactivated'}`);
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Failed to update status')
    });
  }

  deleteModel(model: VehicleModel): void {
    if (confirm(`Deactivate vehicle model '${model.name}'? Existing registrations will remain intact.`)) {
      this.masterService.deleteModel(model.id!).subscribe({
        next: () => {
          this.toastService.showSuccess(`Vehicle model ${model.name} deactivated.`);
          this.loadAllMasters();
        },
        error: (err) => this.toastService.showError(err.error?.message || 'Failed to delete')
      });
    }
  }

  // --- SUB MODEL MODAL & ACTIONS ---

  openAddSubModelModal(): void {
    this.isEditMode = false;
    this.isSaving = false;
    this.modalType = 'SUB_MODEL';
    const defaultTypeId = this.vehicleTypes.length > 0 ? this.vehicleTypes[0].id! : 0;
    this.onSubModelTypeChange(defaultTypeId);
    const defaultModelId = this.filteredModelsForSubModelForm.length > 0 ? this.filteredModelsForSubModelForm[0].id! : 0;

    this.subModelForm = {
      vehicleTypeId: defaultTypeId,
      vehicleModelId: defaultModelId,
      name: '',
      code: '',
      description: '',
      manufacturer: '',
      machineClass: '',
      horsePower: '',
      capacity: '',
      fuelType: 'DIESEL',
      iconUrl: '',
      displayOrder: this.vehicleSubModels.length + 1,
      active: true
    };
    this.showModal = true;
  }

  openEditSubModelModal(subModel: VehicleSubModel): void {
    this.isEditMode = true;
    this.isSaving = false;
    this.modalType = 'SUB_MODEL';

    // Resolve parent typeId
    const parentModel = this.vehicleModels.find(m => m.id === subModel.vehicleModelId);
    const typeId = parentModel ? parentModel.vehicleTypeId : (subModel.vehicleTypeId || 0);

    this.onSubModelTypeChange(typeId);

    this.subModelForm = {
      ...subModel,
      vehicleTypeId: typeId,
      vehicleModelId: subModel.vehicleModelId
    };
    this.showModal = true;
  }

  onSubModelTypeChange(typeId: number): void {
    this.subModelForm.vehicleTypeId = typeId;
    this.filteredModelsForSubModelForm = this.vehicleModels.filter(m => m.vehicleTypeId == typeId);
    if (this.filteredModelsForSubModelForm.length > 0) {
      if (!this.filteredModelsForSubModelForm.some(m => m.id === this.subModelForm.vehicleModelId)) {
        this.subModelForm.vehicleModelId = this.filteredModelsForSubModelForm[0].id!;
      }
    } else {
      this.subModelForm.vehicleModelId = 0;
    }
  }

  saveSubModel(): void {
    if (this.isSaving) return;
    if (!this.subModelForm.vehicleModelId) {
      this.toastService.showError('Vehicle Model selection is required');
      return;
    }
    if (!this.subModelForm.name || !this.subModelForm.name.trim()) {
      this.toastService.showError('Sub Model Name is required');
      return;
    }

    this.isSaving = true;
    if (this.isEditMode && this.subModelForm.id) {
      this.masterService.updateSubModel(this.subModelForm.id, this.subModelForm).subscribe({
        next: () => {
          this.isSaving = false;
          this.toastService.showSuccess('Vehicle sub model updated successfully!');
          this.closeModal();
          this.loadAllMasters();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastService.showError(err.error?.message || 'Failed to update vehicle sub model');
        }
      });
    } else {
      this.masterService.createSubModel(this.subModelForm).subscribe({
        next: () => {
          this.isSaving = false;
          this.toastService.showSuccess('Vehicle sub model created successfully!');
          this.closeModal();
          this.loadAllMasters();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastService.showError(err.error?.message || 'Failed to create vehicle sub model');
        }
      });
    }
  }

  toggleSubModelStatus(subModel: VehicleSubModel): void {
    const newStatus = !subModel.active;
    this.masterService.changeSubModelStatus(subModel.id!, newStatus).subscribe({
      next: () => {
        subModel.active = newStatus;
        this.toastService.showSuccess(`Vehicle sub model ${subModel.name} ${newStatus ? 'activated' : 'deactivated'}`);
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Failed to update status')
    });
  }

  deleteSubModel(subModel: VehicleSubModel): void {
    if (confirm(`Deactivate vehicle sub model '${subModel.name}'? Existing registrations will remain intact.`)) {
      this.masterService.deleteSubModel(subModel.id!).subscribe({
        next: () => {
          this.toastService.showSuccess(`Vehicle sub model ${subModel.name} deactivated.`);
          this.loadAllMasters();
        },
        error: (err) => this.toastService.showError(err.error?.message || 'Failed to delete')
      });
    }
  }

  // --- IMAGE FILE SELECTION HANDLERS ---
  onIconFileSelected(event: Event, targetType: 'TYPE' | 'MODEL' | 'SUB_MODEL'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const dataUrl = e.target.result;
      if (targetType === 'TYPE') {
        this.typeForm.iconUrl = dataUrl;
      } else if (targetType === 'MODEL') {
        this.modelForm.iconUrl = dataUrl;
      } else if (targetType === 'SUB_MODEL') {
        this.subModelForm.iconUrl = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  }

  getFileName(iconUrl?: string): string {
    if (!iconUrl) return '';
    if (iconUrl.startsWith('data:image')) {
      const mime = iconUrl.substring(5, iconUrl.indexOf(';'));
      const ext = mime.split('/')[1] || 'png';
      return `Uploaded Image (.${ext})`;
    }
    const parts = iconUrl.split('/');
    return parts[parts.length - 1] || 'Uploaded Image';
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.style.display = 'none';
  }

  removeTypeIcon(): void {
    this.typeForm.iconUrl = '';
  }

  removeModelIcon(): void {
    this.modelForm.iconUrl = '';
  }

  removeSubModelIcon(): void {
    this.subModelForm.iconUrl = '';
  }

  closeModal(): void {
    this.isSaving = false;
    this.showModal = false;
  }
}
