# 레슨 매니저 작업 규칙

## 화면 문구
- 모든 줄바꿈은 단어(키워드) 단위로 합니다. 글자 중간에서 줄이 바뀌면 안 됩니다.
  - 페이지 기본값: `html{word-break:keep-all;overflow-wrap:break-word}` (index.html, policy.html)
  - 새 페이지·새 컴포넌트·이미지/영상 속 글자도 같은 규칙을 따릅니다.

## 버전 운영
- 운영 주소(master): https://lesson-manager-saas.vercel.app
- 이전 안정 버전 보관: `stable/v1`, `stable/v2` 브랜치
- 새 기능은 먼저 실험 브랜치(`v2`, `v3` …, 고정 미리보기 주소)에서 확인한 뒤 운영에 반영합니다.
- 미리보기 주소에서 구글 로그인을 쓰려면 Firebase 승인된 도메인에 그 주소를 추가해야 합니다.

## 라이브러리
- Three.js는 `vendor/three.module.min.js`(0.160.0)로 포함합니다. 외부 CDN에 의존하지 않습니다.
