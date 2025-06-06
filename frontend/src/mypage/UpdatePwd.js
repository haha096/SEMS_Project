import React from "react";
import "../css/mypage_css/UpdatePwd.css"

function UpdatePwd(){
    return(
        <div className="update-container">
            <h2>비밀번호 변경</h2>
            <form className="update-content">
                <div className="update-inputform">
                    <div className="update-input">
                        <label>현재 비밀번호</label>
                        <input type="text"/>
                    </div>
                    <div className="update-input">
                        <label>새 비밀번호</label>
                        <input type="password"/>
                    </div>
                </div>

                <button type="submit" className="update-button">비밀번호 변경</button>
            </form>


        </div>
    );
}

export default UpdatePwd;