
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthResponse } from '@auth/interfaces/auth-response.interface';
import { UserRegister } from '@auth/interfaces/user-register.interface';
import { User } from '@auth/interfaces/user.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.baseUrl;


@Injectable({providedIn: 'root'})
export class AuthService {
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'));

  private http = inject(HttpClient);




  checkStatusResponse = rxResource({
    loader: () => this.checkStatus()
  });



  authStatus = computed<AuthStatus>(() => {
    if(this._authStatus() === 'checking') return 'checking';

    if(this._user()){
      return 'authenticated';
    }

    return 'not-authenticated';
  });


  user = computed<User | null>(() => this._user());

  token = computed(() => this._token);

  isAdmin = computed(() => this._user()?.roles.includes('admin') ?? false);







  login(email: string, password: string): Observable<boolean>{
    return this.http.post<AuthResponse>(`${ baseUrl }/auth/login`, {
      email: email,
      password: password,
    })
    .pipe(
      tap((resp) => this.handleAuthSuccess(resp)),
      map(() => true),

      catchError((error: any) => this.handleAuthError(error)),
    );
  }



  register(email: string, password: string, fullname: string): Observable<boolean>{
    return this.http.post<AuthResponse>(`${ baseUrl }/auth/register`, {
      email: email,
      password: password,
      fullName: fullname,
    })
    .pipe(
      tap((resp) => this.handleAuthSuccess(resp)),
      map(() => true),

      catchError((error: any) => this.handleAuthError(error)),
    );
  }



  checkStatus(): Observable<boolean>{
    const token = localStorage.getItem('token');

    if(!token){
      this.logout();
      return of(false);
    }

    return this.http.get<AuthResponse>(`${ baseUrl }/auth/check-status`, {
        headers: {
          Authorization: `Bearer ${ token }`,
        },

    })
    .pipe(
      tap((resp) => this.handleAuthSuccess(resp)),
      map(() => true),

      catchError((error: any) => this.handleAuthError(error)),
    );
  }



  logout(){
    this._user.set(null);
    this._token.set(null);
    this._authStatus.set('not-authenticated');

    localStorage.removeItem('token');
  }



  private handleAuthSuccess( resp: AuthResponse ){
    this._user.set(resp.user);
    this._authStatus.set('authenticated');
    this._token.set(resp.token);

    localStorage.setItem('token', resp.token);
  }



  private handleAuthError( error: any ){
    this.logout();
    return of(false);
  }


}
