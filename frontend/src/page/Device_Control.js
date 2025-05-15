import React, {useState} from "react";
import { Link } from "react-router-dom";
import '../css/page_css/Device_Control.css';
import Device_Control_FirstRoom1 from "./Device_Control_Floor/Device_Control_FirstRoom1";


function Device_Control(){
    const [showSubmenu, setShowSubmenu] = useState(false);

    // 어떤 컨텐츠를 보여줄지 결정하는 state
    const [activeRoom, setActiveRoom] = useState("1-1교실");

    const [show1F, setShow1F] = useState(false);
    const [show2F, setShow2F] = useState(false);
    const [show3F, setShow3F] = useState(false);

    const renderContent = () => {
        switch (activeRoom) {
            case "1-1교실":
                return <Device_Control_FirstRoom1 />;
            case "1-2교실":
                return <p>📘 1층 - 1-2교실 페이지입니다.</p>;
            case "도서관":
                return <p>📚 1층 - 도서관 페이지입니다.</p>;
            case "2-1교실":
                return <p>🏫 2층 - 2-1교실 페이지입니다.</p>;
            case "2-2교실":
                return <p>🏫 2층 - 2-2교실 페이지입니다.</p>;
            case "과학실":
                return <p>🧪 2층 - 과학실 페이지입니다.</p>;
            case "3-1교실":
                return <p>🎵 3층 - 3-1교실 페이지입니다.</p>;
            case "3-2교실":
                return <p>🎵 3층 - 3-2교실 페이지입니다.</p>;
            case "음악실":
                return <p>🎶 3층 - 음악실 페이지입니다.</p>;
            default:
                return <p>기본 페이지입니다.</p>;
        }
    };

    return(
        <div>
            <br />
            <div className="device_control-container">
                <h2>기기 제어</h2>
            </div>
            <br />

            <div className="device_control-container2">
                {/* 왼쪽 메뉴 */}
                <div className="menu-container">

                    {/* 1층 */}
                    <div className="menu-item"
                         onMouseEnter={() => setShow1F(true)}
                         onMouseLeave={() => setShow1F(false)}>
                        1층
                        <div className={`submenu ${show1F ? 'show' : ''}`}>
                            <div onClick={() => setActiveRoom("도서관")}>도서관</div>
                            <div onClick={() => setActiveRoom("1-1교실")}>1-1 교실</div>
                            <div onClick={() => setActiveRoom("1-2교실")}>1-2 교실</div>
                        </div>
                    </div>

                    {/* 2층 */}
                    <div className="menu-item"
                         onMouseEnter={() => setShow2F(true)}
                         onMouseLeave={() => setShow2F(false)}>
                        2층
                        <div className={`submenu ${show2F ? 'show' : ''}`}>
                            <div onClick={() => setActiveRoom("과학실")}>과학실</div>
                            <div onClick={() => setActiveRoom("2-1교실")}>2-1 교실</div>
                            <div onClick={() => setActiveRoom("2-2교실")}>2-2 교실</div>
                        </div>
                    </div>

                    {/* ✅ 3층 - 서브메뉴 추가 */}
                    <div className="menu-item"
                         onMouseEnter={() => setShow3F(true)}
                         onMouseLeave={() => setShow3F(false)}>
                        3층
                        <div className={`submenu ${show3F ? 'show' : ''}`}>
                            <div onClick={() => setActiveRoom("3-1교실")}>3-1 교실</div>
                            <div onClick={() => setActiveRoom("3-2교실")}>3-2 교실</div>
                            <div onClick={() => setActiveRoom("음악실")}>음악실</div>
                        </div>
                    </div>
                </div>

                {/* 오른쪽 내용 */}
                <div className="content-area">
                    {renderContent()}
                </div>
            </div>

            <br /><br /><br />
        </div>
    );
}

export default Device_Control;