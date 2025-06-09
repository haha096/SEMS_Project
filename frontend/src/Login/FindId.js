import React from "react";
import "../css/find_css/FindId.css"

function FindId() {
    return(
        <div className="find-container">
            <h2>아이디 찾기</h2>
            <form className="find-content">
                <div className="find-inputform">
                    <div className="find-input">
                        <label>이메일</label>
                        <input type="text"/>
                    </div>

                </div>

                <button type="submit" className="find-button">이메일로 전송</button>
            </form>


        </div>
    );
}
export default FindId;