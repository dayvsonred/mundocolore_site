import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

export interface NewsletterSubscriptionResponse {
  message: string;
  email: string;
  created: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private readonly endpoint = `${environment.apiUrl}/newsletter`;

  constructor(private readonly http: HttpClient) {}

  subscribe(email: string): Observable<NewsletterSubscriptionResponse> {
    return this.http.post<NewsletterSubscriptionResponse>(this.endpoint, { email });
  }
}
