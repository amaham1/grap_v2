// composables/useSEO.ts
import type { GasStation } from '~/types/gasStation';

/**
 * SEO 최적화를 위한 컴포저블
 */
export const useSEO = () => {
  /**
   * 주유소 정보를 위한 구조화된 데이터 생성
   */
  const generateGasStationStructuredData = (stations: GasStation[]) => {
    if (!stations || stations.length === 0) return null;

    // 주유소 목록을 위한 구조화된 데이터
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: '제주도 주유소 목록',
      description: '제주도 내 주유소들의 위치와 가격 정보',
      numberOfItems: stations.length,
      itemListElement: stations.slice(0, 20).map((station, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'GasStation',
          '@id': `https://grap.co.kr/alljeju/gas-stations#${station.opinet_id}`,
          name: station.station_name,
          description: `${station.brand_name} ${station.station_name} - 제주도 주유소`,
          address: {
            '@type': 'PostalAddress',
            streetAddress: station.address,
            addressRegion: '제주특별자치도',
            addressCountry: 'KR',
            postalCode: station.zip_code
          },
          geo: station.latitude && station.longitude ? {
            '@type': 'GeoCoordinates',
            latitude: station.latitude,
            longitude: station.longitude
          } : undefined,
          telephone: station.phone,
          brand: {
            '@type': 'Brand',
            name: station.brand_name
          },
          ...(station.gas_prices && station.gas_prices.length > 0 && {
            offers: station.gas_prices.map(price => ({
              '@type': 'Offer',
              name: `${price.fuel_type} 가격`,
              price: price.price,
              priceCurrency: 'KRW',
              priceValidUntil: price.updated_at ? new Date(new Date(price.updated_at).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
              availability: 'https://schema.org/InStock'
            }))
          })
        }
      }))
    };

    return structuredData;
  };

  /**
   * 지역별 주유소 페이지를 위한 메타 태그 생성
   */
  const generateRegionalGasStationMeta = (region?: string, stationCount?: number) => {
    const baseTitle = '제주도 주유소 최저가 정보';
    const title = region ? `${region} 주유소 최저가 정보 | ${baseTitle} - Grap` : `${baseTitle} | 실시간 유가 비교 - Grap`;
    
    const baseDescription = '제주도 주유소 최저가 정보를 실시간으로 확인하세요. 카카오맵으로 내 주변 주유소 위치와 휘발유, 경유, LPG 가격을 한눈에 비교할 수 있습니다.';
    const description = region && stationCount 
      ? `${region} 지역 ${stationCount}개 주유소의 최저가 정보를 확인하세요. ${baseDescription}`
      : baseDescription;

    return {
      title,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description }
      ]
    };
  };

  /**
   * 브랜드별 주유소 페이지를 위한 메타 태그 생성
   */
  const generateBrandGasStationMeta = (brand?: string, stationCount?: number) => {
    const baseTitle = '제주도 주유소 최저가 정보';
    const title = brand ? `${brand} 주유소 제주도 지점 정보 | ${baseTitle} - Grap` : `${baseTitle} | 실시간 유가 비교 - Grap`;
    
    const baseDescription = '제주도 주유소 최저가 정보를 실시간으로 확인하세요.';
    const description = brand && stationCount 
      ? `제주도 ${brand} 주유소 ${stationCount}개 지점의 실시간 가격 정보와 위치를 확인하세요. ${baseDescription}`
      : baseDescription;

    return {
      title,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description }
      ]
    };
  };

  /**
   * 연료 타입별 페이지를 위한 메타 태그 생성
   */
  const generateFuelTypeGasStationMeta = (fuelType?: string) => {
    const fuelTypeNames: Record<string, string> = {
      'gasoline': '휘발유',
      'diesel': '경유',
      'lpg': 'LPG',
      'premium_gasoline': '고급휘발유'
    };

    const fuelTypeName = fuelType ? fuelTypeNames[fuelType] || fuelType : '';
    const baseTitle = '제주도 주유소 최저가 정보';
    const title = fuelTypeName ? `제주도 ${fuelTypeName} 최저가 주유소 | ${baseTitle} - Grap` : `${baseTitle} | 실시간 유가 비교 - Grap`;
    
    const baseDescription = '제주도 주유소 최저가 정보를 실시간으로 확인하세요.';
    const description = fuelTypeName 
      ? `제주도 ${fuelTypeName} 최저가 주유소를 찾아보세요. ${baseDescription}`
      : baseDescription;

    return {
      title,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description }
      ]
    };
  };

  /**
   * 페이지에 구조화된 데이터 추가
   */
  const addStructuredData = (data: any) => {
    if (!data) return;

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(data)
        }
      ]
    });
  };

  /**
   * 제주도 지역별 키워드 생성
   */
  const generateJejuRegionKeywords = (stations?: GasStation[]) => {
    const baseKeywords = [
      '제주도 주유소', '제주 주유소', '제주도 유가', '제주 유가',
      '제주도 휘발유', '제주 휘발유', '제주도 경유', '제주 경유',
      '제주도 LPG', '제주 LPG', '제주도 최저가', '제주 최저가'
    ];

    const regionKeywords = [
      '제주시 주유소', '서귀포시 주유소', '애월 주유소', '한림 주유소',
      '한경 주유소', '대정 주유소', '안덕 주유소', '중문 주유소',
      '성산 주유소', '표선 주유소', '남원 주유소', '구좌 주유소',
      '조천 주유소', '우도 주유소'
    ];

    const brandKeywords = [
      'SK에너지 제주', 'GS칼텍스 제주', 'S-OIL 제주', '현대오일뱅크 제주',
      '알뜰주유소 제주', '무인주유소 제주'
    ];

    // 실제 주유소 데이터가 있으면 브랜드별 키워드 추가
    if (stations && stations.length > 0) {
      const uniqueBrands = [...new Set(stations.map(s => s.brand_name).filter(Boolean))];
      uniqueBrands.forEach(brand => {
        brandKeywords.push(`${brand} 제주도`, `${brand} 제주`);
      });
    }

    return [...baseKeywords, ...regionKeywords, ...brandKeywords].join(', ');
  };

  return {
    generateGasStationStructuredData,
    generateRegionalGasStationMeta,
    generateBrandGasStationMeta,
    generateFuelTypeGasStationMeta,
    generateJejuRegionKeywords,
    addStructuredData
  };
};
