import { create } from 'zustand';

// Função auxiliar para inicializar o estado a partir do localStorage
const getInitialState = () => {
    try {
        const userData = localStorage.getItem('user_data');
        const userRole = localStorage.getItem('user_role');
        
        if (userData && userRole) {
            return {
                user: JSON.parse(userData),
                role: userRole,
                isAuthenticated: true
            };
        }
    } catch (error) {
        console.error("Erro ao ler dados da sessão do LocalStorage:", error);
    }
    
    return {
        user: null,
        role: null,
        isAuthenticated: false
    };
};

export const useAuthStore = create((set) => ({
    ...getInitialState(),

    login: (userData, role) => {
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('user_role', role);
        set({ user: userData, role: role, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_role');
        localStorage.removeItem('medical_token'); // Limpeza de resíduos caso exista
        set({ user: null, role: null, isAuthenticated: false });
    },
    
    // Opcional: Atualizar apenas o usuário sem deslogar
    updateUser: (newUserData) => {
        set((state) => {
            const updatedUser = { ...state.user, ...newUserData };
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
            return { user: updatedUser };
        });
    }
}));
