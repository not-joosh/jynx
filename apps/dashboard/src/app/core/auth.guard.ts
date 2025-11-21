import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const TOKEN_KEY = 'sb_jwt';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const hasToken = !!localStorage.getItem(TOKEN_KEY);
  if (!hasToken) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};
