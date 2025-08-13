import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                // 이미 표준 형식인 경우 그대로 반환
                if (data && typeof data === 'object' && 'statusCode' in data) {
                    return data;
                }

                // 일반 응답을 표준 형식으로 변환
                return {
                    message: '요청이 성공적으로 처리되었습니다.',
                    statusCode: 200,
                    data: data,
                };
            })
        );
    }
}