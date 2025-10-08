import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateUserDto, UserDto } from '@challenge/data';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiUrl = 'http://localhost:3000/api/v1/auth';

  constructor(private http: HttpClient) {}

  register(userData: CreateUserDto): Observable<{ access_token: string; user: UserDto }> {
    return this.http.post<{ access_token: string; user: UserDto }>(
      `${this.apiUrl}/register`,
      userData
    );
  }
}
