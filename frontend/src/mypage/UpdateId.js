import React from "react";
import {Link} from "react-router-dom";
import "../css/mypage_css/UpdateId.css"

function UpdateId(){
    return(
        <div className="update-container">
            <h2>아이디 변경</h2>
            <form className="update-content">
                <div className="update-inputform">
                    <div className="update-input">
                        <label>현재 아이디</label>
                        <input type="text"/>
                    </div>
                    <div className="update-input">
                        <label>새 아이디</label>
                        <input type="password"/>
                    </div>
                </div>

                <button type="submit" className="update-button">아이디 변경</button>
            </form>


        </div>
    );
}

export default UpdateId;