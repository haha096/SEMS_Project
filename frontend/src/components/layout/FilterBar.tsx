// 기존 import 유지
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Props = {
    station: string;
    onStationChange: (v: string) => void;

    // 기존 장치 드롭다운(다른 페이지에서 사용)
    device?: string;
    onDeviceChange?: (v: string) => void;

    // ✅ 추가: 우측 커스텀 영역 (모니터링에서만 씀)
    right?: React.ReactNode;
};

export default function FilterBar({
                                      station,
                                      onStationChange,
                                      device,
                                      onDeviceChange,
                                      right,
                                  }: Props) {
    return (
        <div className="w-full bg-gray-50 border-b px-6 py-2 flex items-center gap-4 text-sm">
            {/* 좌측: 스테이션 */}
            <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="font-medium">스테이션</span>
                <Select value={station} onValueChange={onStationChange}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3-201호">3-201호</SelectItem>
                        <SelectItem value="3-202호">3-202호</SelectItem>
                        <SelectItem value="3-203호">3-203호</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 우측:
          - 모니터링에선 right 슬롯을 사용 (기기 n개 텍스트)
          - 그 외 페이지에선 기존 장치 드롭다운 표시 */}
            {right ? (
                <div className="text-sm">
                    {right}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="font-medium">장치</span>
                    <Select value={device} onValueChange={onDeviceChange!}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="환기청정기">환기청정기</SelectItem>
                            <SelectItem value="에어컨">에어컨</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}
