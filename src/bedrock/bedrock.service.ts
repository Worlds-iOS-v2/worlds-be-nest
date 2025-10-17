import { Injectable, Logger } from '@nestjs/common';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BedrockService {
    private client: BedrockRuntimeClient;
    private readonly logger = new Logger(BedrockService.name);

    constructor(private config: ConfigService) {
        this.client = new BedrockRuntimeClient({
            region: this.config.get('AWS_AI_REGION'),
            credentials: {
                accessKeyId: this.config.get('AWS_AI_ACCESS_KEY_ID')!,
                secretAccessKey: this.config.get('AWS_AI_SECRET_ACCESS_KEY')!,
            },
        });
    }

    async generateText(prompt: string): Promise<string> {
        const command = new InvokeModelCommand({
            modelId: this.config.get('BEDROCK_MODEL_ID'),
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                inferenceConfig: {
                    max_new_tokens: 4096,
                    temperature: 0.7,
                    top_p: 0.9
                }
            }),
        });

        const response = await this.client.send(command);
        const decoded = new TextDecoder().decode(response.body as Uint8Array);
        const parsed = JSON.parse(decoded);

        return parsed?.output?.message?.content?.[0]?.text || "";
    }
}
