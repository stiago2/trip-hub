import { HttpInterceptorFn } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';

const PRODUCTION_API = 'https://trip-hub-production.up.railway.app';

export const nativeApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (Capacitor.isNativePlatform() && req.url.startsWith('/api')) {
    const cloned = req.clone({ url: `${PRODUCTION_API}${req.url}` });
    return next(cloned);
  }
  return next(req);
};
