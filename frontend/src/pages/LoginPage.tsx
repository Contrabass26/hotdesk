import {useRef} from "react";
import {api} from "../services/api.ts";
import {useUser} from "../contexts/UserContext.tsx";
import {Navigate, useNavigate} from "react-router-dom";

export function LoginPage() {

    const {currentUser, setCurrentUser} = useUser();
    const navigate = useNavigate();

    const emailElement = useRef<HTMLInputElement>(null);
    const passwordElement = useRef<HTMLInputElement>(null);

    if (currentUser) {
        return <Navigate to="/book" replace />;
    }

    const handleLogin = () => {
        const email = emailElement.current?.value;
        const password = passwordElement.current?.value;

        if (email && password) {
            api.login({
                email,
                password
            }).then(response => {
                setCurrentUser(response.user);
                navigate("/book");
            });
        }
    };

    return (
        <main>
            {!currentUser && (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                    <h1 className="text-4xl font-bold mb-4">Hot Desk Booking System</h1>
                    <div className="flex flex-col">
                        <input type="text" placeholder="Email" ref={emailElement} className="border p-2 mb-2 rounded-md"/>
                        <input type="password" placeholder="Password" ref={passwordElement} className="border p-2 mb-2 rounded-md"/>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white p-2 rounded-md"
                            onClick={handleLogin}
                        >
                            Login
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}