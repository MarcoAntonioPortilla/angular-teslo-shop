import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { MessageComponent } from "@shared/components/message/message.component";

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, ReactiveFormsModule, MessageComponent],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  hasError = signal(false);
  hasSuccess = signal(false);



  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    fullName: ['', [Validators.required]],
  });


  onRegister(){
    if(this.registerForm.invalid){
      this.hasError.set(true);

      setTimeout(() => {
        this.hasError.set(false);
      },2000);

      return;
    }

    const {email = '', password = '', fullName = ''} = this.registerForm.value;

    this.authService.register(email!, password!, fullName!).subscribe((isRegister)=> {
      if(isRegister){
        this.hasSuccess.set(true);

        setTimeout(() => {
          this.hasSuccess.set(false);
        },8000);


        this.router.navigateByUrl('/auth/login');
        return;
      }

      this.hasError.set(true);

      setTimeout(() => {
        this.hasError.set(false);
      }, 8000);
    });
  }





}
