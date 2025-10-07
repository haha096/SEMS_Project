# 🧠 404 Smart Environment Web Server

IoT 기반 실내 공기질 모니터링 및 제어 시스템의 웹서버 저장소입니다.  
이 저장소는 React 프론트엔드, Spring Boot 및 Flask 백엔드로 구성되며, MQTT를 통해 센서 데이터를 수신하고 사용자에게 실시간 정보를 제공합니다.

---

## 📁 프로젝트 구조

- 📂 **flask-backend**  
  └─ 라즈베리파이 + MQTT + 실시간 시각화 처리

- 📂 **spring-backend**  
  └─ 사용자 인증, 제어 API, DB 처리 (Spring Boot)

- 📂 **frontend**  
  └─ React 기반 사용자 UI

- 📄 **.gitignore**  
  └─ Git 무시 설정

- 📄 **README.md**  
  └─ 프로젝트 설명 및 협업 가이드


---

## 🌿 브랜치 전략

| 브랜치        | 설명                          |
|---------------|-------------------------------|
| main        | 최종 배포 및 결과물 저장용     |
| dev         | 전체 개발 통합 브랜치          |
| feature/*   | 개별 기능 개발용 브랜치        |

---

## 🔧 작업 플로우: Clone → 브랜치 작업 → 푸시 → PR (IntelliJ 기준)

---

### 1️⃣ GitHub에서 저장소 Clone

1. GitHub 저장소 홈에서 Code 버튼 클릭
2. HTTPS 탭 → URL 복사  
   예: https://github.com/team/404-web-server.git
3. IntelliJ 실행 → Get from VCS 클릭
4. 복사한 URL 붙여넣기 → Clone 버튼 클릭
5. 프로젝트가 IntelliJ에 자동으로 열림

#### 사진1
![0 깃허브 주소 복사하기](https://github.com/user-attachments/assets/c9228c34-fd48-4637-97b4-3beebff94c18)

#### 사진2
![0 IntelliJ 실행 및 프로젝트 생성](https://github.com/user-attachments/assets/eebf6e97-a219-45e7-94d1-d93db017c4f7)

#### 사진3
![0 깃허브 주소 붙여 넣기 -> Clone](https://github.com/user-attachments/assets/4f7dae45-a971-45cd-8c7b-34b61bf477cd)

---

### 2️⃣ dev 브랜치로 전환

1. IntelliJ 하단 좌측 main ▼ 클릭
2. origin/dev 선택 → Checkout 클릭

#### 사진4
![dev 체크아웃](https://github.com/user-attachments/assets/dacd1cfd-6293-4a83-92ef-c2b3174822f8)

---

### 3️⃣ feature 브랜치 생성

1. 하단 브랜치 이름 (dev ▼) 클릭 → New Branch
2. 브랜치 이름 입력 (예: feature/기능명)
3. 해당 브랜치로 자동 전환됨

#### 사진5
![dev에 브런치 생성](https://github.com/user-attachments/assets/f47fb9bc-1dac-4e8b-9161-cf69e14ab923)

#### 사진6
![브런치 이름 입력](https://github.com/user-attachments/assets/0fc06153-1e5a-4b38-8d7c-fa7943ec9065)

#### 사진7
![해당 브런치로 자동 전환 확인](https://github.com/user-attachments/assets/3a7aacc2-3188-4c78-9a80-893f7bed51a7)

---

### 4️⃣ 코드 작성 & 커밋

- 코드 작성 후: VCS > Commit 또는 Ctrl + K
- 커밋 메시지 작성
- 커밋 버튼 클릭

#### 사진8
![개발 완료 후 커밋](https://github.com/user-attachments/assets/10c35e44-a56b-46df-bafb-541f134e684c)

---

### 5️⃣ 푸시

- 커밋 후: Git > Push 또는 Ctrl + Shift + K
- 원격 저장소에 feature/* 브랜치로 푸시됨

#### 사진9
![커밋 작성 및 푸시](https://github.com/user-attachments/assets/5faddf67-3ef0-45b7-a836-d5cc112a5239)

---

### 6️⃣ GitHub에서 Pull Request(PR) 생성

1. GitHub 저장소 접속 → feature/* 브랜치 선택
2. Compare & pull request 클릭
3. **base: dev ← compare: feature/*** 확인
4. 제목 & 설명 작성
5. Create pull request 클릭

#### 사진10
![깃허브 저장소 접속 및 PR](https://github.com/user-attachments/assets/b7bb8e2c-d554-44c3-9170-9ecb48e145a3)

## 사진 11 *주의 !!! PR할 base를 main -> dev로 변경*
![주의!! PR할 base를 main -> dev로 변경](https://github.com/user-attachments/assets/c09e9ae8-1df8-47ea-a6bd-af57c4a5768e)



---

### 7️⃣ 팀장이 dev에 머지

- PR 내용 확인 후 Merge pull request 클릭
- dev 브랜치에 변경 사항 병합 완료

---

<br>

## 📣 팀 협업 수칙

- 모든 기능은 feature/* 브랜치에서 작업
- dev에 직접 커밋 ❌ → 반드시 Pull Request로 병합
- 완료된 브랜치는 병합 후 삭제

<br>

## 프로젝트 실행 방법
### 1. Spring boot 서버 실행
1. clone 후 gridle 연결
2. MySQL DB확인 (DB이름, 아이디, 패스워드)

### 2. Flask 서버 실행
1. pip install flask_cors (cmd에서 초기 설치)
2. pip install matplotlib (cmd에서 초기 설치)
3. pip install flask (cmd에서 초기 설치)
4. pip install pymysql (cmd에서 초기 설치)
5. cd flask-backend (flask 파일로 이동)
6. python app.py (flask 서버 실행)

### 3. React 실행
1. cd frontend
2. npm install
3. npm start

<br>

> 본 저장소는 동양미래대학교 졸업작품 "스마트 환경관리 시스템" 팀 프로젝트의 웹서버 구현용 저장소입니다.
