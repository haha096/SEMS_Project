// SockJS 등 일부 브라우저 번들에서 global 심볼을 참조하는 경우 대비
// 반드시 앱 진입점(main.tsx)보다 먼저(=최상단) import 되어야 함
;(window as any).global = window
