import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignUpPage } from "./Components/SignUpPage";
import { LoginPage } from "./Components/LoginPage";
import { LandingPage } from "./Components/LandingPage";
import { GroupProvider } from "./Context/GroupContext";
import { GroupDashboard } from "./Components/GroupDashboard";
import { UserProvider } from "./Context/CurrentUserIdContext";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <>
      <div>
        <UserProvider>
          <GroupProvider>
            <Router>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/dashboard" element={<GroupDashboard />} />
              </Routes>
            </Router>
          </GroupProvider>
        </UserProvider>
      </div>
    </>
  );
}

export default App;
