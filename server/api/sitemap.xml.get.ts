// server/api/sitemap.xml.get.ts
import { defineEventHandler, setHeader } from 'h3';
import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  // XML 응답 헤더 설정
  setHeader(event, 'Content-Type', 'application/xml');
  setHeader(event, 'Cache-Control', 'public, max-age=3600'); // 1시간 캐시

  const baseUrl = 'https://grap.co.kr';
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

  // 정적 페이지들
  const staticPages = [
    {
      url: `${baseUrl}/alljeju`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      url: `${baseUrl}/alljeju/gas-stations`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/alljeju/festivals`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: `${baseUrl}/alljeju/exhibitions`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: `${baseUrl}/alljeju/welfare-services`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.7'
    }
  ];

  // 동적 페이지들 추가
  const dynamicPages: Array<{url: string, lastmod: string, changefreq: string, priority: string}> = [];

  try {
    // 축제 상세 페이지들
    const { data: festivals } = await supabase
      .from('festivals')
      .select('id, written_date')
      .order('written_date', { ascending: false })
      .limit(100);

    if (festivals) {
      festivals.forEach(festival => {
        dynamicPages.push({
          url: `${baseUrl}/alljeju/festivals/${festival.id}`,
          lastmod: festival.written_date || currentDate,
          changefreq: 'monthly',
          priority: '0.6'
        });
      });
    }

    // 전시회 상세 페이지들
    const { data: exhibitions } = await supabase
      .from('exhibitions')
      .select('id, start_date')
      .order('start_date', { ascending: false })
      .limit(100);

    if (exhibitions) {
      exhibitions.forEach(exhibition => {
        dynamicPages.push({
          url: `${baseUrl}/alljeju/exhibitions/${exhibition.id}`,
          lastmod: exhibition.start_date || currentDate,
          changefreq: 'monthly',
          priority: '0.6'
        });
      });
    }

    // 복지서비스 상세 페이지들
    const { data: welfareServices } = await supabase
      .from('welfare_services')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (welfareServices) {
      welfareServices.forEach(service => {
        dynamicPages.push({
          url: `${baseUrl}/alljeju/welfare-services/${service.id}`,
          lastmod: service.created_at?.split('T')[0] || currentDate,
          changefreq: 'monthly',
          priority: '0.5'
        });
      });
    }
  } catch (error) {
    console.error('Sitemap 생성 중 오류:', error);
    // 에러가 발생해도 정적 페이지는 포함
  }

  // 모든 페이지 합치기
  const allPages = [...staticPages, ...dynamicPages];

  // XML 생성
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
});
