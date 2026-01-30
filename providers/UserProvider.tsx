"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
    id: string;
    name: string;
    image: string;
}

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check localStorage for existing user
        const savedUser = localStorage.getItem("homeguru_user");
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        } else {
            // Generate a random guest user if none exists
            const id = `guest-${Math.floor(Math.random() * 1000000)}`;
            const newUser = {
                id,
                name: `Guest ${id.split("-")[1]}`,
                image: `https://getstream.io/random_png/?id=${id}&name=Guest`,
            };

            setUser(newUser);
            localStorage.setItem("homeguru_user", JSON.stringify(newUser));
        }

        setIsLoading(false);
    }, []);

    const updateUser = (newUser: User) => {
        setUser(newUser);
        localStorage.setItem("homeguru_user", JSON.stringify(newUser));
    };

    return (
        <UserContext.Provider value={{ user, isLoading, setUser: updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
