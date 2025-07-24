export interface AuthUser {
    id: number;
    userEmail: string;
    refreshToken: string;
    userName: string;
}

export interface AuthRequest extends Request {
    user: AuthUser;
}