import React, {useState} from "react";
import { Link } from "react-router-dom";
import Monitoring_outdoor_default from "./Floor/Monitoring_outdoor_default";


function Monitoring_outdoor(){

    const [showSubmenu, setShowSubmenu] = useState(false);

    // 어떤 컨텐츠를 보여줄지 결정하는 state
    const [activeRoom, setActiveRoom] = useState("1-1교실");

    const [show1F, setShow1F] = useState(false);
    const [show2F, setShow2F] = useState(false);
    const [show3F, setShow3F] = useState(false);

    const renderContent = () => {
        switch (activeRoom) {
            default:
                return <Monitoring_outdoor_default />;
        }
    };

    return(
        <div>
            <br />
            <div className="monitoring_indoor-container">
                <h2>모니터링</h2>
            </div>
            <br />

            <div className="container2">
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

export default Monitoring_outdoor;