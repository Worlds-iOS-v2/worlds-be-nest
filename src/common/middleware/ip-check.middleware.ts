import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class IpCheckMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const clientIp = req.ip || req.connection.remoteAddress;
        
        if (!clientIp) {
            return res.status(403).json({
                message: ['허용되지 않은 IP에서의 접근입니다. 관리자에게 문의해주세요.'],
                error: 'Forbidden',
                statusCode: 403,
                path: req.url,
            })
        }

        // 허용된 IP 목록
        const allowedIps = process.env.ALLOWD_IPS?.split(',') || [];

        if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
            return res.status(403).json({
                message: ['허용되지 않은 IP에서의 접근입니다. 관리자에게 문의해주세요.'],
                error: 'Forbidden',
                statusCode: 403,
                path: req.url,
            })
        }

        next();
    }
}