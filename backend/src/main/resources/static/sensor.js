//// WebSocket 연결 (서버와의 연결 URL이 정확한지 확인)
//var socket = new WebSocket("ws://localhost:10000/ws/sensor");
//
//socket.onopen = function() {
//    console.log("WebSocket 연결됨.");
//};
//
//socket.onmessage = function(event) {
//    // 수신한 데이터를 JSON으로 파싱
//    var sensorData = JSON.parse(event.data);
//
//    // 각 센서 데이터를 HTML 요소에 반영
//    document.getElementById('id').innerText = sensorData["id"];  // id 추가
//    document.getElementById('timestamp').innerText = sensorData["timestamp"];  // timestamp 추가
//    document.getElementById('temp').innerText = sensorData["TEMP"];
//    document.getElementById('hum').innerText = sensorData["HUM"];
//    document.getElementById('mode').innerText = sensorData["MODE"];
//    document.getElementById('speed').innerText = sensorData["SPEED"];
//    document.getElementById('pm2_5').innerText = sensorData["PM2.5"];
//    document.getElementById('pm10').innerText = sensorData["PM10"];
//    document.getElementById('powerUsage').innerText = sensorData["전력량"];
//
//
//};
//
//socket.onerror = function(error) {
//    console.error("WebSocket 오류: " + error);
//};
//
//socket.onclose = function() {
//    console.log("WebSocket 연결 종료");
//};
