import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslateService {
    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) {}

    async translate(text: string, source: string, target: string): Promise<string> {
    const apiKey = this.config.get<string>('GOOGLE_TRANSLATE_API_KEY');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const body: any = { q: text, target, format: 'text' };
    if (source && source !== 'auto') {
        body.source = source;
    }

    const { data } = await this.http.axiosRef.post(url, body);
    return data.data.translations[0].translatedText;
  }


}