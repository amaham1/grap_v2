<template>
  <div class="content-display">
    <!-- 원본 텍스트 내용이 있는 경우 -->
    <div v-if="content && content.trim()" class="original-content">
      <pre class="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-800">{{ content }}</pre>
    </div>
    
    <!-- 원본 텍스트가 없고 HTML 내용만 있는 경우 (기존 데이터 호환성) -->
    <div v-else-if="contentHtml && contentHtml.trim()" class="html-content prose prose-blue max-w-none" v-html="contentHtml"></div>
    
    <!-- 내용이 없는 경우 -->
    <div v-else class="no-content text-gray-500 italic">
      내용이 없습니다.
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content?: string;        // 원본 텍스트 내용
  contentHtml?: string;    // HTML 변환된 내용 (fallback)
}

const props = defineProps<Props>();
</script>

<style scoped>
.content-display {
  @apply w-full;
}

.original-content pre {
  /* 기본 pre 스타일 재설정 */
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  
  /* 텍스트 래핑 및 공백 보존 */
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* HTML 콘텐츠용 prose 스타일 (기존 스타일 유지) */
.html-content {
  color: #374151;
  line-height: 1.7;
}

.html-content h1, 
.html-content h2, 
.html-content h3, 
.html-content h4, 
.html-content h5, 
.html-content h6 {
  color: #1f2937;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
}

.html-content h1 { font-size: 1.5rem; }
.html-content h2 { font-size: 1.25rem; }
.html-content h3 { font-size: 1.125rem; }

.html-content p {
  margin-bottom: 1em;
}

.html-content a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.html-content a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.html-content ul, 
.html-content ol {
  padding-left: 1.5em;
  margin: 1em 0;
}

.html-content li {
  margin: 0.5em 0;
}

.html-content strong {
  font-weight: 600;
  color: #1f2937;
}

.html-content br {
  line-height: 1.7;
}
</style>
