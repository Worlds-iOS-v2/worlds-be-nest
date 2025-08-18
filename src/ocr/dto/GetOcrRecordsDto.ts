import { ApiProperty } from "@nestjs/swagger";

export class OcrRecordDto {
    @ApiProperty({
        example: [
            "4. (가) 왕이 실시한 정책으로 옳은 것은? [3점]",
            "0 신라왕 김 부가 귀순해 오자, (가) 우는 그를 경주의",
            "사심관으로 삼아 부호장 이하 항리들에 대한 사무를 관장",
            "하게 하였다, 여러 공신들 역시 자기 출신 고을의 사심관이",
            "되니, 사심관 제도는 이때부터 시작되었다.",
            "0 (가) 이가 거처로 신하를 불러 친히 훈요 10조를 내렸다",
            "각 조는 모두 '마음속에 이를 간직하라.'로 끝났다, 후대의",
            "왕들은 이 10조를 계속 전하면서 지키고자 하였다,",
            "6조 직계제를 채택하였다.",
            "2 기인 제도를 운영하였다,",
            "㉦ 과거제를 폐지하였다",
            "㉦ 별무반을 조직하였다-",
            "丘 정방을 설치하였다-"
        ],
        description: "OCR 인식 결과"
    })
    originalText: string[]

    @ApiProperty({
        example: [
            "4. (a) What is the right policy implemented by the king? [3 points]",
            "0 When King Kim Bu of Silla came to submit to him, he cried and asked him to go to Gyeongju.",
            "He is appointed as a private judge and is in charge of affairs for the hang-ri below the head of the body.",
            "Many public officials also had their own self-judges.",
            "Therefore, the system of private judges began at this time.",
            "0 (a) Yi summoned his subjects to his residence and personally issued 10 trillions of instructions.",
            "Each group ended with 'Keep it in your heart.', Later",
            "The kings wanted to keep these 10 articles by continuing to preach them.",
            "The 6 trillion direct succession system was adopted.",
            "2 The system of flagship was operated,",
            "The past tense was abolished",
            "organized a separate group-",
            "The hill was set up-"
        ],
        description: "OCR 텍스트 번역 결과"
    })
    translatedText: string[]

    @ApiProperty({
        example: "Goryeo",
        description: "문제 핵심 개념"
    })
    keyConcept: string

    @ApiProperty({
        example: "The question describes a king who set up local supervisors (sasim-gwan) and issued 10 teaching rules ending with “keep it in your heart.” This king is Gwangjong of Goryeo. Among the options, the correct policy he carried out was operating the hostage system (기인 제도).",
        description: "문제 해설"
    })
    solution: string

    @ApiProperty({
        example: "Identify King (가) as Gwangjong by his reforms, then pick the policy he implemented.",
        description: "문제 요약"
    })
    summary: string
}

export class GetOcrRecordsDto {
    @ApiProperty({ example: 'OCR 기록 조회 성공' })
    message: string

    @ApiProperty({ example: 200 })
    statusCode: number

    @ApiProperty({
        type: [OcrRecordDto],
        description: 'OCR 및 문제 분석 내용 조회'
    })
    records: OcrRecordDto[]
}