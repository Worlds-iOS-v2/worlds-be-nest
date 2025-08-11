import { Injectable } from '@nestjs/common';
import {
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CrawlingService {
    constructor(private readonly prismaService: PrismaService) { }
    private headers = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    async crawlerKoreanProgram(): Promise<any> {
        console.log('크롤링 시작');
        const koData: any[] = [];
        const URL = 'https://mcfamily.or.kr/programs/korean';

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
            ],
        });

        try {
            const page = await browser.newPage();

            await page.goto(URL, { waitUntil: 'networkidle0', timeout: 20000 });

            page.on('console', (msg) => console.log('Browser Console:', msg.text()));

            const linkElements = await page.$$('ul.grid.grid-cols-1 li a');
            console.log('찾은 링크 개수: ', linkElements.length);
            if (linkElements.length === 0) {
                throw new BadRequestException({
                    message: [
                        '링크를 가져오는 데 실패했습니다. 다시 시도해주세요.',
                    ],
                    error: 'CrawlingError: link elements not found',
                    statusCode: 400,
                });
            }

            const linkHrefs: string[] = [];
            for (const linkElement of linkElements) {
                const href = await linkElement.evaluate((el) => el.href);
                linkHrefs.push(href);
            }

            for (const href of linkHrefs) {
                await page.goto(href, { waitUntil: 'networkidle0' });

                const container = await page.waitForSelector(
                    '.container.pb-\\[80px\\]',
                    {
                        timeout: 1000,
                    },
                );

                if (container) {
                    await page.waitForFunction(() => {
                        const title = document.querySelector('.flex .mh5');
                        const image = document.querySelector('.ck-content img');
                        const bodyList = document.querySelectorAll('ul.body3 li .break-all');
                        return image && title && bodyList.length > 0;
                    }, { timeout: 10000 }).catch(() => {
                        throw new InternalServerErrorException({
                            message: ['컨텐츠 로딩에 실패했습니다. 네트워크를 확인해주세요.'],
                            error: 'CrawlingError: content loading failed',
                            statusCode: 500,
                        })
                    });

                    const titleText = await page.evaluate(() => {
                        const titleHtml = document.querySelector('.flex .mh5');
                        return titleHtml ? titleHtml.innerHTML : null;
                    })

                    const image = await page.evaluate(() => {
                        const imageHtml = document.querySelector('.ck-content img') as HTMLImageElement;
                        return imageHtml ? imageHtml.src : null;
                    })

                    const bodyList = await page.evaluate(() => {
                        const bodyListHtml = document.querySelectorAll('ul.body3 li .break-all');
                        return Array.from(bodyListHtml).map(body => body.textContent);
                    })

                    if (!titleText || !image || !bodyList) {
                        throw new InternalServerErrorException({
                            message: ['컨텐츠 로딩에 실패했습니다. 네트워크를 확인해주세요.'],
                            error: 'CrawlingError: content loading failed',
                            statusCode: 500,
                        })
                    }

                    const title = titleText.split(']')[1].trim().replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
                    let borough = titleText.split(']')[0].split('[')[1].trim()
                    if (borough.includes('가족센터')) {
                        borough = borough.split('가족센터')[0]
                    }

                    const applicationPeriod = bodyList[0]?.trim()
                    const programPeriod = bodyList[1]?.trim()
                    let location = bodyList[8]?.trim()

                    if (location === ' ' || !location) {
                        location = borough + '가족센터'
                    }

                    const data = {
                        borough: borough,
                        title: title,
                        image: image,
                        applicationPeriod: applicationPeriod,
                        programPeriod: programPeriod,
                        location: location,
                        url: href,
                    }

                    koData.push(data);
                }
            }
            return koData;
        } catch (error) {
            console.error('크롤링 에러 상세: ', error)
            throw new InternalServerErrorException({
                message: [
                    '한국어 프로그램 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.',
                ],
                error: 'CrawlingError: ' + error.message,
                statusCode: 500,
            });
        } finally {
            await browser.close();
        }
    }

    // 최근 20개 불러오기
    async crawlerGovernmentProgram(): Promise<any> {
        console.log('크롤링 시작');
        const govData: any[] = [];

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
            ],
        });
        try {
            for (let i = 1; i < 5; i++) {
                const now = new Date();
                const today = format(now, 'yyyy-MM-dd');
                const endDate = format(
                    new Date(now.getFullYear(), now.getMonth() + 3, 0),
                    'yyyy-MM-dd',
                );
                let pageCount = i;

                const URL = `https://www.familynet.or.kr/web/lay1/program/S1T304C450/recruitReceipt/list.do?area=&area_detail=&program_end_date=${endDate}&application_type=on&_csrf=7c9109c8-246a-4c1d-b26d-6311100e67e8&reception_end_date=${endDate}&program_date_select=program_term&multicultural_type=language_development&cat=&program_start_date=${today}&reception_date_select=reception_term&keyword=%EB%8B%A4%EB%AC%B8%ED%99%94&reception_start_date=${today}&status=ongoing&rows=5&cpage=${pageCount}`;
                console.log(URL);
                const page = await browser.newPage();

                await page.goto(URL, { waitUntil: 'networkidle0' });

                // page.on('console', (msg) => console.log('Browser Console:', msg.text()));

                // 모든 링크를 먼저 수집
                const hrefs = await page.evaluate(() => {
                    const links = document.querySelectorAll('.program_list .clearfix .txt .tit a');
                    return Array.from(links).map(link => (link as HTMLAnchorElement).href);
                });

                for (const href of hrefs) {
                    await page.goto(href, { waitUntil: 'domcontentloaded' });

                    const container = await page.waitForSelector(
                        '.view_style_1',
                        {
                            timeout: 1000,
                        },
                    );

                    if (container) {
                        // 컨텐츠 로딩될 때까지 대기
                        await page.waitForFunction(() => {
                            const title = document.querySelector('#title');
                            const image = document.querySelector('#main_img img');
                            const bodyList = document.querySelectorAll('.txt ul li');
                            return image && title && bodyList.length > 0;
                        }, { timeout: 10000 }).catch(() => {
                            throw new InternalServerErrorException({
                                message: ['컨텐츠 로딩에 실패했습니다. 네트워크를 확인해주세요.'],
                                error: 'CrawlingError: content loading failed',
                                statusCode: 500,
                            })
                        });

                        const title = await page.evaluate(() => {
                            const titleHtml = document.querySelector('#title');
                            return titleHtml ? titleHtml.innerHTML : null;
                        });
                        const titleText = title ? title.replace(/[^\w\s가-힣]/g, ' ').replace('_', ': ') : null;

                        const image = await page.evaluate(() => {
                            const imageHtml = document.querySelector('#main_img img') as HTMLImageElement;
                            return imageHtml ? imageHtml.src : null;
                        });

                        const bodyList = await page.evaluate(() => {
                            const bodyList = document.querySelectorAll('.txt ul li span');
                            return Array.from(bodyList).map(body => body.textContent);
                        });
                        const borough = bodyList[0]?.split('> ')[1]
                        const programPeriod = bodyList[1]
                        const applicationPeriod = bodyList[2]
                        let target;
                        const personnel = bodyList[4]
                        const programDetail = bodyList[6]
                        const location = bodyList[8]?.split('오시는길')[0]

                        if (bodyList[3] === '-') {
                            target = '누구나 참여 가능'
                        } else {
                            target = bodyList[3]
                        }

                        const data = {
                            borough: borough,
                            title: titleText,
                            image: image,
                            url: href,
                            applicationPeriod: applicationPeriod,
                            programPeriod: programPeriod,
                            target: target,
                            personnel: personnel,
                            programDetail: programDetail,
                            location: location,
                        }
                        govData.push(data);
                    }
                }
            }
        } catch (error) {
            console.error('크롤링 에러 상세: ', error)
            throw new InternalServerErrorException({
                message: ['정부 프로그램 정보를 불러오는 데에 실패했습니다. 다시 시도해주세요.'],
                error: 'CrawlingError: ' + error.message,
                statusCode: 500,
            })
        } finally {
            await browser.close();
        }
        return govData
    }

     // 행사? 아무튼 홍보실에 있는 거...
    // 똑같이 20개씩 불러옴
    async crawlerEvent(): Promise<any> {
        console.log('크롤링 시작')
        const eventData: any[] = [];
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        const endDate = format(
            new Date(now.getFullYear(), now.getMonth() + 3, 0),
            'yyyy-MM-dd',
        );

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
            ],
        });

        const page = await browser.newPage();

        await page.goto('https://www.familynet.or.kr', { waitUntil: 'networkidle0' })
        const newCsrfToken = await page.$eval('meta[name="_csrf"]', el => el.getAttribute('content'))

        const URL = `https://www.familynet.or.kr/web/lay1/program/S1T304C423/receipt/list.do?_csrf=${newCsrfToken}&rows=20&cpage=1&cat=&program_categories=&program_reception_types=&program_statuses=&area=&area_detail=&program_start_date=${today}&program_end_date=${endDate}&keyword=%EB%8B%A4%EB%AC%B8%ED%99%94`;


        try {
            await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });

            // 1. 페이지가 제대로 로드되었는지 확인
            console.log('현재 URL:', await page.url())

            // 2. 전체 li.clearfix 개수 확인
            const allLiElements = await page.$$eval('.program_list li.clearfix', items => items.length)
            console.log('전체 li.clearfix 개수:', allLiElements)

            const programLinks = await page.$$eval('.program_list li.clearfix', listItems => {
                return listItems.map(item => {
                    // item 안에서 a 태그 찾기
                    const link = item.querySelector('a[onclick*="showProgramView"]')
                    if (link) {
                        const onclick = link.getAttribute('onclick')
                        if (onclick) {
                            const match = onclick.match(/showProgramView\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/)
                            if (match) {
                                const [seq, area, area_detail] = [match[1], match[2], match[3]]
                                return { seq, area, area_detail }
                            }
                        }
                    }
                    return null;
                }).filter(item => item !== null);
            })

            console.log('수집된 링크 개수:', programLinks.length)
            console.log('첫 번째 링크:', programLinks[0])

            async function getCenterUrl(area, area_detail) {
                console.log('getCenterUrl 호출됨:', area, area_detail)

                const csrfToken = await page.$eval('meta[name="_csrf"]', el => el.getAttribute('content'))
                console.log('csrfToken:', csrfToken)

                const response = await page.evaluate(async (area, area_detail, csrfToken) => {
                    const response = await fetch(`/getCenterUrl.do`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `area=${area}&area_detail=${area_detail}&_csrf=${csrfToken}`,
                    })
                    
                    if (!response.ok) {
                        const errorText = await response.text()
                        throw new Error(`HTTP ${response.status}: ${errorText}`)
                    }
                    
                    const data = await response.json()
                    if (data.error) {
                        throw new Error(data.error)
                    }
                    
                    return data.centerUrl
                }, area, area_detail, csrfToken);

                return response
            }

            let detailUrls: string[] = []
            for (const link of programLinks) {
                console.log('처리 중인 링크:', link)

                try {
                    const centerUrl = await getCenterUrl(link.area, link.area_detail).then(url => url.replace('http://', 'https://'))
                    console.log('centerUrl:', centerUrl)

                    const detailUrl = centerUrl + `/center/lay1/program/S1T304C423/receipt/view.do?seq=${link.seq}`
                    console.log('detailUrl:', detailUrl)

                    detailUrls.push(detailUrl)
                } catch (error) {
                    console.error('getCenterUrl 오류:', error)
                }
            }

            for (const url of detailUrls) {
                await page.goto(url, { waitUntil: 'domcontentloaded'})

                const container = await page.waitForSelector('.view_style_1', { timeout: 10000 }).catch(() => {
                    throw new InternalServerErrorException({
                        message: ['컨텐츠 로딩에 실패했습니다. 네트워크를 확인해주세요.'],
                        error: 'CrawlingError: content loading failed',
                        statusCode: 500,
                    })
                })

                if (container) {
                    await page.waitForFunction(() => {
                        const title = document.querySelector('#title');
                        const image = document.querySelector('#main_img img');
                        const bodyList = document.querySelectorAll('.txt ul li span');
                        return image && title && bodyList.length > 0;
                    }, { timeout: 10000 }).catch(() => {
                        throw new InternalServerErrorException({
                            message: ['컨텐츠 로딩에 실패했습니다. 네트워크를 확인해주세요.'],
                            error: 'CrawlingError: content loading failed',
                            statusCode: 500,
                        })
                    })

                    const title = await page.evaluate(() => {
                        const titleHtml = document.querySelector('#title');
                        return titleHtml ? titleHtml.innerHTML : null;
                    })

                    const image = await page.evaluate(() => {
                        const imageHtml = document.querySelector('#main_img img') as HTMLImageElement;
                        return imageHtml ? imageHtml.src : null;
                    })

                    const bodyList = await page.evaluate(() => {
                        const bodyList = document.querySelectorAll('.txt ul li span');
                        return Array.from(bodyList).map(body => body.textContent);
                    })

                    const borough = bodyList[0]?.split('> ')[1].split(' ')[0]
                    const programPeriod = bodyList[1]
                    const applicationPeriod = bodyList[2]
                    const target = bodyList[3]
                    const price = bodyList[4]
                    const contact = bodyList[9]
                    let location = bodyList[10]?.split('오시는길')[0]

                    if (location === '-' || location === ' ' || !location) {
                        location = '홈페이지 참조'
                    }

                    const data = {
                        borough: borough,
                        title: title,
                        image: image,
                        programPeriod: programPeriod,
                        applicationPeriod: applicationPeriod,
                        target: target,
                        price: price,
                        contact: contact,
                        location: location,
                        url: url,
                    }
                    eventData.push(data)
                }
            }
        } catch (error) {
            console.error('크롤링 실패: ' + error.message)
            throw new InternalServerErrorException({
                message: ['다문화 행사 크롤링에 실패했습니다. 다시 시도해주세요.'],
                statusCode: 500,
            })
        } finally {
            await browser.close();
        }
        return eventData
    }

    async getCrawlData() {
        try {
            // 원래는 이렇게 데이터베이스의 정보를 가져와야 함
            const governmentData = await this.prismaService.govPro.findMany({
                orderBy: {
                    id: 'desc',
                },
                take: 20,
            })

            const koreanData = await this.prismaService.koPro.findMany({
                orderBy: {
                    id: 'desc',
                },
                take: 16,
            })

            const eventData = await this.prismaService.eventPro.findMany({
                orderBy: {
                    id: 'desc',
                },
                take: 20,
            })

            // // 일단 데이터베이스에 저장된 값이 없어서 직접 요청하는 것으로 대체
            // const governmentData = await this.crawlerGovernmentProgram();
            // const koreanData = await this.crawlerKoreanProgram();

            return {
                message: '크롤링 데이터 조회 성공',
                statusCode: 200,
                governmentData,
                koreanData,
                eventData,
            }
        } catch (error) {
            console.error('크롤링 에러 상세: ', error)
            throw new BadRequestException({
                message: ['크롤링 데이터 조회에 실패했습니다. 다시 시도해주세요.'],
                error: 'CrawlingError: ' + error.message,
                statusCode: 400,
            })
        }
    }
}
