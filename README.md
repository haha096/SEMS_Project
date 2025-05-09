# 🧠 404 Smart Environment Web Server

IoT 기반 실내 공기질 모니터링 및 제어 시스템의 웹서버 저장소입니다.  
이 저장소는 React 프론트엔드, Spring Boot 및 Flask 백엔드로 구성되며, MQTT를 통해 센서 데이터를 수신하고 사용자에게 실시간 정보를 제공합니다.

---

## 📁 프로젝트 구조

```
📁 flask-backend/        # flask
📁 spring-backend/       # spring boot
📁 frontend/             # react
.gitignore
README.md
```

---

## 🌿 브랜치 전략

| 브랜치        | 설명                          |
|---------------|-------------------------------|
| `main`        | 최종 배포 및 결과물 저장용     |
| `dev`         | 전체 개발 통합 브랜치          |
| `feature/*`   | 개별 기능 개발용 브랜치        |

---

🔧 작업 플로우: Clone → 브랜치 작업 → 푸시 → PR (IntelliJ 기준)
1️⃣ GitHub에서 저장소 Clone
GitHub 저장소 홈에서 Code 버튼 클릭
HTTPS 탭 → URL 복사
예: https://github.com/team/404-web-server.git
IntelliJ 실행 → Get from VCS 클릭
복사한 URL 붙여넣기 → Clone 버튼 클릭
프로젝트가 IntelliJ에 자동으로 열림
2️⃣ dev 브랜치로 전환
IntelliJ 하단 좌측 main ▼ 클릭
origin/dev 선택 → Checkout 클릭
3️⃣ feature 브랜치 생성
하단 브랜치 이름 (dev ▼) 클릭 → New Branch
브랜치 이름 입력 (예: feature/login-api)
해당 브랜치로 자동 전환됨
4️⃣ 코드 작성 & 커밋
코드 작성 후: VCS > Commit 또는 Ctrl + K
커밋 메시지 예시:
[feat] 로그인 API 추가
- 사용자 로그인 기능 구현
- 비밀번호 암호화 처리
커밋 버튼 클릭
5️⃣ 푸시
커밋 후: Git > Push 또는 Ctrl + Shift + K
원격 저장소에 feature/* 브랜치로 푸시됨
6️⃣ GitHub에서 Pull Request(PR) 생성
GitHub 저장소 접속 → feature/* 브랜치 선택
Compare & pull request 클릭
base: dev ← compare: feature/* 확인
제목 & 설명 작성
Create pull request 클릭
7️⃣ 팀장이 dev에 머지
PR 내용 확인 후 Merge pull request 클릭
dev 브랜치에 변경 사항 병합 완료
---

## 📌 커밋 메시지 규칙

```
[타입] 커밋 제목: 상세 설명
```

| 태그      | 설명               |
|-----------|--------------------|
| `feat`    | 새로운 기능 추가    |
| `fix`     | 버그 수정           |
| `docs`    | 문서 수정           |
| `refactor`| 리팩토링 (로직 변경 X) |
| `style`   | 포맷팅 변경         |
| `test`    | 테스트 코드 추가    |
| `chore`   | 기타 설정 변경 등   |

---

## 📣 팀 협업 수칙

- 모든 기능은 `feature/*` 브랜치에서 작업
- `dev`에 직접 커밋 ❌ → 반드시 Pull Request로 병합
- PR은 **명확한 제목/설명 필수**
- 완료된 브랜치는 병합 후 삭제 권장

---

## 👥 팀 정보

| 이름     | 역할                     |
|----------|--------------------------|
| 김현호   | 팀장, 하드웨어/통신 총괄  |
| 나은주   | 웹 프론트/백엔드 통합    |
| 임종원   | MQTT, 채팅, Git 관리     |
| 한민서   | SPA UI 구현, 라우팅      |
| 양민우   | 전체 구조 설계 및 총괄 PM |

---

> 본 저장소는 동양미래대학교 졸업작품 "스마트 환경관리 시스템" 팀 프로젝트의 웹서버 구현용 저장소입니다.
