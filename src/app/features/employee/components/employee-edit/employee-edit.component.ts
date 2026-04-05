import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-employee-edit-modal',
  templateUrl: './employee-edit.component.html',
  styleUrls: ['./employee-edit.component.css']
})
export class EmployeeEditComponent implements OnChanges {
  @Input() employee!: Employee;
  @Output() save = new EventEmitter<Employee>();
  @Output() cancel = new EventEmitter<void>();

  editForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.editForm = this.fb.group({
      ime: ['', [Validators.required, Validators.minLength(2)]],
      prezime: ['', [Validators.required, Validators.minLength(2)]],
      brojTelefona: ['', Validators.required],
      adresa: [''],
      pozicija: [''],
      departman: [''],
      role: ['BASIC'],
      aktivan: [true]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.editForm.patchValue({
        ime: this.employee.ime || '',
        prezime: this.employee.prezime || '',
        brojTelefona: this.employee.brojTelefona || '',
        adresa: this.employee.adresa || '',
        pozicija: this.employee.pozicija || '',
        departman: this.employee.departman || '',
        role: this.employee.role || 'BASIC',
        aktivan: this.employee.aktivan !== false
      });
    }
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const updatedEmployee: Employee = {
      ...this.editForm.value,
      id: this.employee.id
    };

    this.save.emit(updatedEmployee);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('z-overlay') || (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancel.emit();
    }
  }
}
