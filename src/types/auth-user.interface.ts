export interface AuthUser {
    id: number;
    userEmail: string;
    refreshToken: string;
    userName: string;
    isBlocked: boolean;
}

export interface AuthRequest extends Request {
    user: AuthUser;
}