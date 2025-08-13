import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        let message: string | string[], error: string;
        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            message = (exceptionResponse as any).message || exception.message;
            error = (exceptionResponse as any).error || 'Error';
        } else {
            message = this.getMessage(status, exception.message);
            error = this.getErrorType(status);
        }

        response.status(status).json({
            message: message,
            error: error,
            statusCode: status,
            path: request.url,
        })
    }

    private getMessage(status: number, message: string) {
        switch (status) {
            case 400:
                return ['잘못된 요청입니다. 입력 정보를 확인해주세요.']
            case 401:
                return ['인증되지 않은 요청입니다. 로그인 후 다시 시도해주세요.']
            case 403:
                if (message.includes('IP') || message.includes('Forbidden')) {
                    return ['허용되지 않은 IP에서의 접근입니다. 관리자에게 문의해주세요.'];
                }
                return ['접근이 제한되었습니다. 관리자에게 문의해주세요.']
            case 404:
                return ['요청하진 페이지를 찾을 수 없습니다.']
            case 500:
                return ['서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.']
            default:
                return ['알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.']
        }
    }

    private getErrorType(status: number) {
        switch (status) {
            case 400:
                return 'BadRequest';
            case 401:
                return 'Unauthorized';
            case 403:
                return 'Forbidden';
            case 404:
                return 'NotFound';
            case 500:
                return 'InternalServerError';
            default:
                return 'UnknownError';
        }
    }
}