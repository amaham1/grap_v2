/**
 * 페이지 상태 관리를 위한 Composable
 * Nuxt.js의 useState와 navigateTo를 활용하여 페이지 상태를 유지합니다.
 */

interface PageState {
  page: number;
  search: string;
  [key: string]: any;
}

interface UsePageStateOptions {
  key: string;
  defaultState: PageState;
  expireTime?: number; // 밀리초 단위 (기본값: 5분)
}

export function usePageState(options: UsePageStateOptions) {
  const { key, defaultState, expireTime = 5 * 60 * 1000 } = options;

  // 초기화 시 복원 여부 추적
  let wasRestoredOnInit = false;

  // Nuxt의 useState를 사용하여 서버/클라이언트 간 상태 동기화
  const pageState = useState<PageState>(`${key}-state`, () => {
    // 초기화 시 저장된 상태가 있으면 복원 시도
    if (process.client) {
      const restored = tryRestoreFromStorage();
      if (restored) {
        wasRestoredOnInit = true;
        console.log(`${key} 페이지: 초기화 시 상태 복원됨`, restored);
        return restored;
      }
    }
    return { ...defaultState };
  });
  const shouldRestore = useState<boolean>(`${key}-should-restore`, () => false);

  // sessionStorage에서 상태 복원 시도 (내부 함수)
  function tryRestoreFromStorage(): PageState | null {
    try {
      const savedState = sessionStorage.getItem(`${key}-state`);
      if (!savedState) return null;

      const state = JSON.parse(savedState);

      // 만료 시간 확인
      if (state.timestamp && Date.now() - state.timestamp > expireTime) {
        sessionStorage.removeItem(`${key}-state`);
        return null;
      }

      // timestamp 제거 후 상태 반환
      const { timestamp, ...stateWithoutTimestamp } = state;
      return { ...defaultState, ...stateWithoutTimestamp };
    } catch (error) {
      console.warn(`Failed to restore state from storage for ${key}:`, error);
      return null;
    }
  }

  // 상태 저장
  function saveState(newState: Partial<PageState>) {
    // 현재 상태와 새 상태를 병합
    const updatedState = { ...pageState.value, ...newState };
    pageState.value = updatedState;

    // 클라이언트에서만 sessionStorage에 저장
    if (process.client) {
      const stateWithTimestamp = {
        ...updatedState,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`${key}-state`, JSON.stringify(stateWithTimestamp));
    }
  }

  // 상태 복원 (수동 복원용)
  function restoreState(): boolean {
    if (!process.client) return false;

    const restored = tryRestoreFromStorage();
    if (restored) {
      pageState.value = restored;
      return true;
    }
    return false;
  }

  // 복원 플래그 설정
  function setShouldRestore(value: boolean) {
    shouldRestore.value = value;

    if (process.client) {
      if (value) {
        sessionStorage.setItem(`${key}-should-restore`, 'true');
      } else {
        sessionStorage.removeItem(`${key}-should-restore`);
      }
    }
  }

  // 복원 플래그 확인
  function checkShouldRestore(): boolean {
    if (!process.client) return false;

    const flag = sessionStorage.getItem(`${key}-should-restore`);
    return flag === 'true' || shouldRestore.value;
  }

  // 상태 초기화
  function clearState() {
    pageState.value = { ...defaultState };

    if (process.client) {
      sessionStorage.removeItem(`${key}-state`);
      sessionStorage.removeItem(`${key}-should-restore`);
    }
  }

  // 페이지 변경 시 상태 저장
  function updatePage(newPage: number) {
    saveState({ page: newPage });
  }

  // 검색어 변경 시 상태 저장
  function updateSearch(searchText: string) {
    saveState({ search: searchText, page: 1 }); // 검색 시 첫 페이지로
  }

  // 필터 변경 시 상태 저장
  function updateFilters(filters: Record<string, any>) {
    saveState({ ...filters, page: 1 }); // 필터 변경 시 첫 페이지로
  }

  // 상세 페이지에서 목록으로 돌아갈 때 사용
  function prepareForReturn() {
    setShouldRestore(true);
  }

  // 목록 페이지에서 상태 복원 시도
  function tryRestore(): boolean {
    if (checkShouldRestore()) {
      setShouldRestore(false); // 플래그 제거
      return restoreState();
    }

    // 새로고침 등으로 플래그가 없어도 저장된 상태가 있으면 복원
    if (process.client) {
      const savedState = sessionStorage.getItem(`${key}-state`);
      if (savedState) {
        console.log(`${key} 페이지: 저장된 상태 발견, 복원 시도`);
        return restoreState();
      }
    }

    return false;
  }

  // 초기화 시 복원되었는지 확인
  function wasInitiallyRestored(): boolean {
    return wasRestoredOnInit;
  }

  return {
    // 상태
    state: readonly(pageState),

    // 상태 관리 함수
    saveState,
    restoreState,
    clearState,

    // 편의 함수
    updatePage,
    updateSearch,
    updateFilters,

    // 네비게이션 관련
    prepareForReturn,
    tryRestore,

    // 플래그 관리
    setShouldRestore,
    checkShouldRestore,

    // 복원 상태 확인
    wasInitiallyRestored
  };
}
