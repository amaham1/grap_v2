// server/api/debug/check-users.get.ts
import { defineEventHandler } from 'h3';
import { supabase } from '~/server/utils/supabase';

/**
 * 사용자 테이블 확인 디버깅 API
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[DEBUG-USERS] 사용자 테이블 확인 시작...');

    // 1. users 테이블의 모든 사용자 조회
    const usersResult = await supabase
      .from('users')
      .select('id, email, role, name, is_active, created_at')
      .order('id');

    if (usersResult.error) {
      throw new Error(`users 테이블 조회 실패: ${usersResult.error.message}`);
    }

    console.log(`[DEBUG-USERS] 사용자 수: ${usersResult.data?.length || 0}개`);

    // 2. 관리자 계정 확인
    const adminUsers = usersResult.data?.filter(user => user.role === 'admin') || [];
    console.log(`[DEBUG-USERS] 관리자 계정 수: ${adminUsers.length}개`);

    // 3. 특정 이메일 확인
    const targetEmail = 'admin@grap.co.kr';
    const targetUser = usersResult.data?.find(user => user.email === targetEmail);
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalUsers: usersResult.data?.length || 0,
        adminUsers: adminUsers.length,
        targetUserExists: !!targetUser
      },
      users: usersResult.data?.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        is_active: user.is_active,
        created_at: user.created_at
      })) || [],
      targetUser: targetUser ? {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        name: targetUser.name,
        is_active: targetUser.is_active,
        created_at: targetUser.created_at
      } : null,
      recommendations: []
    };

    if (!targetUser) {
      result.recommendations.push('❌ admin@grap.co.kr 계정이 존재하지 않습니다.');
      result.recommendations.push('🔧 데이터베이스 스키마를 실행하여 기본 관리자 계정을 생성하세요.');
    } else if (!targetUser.is_active) {
      result.recommendations.push('⚠️ admin@grap.co.kr 계정이 비활성화되어 있습니다.');
    } else {
      result.recommendations.push('✅ admin@grap.co.kr 계정이 정상적으로 존재합니다.');
    }

    console.log('[DEBUG-USERS] 사용자 확인 완료:', result.summary);

    return result;

  } catch (error: any) {
    console.error('[DEBUG-USERS] 사용자 확인 실패:', error);

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      recommendations: [
        '🔍 데이터베이스 연결 상태를 확인하세요.',
        '🔍 users 테이블이 존재하는지 확인하세요.',
        '🔧 데이터베이스 스키마를 실행하세요.'
      ]
    };
  }
});
