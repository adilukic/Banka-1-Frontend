import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserService } from '../../user.service';

export type User = {
  ime: string;
  prezime: string;
  datumRodjenja: number;
  pol: string;
  email: string;
  brojTelefona: string;
  adresa: string;
  jmbg: string;
}

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
})
export class UserCreateComponent {
  public firstName = '';
  public lastName = '';
  public dateOfBirth = '';
  public gender = '';
  public email = '';
  public phone = '';
  public address = '';
  public jmbg = '';
  public submitting = false;

  constructor(private router: Router, private route: ActivatedRoute, private userService: UserService) {}

  public submit(form: NgForm): void {
    this.submitting = true;

    // If form is invalid, do not proceed and show validation messages
    if (form.invalid) {
      form.form.markAllAsTouched();
      this.submitting = false;
      return;
    }
    const user: User = {
      ime: this.firstName,
      prezime: this.lastName,
      datumRodjenja: new Date(this.dateOfBirth).getTime(),
      pol: this.gender,
      email: this.email,
      brojTelefona: this.phone,
      adresa: this.address,
      jmbg: this.jmbg
    };

    this.userService.createUser(user).subscribe({
      next: (createdUser) => {
        // Simulate creation and generate an id. In real app, call UserService.create(...) and use returned id.
        const createdId = 'c' + String(Math.floor(Math.random() * 1000000));
        const createdName = `${this.firstName} ${this.lastName}`.trim();
        
          // Read returnUrl from query params (if provided)
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/clients';
          
          // Navigate back to returnUrl with navigation state containing createdClientId and name
        this.router.navigateByUrl(returnUrl, { state: { createdClientId: createdId, createdClientName: createdName } });
        return;
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.submitting = false;
      }
    });

  }
}
