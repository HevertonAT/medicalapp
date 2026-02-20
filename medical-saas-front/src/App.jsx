import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Agenda from './pages/Agenda';
import Financial from './pages/Financial';
import SpecialtySettings from './pages/SpecialtySettings';
import SidebarLayout from './components/SidebarLayout';
import DevTools from './pages/DevTools';
import PatientArea from './pages/PatientArea';
import MeusExames from './pages/MeusExames';
import ProfessionalProfile from './pages/ProfessionalProfile';

export default function App() {
  return (
<Routes>
      <Route path="/" element={<Login />} />

      {/* Rotas com Menu Lateral */}
      <Route element={<SidebarLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/specialties" element={<SpecialtySettings />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/financial" element={<Financial />} />
        <Route path="/dev-tools" element={<DevTools />} />
        
        {/* Rota do Paciente */}
        <Route path="/minha-saude" element={<PatientArea />} />
        <Route path="/meus-exames" element={<MeusExames />} />
        {/* Rota do Médico para Configurar Agenda */}
        <Route path="/minha-agenda" element={<ProfessionalProfile />} />
      </Route>
    </Routes>
  );
}