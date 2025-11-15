import { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // ✅ Decode token to get role
  useEffect(() => {
    if (authToken) {
      try {
        const decoded = jwtDecode(authToken);
        setUserRole(decoded.role || 'cliente');
        setUser(decoded);
      } catch (error) {
        console.error("Token inválido:", error);
        logout();
      }
    } else {
      setUserRole(null);
      setUser(null);
    }
  }, [authToken]);

  const login = (token, userData) => {
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setUserRole(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ authToken, user, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);