export const COOKIE_NAME = "app_session_id";
/** Cookie httpOnly : session compte email + mot de passe (même `userId` que le guest après inscription). */
export const COOKIE_NAME_LOCAL = "mixy_local_session";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
