//package Not_Found.controller;
//
//import Not_Found.dto.DustDto;
//import Not_Found.service.DustService;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/dust")
//public class DustController {
//
//    private final DustService dustService;
//
//    public DustController(DustService dustService) {
//        this.dustService = dustService;
//    }
//
//    @GetMapping
//    public ResponseEntity<DustDto> getDustInfo() {
//        return ResponseEntity.ok(dustService.getDustData());
//    }
//}


package Not_Found.controller;

import Not_Found.service.DustService;
import Not_Found.service.DustService.DustDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class DustController {

    private final DustService dustService;

    public DustController(DustService dustService) {
        this.dustService = dustService;
    }

    // 구로구 기본 좌표 사용. 필요 시 쿼리로 덮어쓰기
    @GetMapping("/api/dust")
    public ResponseEntity<DustDto> getDust(
            @RequestParam(defaultValue = "58") double lat,
            @RequestParam(defaultValue = "125") double lon
    ) {
        DustDto dto = dustService.getCurrentDust(lat, lon);
        return ResponseEntity.ok(dto);
    }
}