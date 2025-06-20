package Not_Found.controller;

import Not_Found.dto.DustDto;
import Not_Found.service.DustService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dust")
public class DustController {

    private final DustService dustService;

    public DustController(DustService dustService) {
        this.dustService = dustService;
    }

    @GetMapping
    public ResponseEntity<DustDto> getDustInfo() {
        return ResponseEntity.ok(dustService.getDustData());
    }
}
