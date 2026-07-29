// 백엔드 공통 에러 형식: { code, message, details }
// (syakBE/docs/00-overview.md 참조)
export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

// 소비자 앱 에러 코드 (분기는 message 가 아니라 code 로 한다)
export const ErrorCode = {
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_REFRESH_INVALID: 'AUTH_REFRESH_INVALID',
  AUTH_SOCIAL_FAILED: 'AUTH_SOCIAL_FAILED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SHOP_NOT_FOUND: 'SHOP_NOT_FOUND',
  SLOT_NOT_FOUND: 'SLOT_NOT_FOUND',
  FAVORITE_ALREADY_EXISTS: 'FAVORITE_ALREADY_EXISTS',
  FAVORITE_NOT_FOUND: 'FAVORITE_NOT_FOUND',
  NOTIFICATION_SETTINGS_NOT_FOUND: 'NOTIFICATION_SETTINGS_NOT_FOUND',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // 아래 2개는 백엔드가 주는 코드가 아니라 클라이언트가 생성한다.
  // 서버에 닿지도 못한 실패를 "알 수 없는 오류"로 뭉개지 않기 위한 구분 (QA 3차).
  NETWORK_ERROR: 'NETWORK_ERROR', // DNS·TLS·cleartext 차단·오프라인 등 fetch 자체 실패
  TIMEOUT: 'TIMEOUT', // 응답이 제한 시간 내 오지 않음
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
