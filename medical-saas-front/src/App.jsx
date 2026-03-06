import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Agenda from './pages/Agenda';
import Financial from './pages/Financeiro';
import SpecialtySettings from './pages/SpecialtySettings';
import SidebarLayout from './components/SidebarLayout';
import DevTools from './pages/DevTools';
import PatientArea from './pages/PatientArea';
import MeusExames from './pages/MeusExames';
import ProfessionalProfile from './pages/ProfessionalProfile';
import ClinicsManage from './pages/ClinicsManage';
import ContasPagarReceber from './pages/ContasPagarReceber';
import PainelSaaS from './pages/PainelSaaS';
import Team from './pages/Team';

// IMPORTAÇÃO DO NOSSO GUARDA-COSTAS DE SEGURANÇA
import PrivateRoute from './components/PrivateRoute'; 

export default function App() {
  return (
    <Routes>
      {/* --- ROTAS PÚBLICAS (LIVRES) --- */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* --- ROTAS PRIVADAS (PROTEGIDAS) --- */}
      {/* O SidebarLayout já cria o menu em volta das telas abaixo */}
      <Route element={<SidebarLayout />}>
        
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/patients" element={<PrivateRoute><Patients /></PrivateRoute>} />
        <Route path="/doctors" element={<PrivateRoute><Doctors /></PrivateRoute>} />
        <Route path="/specialties" element={<PrivateRoute><SpecialtySettings /></PrivateRoute>} />
        <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
        <Route path="/financial" element={<PrivateRoute><Financial /></PrivateRoute>} />
        <Route path="/dev-tools" element={<PrivateRoute><DevTools /></PrivateRoute>} />
        <Route path="/clinicas" element={<PrivateRoute><ClinicsManage/></PrivateRoute>} />
        <Route path="/equipe" element={<PrivateRoute><Team /></PrivateRoute>} />
        <Route path="/contas" element={<PrivateRoute><ContasPagarReceber /></PrivateRoute>} />
        <Route path="/saas" element={<PrivateRoute><PainelSaaS /></PrivateRoute>} />
        
        {/* Rota Exclusiva do Paciente */}
        <Route path="/minha-saude" element={<PrivateRoute><PatientArea /></PrivateRoute>} />
        <Route path="/meus-exames" element={<PrivateRoute><MeusExames /></PrivateRoute>} />
        
        {/* Rota do Médico para Configurar Agenda */}
        <Route path="/minha-agenda" element={<PrivateRoute><ProfessionalProfile /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}