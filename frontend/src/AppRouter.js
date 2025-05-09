import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import Signup from "./Login/Signup";
import Main from "./Main";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FindId from "./Login/FindId";
import FindPassword from "./Login/FindPassword";
import MonitorPage from './pages/MonitorPage';

function AppRouter({ message, isLoggedIn, userNickname, handleLogin, handleLogout }) {
    return (
        <Router>
            <Header isLoggedIn={isLoggedIn} userNickname={userNickname} handleLogout={handleLogout} />

            <Routes>
                <Route path="/" element={<Main message={message} isLoggedIn={isLoggedIn} userNickname={userNickname} />} />
                <Route path="/login" element={<Login handleLogin={handleLogin} />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/find-id" element={<FindId />} />
                <Route path="/find-password" element={<FindPassword />} />
                <Route path="/monitor" element={<MonitorPage />} />
            </Routes>

            <Footer />
        </Router>
    );
}

export default AppRouter;
