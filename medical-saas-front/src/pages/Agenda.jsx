import { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Flex, Heading, Text, useToast, Spinner,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select, ModalFooter, useDisclosure,
  VStack, HStack, IconButton, Icon, Textarea, Accordion, AccordionItem, 
  AccordionButton, AccordionPanel, AccordionIcon, useColorModeValue, 
  Table, Thead, Tbody, Tr, Th, Td, InputGroup, InputLeftElement,
  SimpleGrid, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { 
  FaPlus, FaUserMd, FaSearch, FaPlay, FaCheckDouble, 
  FaTimes, FaStethoscope, FaPrescriptionBottleAlt, FaRedo, 
  FaCalendarAlt, FaHistory, FaBolt, FaPrint, FaBuilding
} from 'react-icons/fa';
import React from 'react'; 
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; 

// --- IMPORTAÇÕES DO CALENDÁRIO ---
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ptBR from 'date-fns/locale/pt-BR';

import api from '../services/api';
import SpecialtyFormRenderer from '../components/SpecialtyFormRenderer';
import CidAutocomplete from '../components/profissionais/CidAutocomplete';

registerLocale('pt-BR', ptBR);

export default function Agenda() {
  const dataLimiteObj = new Date();
  // Limita o agendamento para no máximo 4 anos a partir de hoje
  dataLimiteObj.setFullYear(dataLimiteObj.getFullYear() + 4);

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [currentUserRole, setCurrentUserRole] = useState('');
  const [loggedUser, setLoggedUser] = useState(null); 
  
  // --- ESTADOS DO SUPERUSER ---
  const [allClinics, setAllClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");

  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);

  const { isOpen, onOpen, onClose } = useDisclosure(); 
  const { isOpen: isConsultOpen, onOpen: onConsultOpen, onClose: onConsultClose } = useDisclosure(); 
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const { isOpen: isRescheduleOpen, onOpen: onRescheduleOpen, onClose: onRescheduleClose } = useDisclosure();
  const { isOpen: isPrintModalOpen, onOpen: onPrintModalOpen, onClose: onPrintModalClose } = useDisclosure();

  const toast = useToast();
  const navigate = useNavigate();

  const [newApp, setNewApp] = useState({ 
    doctor_id: '', patient_id: '', data: '', hora: '', duracao: '40', observacoes: '' 
  });

  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({ data: '', hora: '' });
  
  const [consultData, setConsultData] = useState({ anamnese: '', prescricao: '', exame_fisico: '', diagnostico_cid: '' });
  const [specialtySettings, setSpecialtySettings] = useState({});
  const [specialtyData, setSpecialtyData] = useState({});
  const [currentDocSpecialty, setCurrentDocSpecialty] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [minhasMacros, setMinhasMacros] = useState([]); 
  
  const [lastSavedRecord, setLastSavedRecord] = useState(null);

  const bgPage = useColorModeValue('gray.50', 'gray.900');
  const bgCard = useColorModeValue('white', 'gray.800');
  const modalBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const headingColor = useColorModeValue('blue.600', 'blue.300');
  const tabBg = useColorModeValue('blue.50', 'gray.900');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverTr = useColorModeValue('gray.50', 'gray.700');
  
  const patientNameColor = useColorModeValue('gray.700', 'white');
  const accordionExpandedBg = useColorModeValue('blue.50', 'gray.700');
  const menuItemHoverBg = useColorModeValue('gray.100', 'gray.600');

  const statusGreen = useColorModeValue('green.600', 'green.300');
  const statusRed = useColorModeValue('red.600', 'red.300');
  const statusOrange = useColorModeValue('orange.500', 'orange.300');
  const statusCyan = useColorModeValue('cyan.600', 'cyan.300');
  const statusBlue = useColorModeValue('blue.600', 'blue.300');

  // --- MÁGICA DO MODO ESCURO PARA O CALENDÁRIO ---
  const hoverDayBg = useColorModeValue('gray.200', 'gray.600');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.500');
  
  const datePickerStyles = {
    '.react-datepicker-wrapper': { width: '100%' },
    '.react-datepicker': {
      backgroundColor: bgCard,
      borderColor: borderColor,
      fontFamily: 'inherit',
      boxShadow: 'md',
    },
    '.react-datepicker__header': {
      backgroundColor: inputBg,
      borderColor: borderColor,
    },
    '.react-datepicker__current-month, .react-datepicker__day-name': {
      color: textColor,
    },
    '.react-datepicker__day': {
      color: textColor,
      '&:hover': {
        backgroundColor: hoverDayBg,
      },
    },
    '.react-datepicker__day--disabled': {
      color: mutedTextColor,
      '&:hover': { backgroundColor: 'transparent' }
    },
    '.react-datepicker__day--selected, .react-datepicker__day--keyboard-selected': {
      backgroundColor: 'blue.500',
      color: 'white',
      '&:hover': { backgroundColor: 'blue.600' }
    },
    '.react-datepicker__triangle': {
      display: 'none'
    }
  };

  // --- FUNÇÕES DO CALENDÁRIO (CÃO DE GUARDA) ---
  const isWeekdayValid = (date, docId) => {
    if (!docId || !date) return false; 
    const day = date.getDay(); 
    const dayMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
    const doc = doctors.find(d => String(d.id) === String(docId));

    if (!doc || !doc.agenda_config) return true; 

    try {
      let config = doc.agenda_config;
      if (typeof config === 'string') {
        config = JSON.parse(config);
      }
      const dayConfig = config[dayMap[day]];
      return dayConfig && (dayConfig.ativo === true || String(dayConfig.ativo) === "true");
    } catch (error) {
      return true; 
    }
  };

  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    const [y, m, d] = dateString.split('-');
    return new Date(y, m - 1, d);
  };

  // --- TRAVA DE ANO MÁXIMO PARA OS FILTROS NATIVOS ---
  const maxYear = new Date().getFullYear() + 4;
  const maxDateLimit = `${maxYear}-12-31`;

  const enforceDateLimit = (dateString) => {
      if (!dateString) return dateString;
      const partes = dateString.split('-');
      if (partes[0].length > 4) partes[0] = partes[0].slice(0, 4);
      if (parseInt(partes[0]) > maxYear) partes[0] = maxYear.toString();
      return partes.join('-');
  };

  const getStatusColor = (status) => {
    switch (status) {
        case 'concluido': case 'REALIZADO': return statusGreen;
        case 'cancelado': return statusRed;
        case 'em_andamento': return statusOrange;
        case 'reagendado': return statusCyan;
        default: return statusBlue;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [appRes, docRes, patRes] = await Promise.all([
        api.get('/appointments/'),
        api.get('/doctors/'),
        api.get('/patients/')
      ]);
      setAppointments(appRes.data);
      setDoctors(docRes.data);
      setPatients(patRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('medical_token');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            setLoggedUser(decoded);
            const role = decoded.role || localStorage.getItem('user_role');
            setCurrentUserRole(role);
            
            if (role === 'superuser') {
                api.get('/clinics/').then(res => setAllClinics(Array.isArray(res.data) ? res.data : []));
            } else {
                setSelectedClinicId(decoded.clinic_id);
            }
            
            // CORREÇÃO 1: Adicionado o 'admin' para ele também puxar o perfil de médico, se houver.
            if (role === 'doctor' || role === 'medico' || role === 'admin') {
                api.get('/doctors/me').then(res => {
                    if (res.data && res.data.id) {
                        setNewApp(prev => ({...prev, doctor_id: res.data.id}));
                        setLoggedUser(prev => ({...prev, doctor_id: res.data.id})); 
                    }
                }).catch(e => console.log("Usuário não tem perfil de médico vinculado."));
            }
        } catch(e) { console.error("Erro ao ler token", e); }
    }
    fetchData(); 
  }, [fetchData]);

  useEffect(() => {
      if (newApp.doctor_id && newApp.data) {
          api.get(`/appointments/available-slots?doctor_id=${newApp.doctor_id}&data=${newApp.data}`)
              .then(res => setAvailableSlots(res.data))
              .catch(e => setAvailableSlots([]));
      } else {
          setAvailableSlots([]);
      }
  }, [newApp.doctor_id, newApp.data]);

  useEffect(() => {
      if (currentAppointment && rescheduleData.data) {
          api.get(`/appointments/available-slots?doctor_id=${currentAppointment.doctor_id}&data=${rescheduleData.data}`)
              .then(res => setRescheduleSlots(res.data))
              .catch(e => setRescheduleSlots([]));
      } else {
          setRescheduleSlots([]);
      }
  }, [currentAppointment, rescheduleData.data]);

  const calculateAge = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.data_nascimento) return '-';
    const today = new Date();
    const birthDate = new Date(patient.data_nascimento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age + ' anos';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')}, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const resetNewAppForm = () => {
      setNewApp(prev => ({ 
          doctor_id: (currentUserRole === 'doctor' || currentUserRole === 'medico') ? prev.doctor_id : '', 
          patient_id: '', data: '', hora: '', duracao: '40', observacoes: '' 
      }));
  };

  const handleCreate = async () => {
    if (!newApp.doctor_id || !newApp.patient_id || !newApp.data || !newApp.hora) {
        toast({ title: 'Preencha todos os campos obrigatórios!', status: 'warning' });
        return;
    }
    try {
      const dataHorario = `${newApp.data}T${newApp.hora}:00`;
      await api.post('/appointments/', {
        doctor_id: newApp.doctor_id,
        patient_id: newApp.patient_id,
        data_horario: dataHorario,
        duracao: parseInt(newApp.duracao),
        observacoes: newApp.observacoes
      });
      toast({ title: 'Agendamento criado!', status: 'success' });
      onClose();
      resetNewAppForm();
      fetchData();
    } catch (error) { toast({ title: 'Erro ao agendar.', status: 'error' }); }
  };

  const handleStartConsultation = async (app) => {
    setCurrentAppointment(app);
    setStartTime(new Date()); 
    setLastSavedRecord(null); 
    
    try {
      if (app.status === 'agendado' || app.status === 'AGENDADO') {
          await api.patch(`/appointments/${app.id}/status?novo_status=em_andamento`);
          fetchData();
      }
      
      setConsultData({ anamnese: '', prescricao: '', exame_fisico: '', diagnostico_cid: '' });
      setSpecialtyData({});
      
      const doc = doctors.find(d => String(d.id) === String(app.doctor_id));
      let spec = doc?.especialidade || app.doctor?.especialidade || app.doctor_especialidade || "Clínico Geral";
      if (spec) spec = spec.charAt(0).toUpperCase() + spec.slice(1);
      setCurrentDocSpecialty(spec);

      try {
        const macrosRes = await api.get('/macros/');
        setMinhasMacros(macrosRes.data || []);
      } catch (e) { console.error("Erro ao buscar macros", e); }

      try {
        const rulesRes = await api.get(`/specialties/rules/${spec}`);
        setSpecialtySettings(rulesRes.data || {});
      } catch (e) { setSpecialtySettings({}); }

      onConsultOpen();
    } catch (error) {
      toast({ title: 'Erro ao iniciar atendimento.', status: 'error' });
    }
  };

  const handleFinishConsultation = async () => {
    if (!consultData.anamnese && Object.keys(specialtyData).length === 0 && !consultData.prescricao) {
        toast({ title: 'Preencha algum dado antes de finalizar.', status: 'warning' });
        return;
    }

    try {
        const endTime = new Date(); 
        const response = await api.post('/medical-records/', {
            appointment_id: currentAppointment.id,
            patient_id: currentAppointment.patient_id,
            anamnese: consultData.anamnese,
            prescricao: consultData.prescricao,
            exame_fisico: consultData.exame_fisico,
            diagnostico_cid: consultData.diagnostico_cid,
            specialty_data: specialtyData, 
            data_inicio: startTime,
            data_fim: endTime
        });

        setLastSavedRecord(response.data);
        toast({ title: 'Atendimento finalizado com sucesso! ✅', status: 'success' });
        onConsultClose();
        fetchData();
        onPrintModalOpen();

    } catch (error) {
        const errorMsg = error.response?.data?.detail || 'Erro ao finalizar atendimento.';
        toast({ title: 'Erro ao finalizar.', description: errorMsg, status: 'error' });
    }
  };

  const formatDoctorInfo = (name, specialtyArea, gender) => {
    const isMale = gender === 'Masculino' || gender === 'M' || gender === 'masculino' || gender === 'm';
    const isFemale = gender === 'Feminino' || gender === 'F' || gender === 'feminino' || gender === 'f';
    const prefix = isMale ? "Dr." : isFemale ? "Dra." : "Dr(a).";
    let title = specialtyArea || "Clínico Geral";
    const area = title.toLowerCase().trim();

    const genderMap = {
        'fonoaudiologia': { m: 'Fonoaudiólogo', f: 'Fonoaudióloga', d: 'Fonoaudiólogo(a)' },
        'nutrologia': { m: 'Nutrólogo', f: 'Nutróloga', d: 'Nutrólogo(a)' },
        'psicologia': { m: 'Psicólogo', f: 'Psicóloga', d: 'Psicólogo(a)' },
        'clínico geral': { m: 'Clínico Geral', f: 'Clínica Geral', d: 'Clínico(a) Geral' },
        'clínica médica': { m: 'Clínico Geral', f: 'Clínica Geral', d: 'Clínico(a) Geral' },
        'fisioterapia': { m: 'Fisioterapeuta', f: 'Fisioterapeuta', d: 'Fisioterapeuta' },
        'nutrição': { m: 'Nutricionista', f: 'Nutricionista', d: 'Nutricionista' },
        'enfermagem': { m: 'Enfermeiro', f: 'Enfermeira', d: 'Enfermeiro(a)' },
        'biomedicina': { m: 'Biomédico', f: 'Biomédica', d: 'Biomédico(a)' },
        'odontologia': { m: 'Dentista', f: 'Dentista', d: 'Dentista' }
    };

    if (genderMap[area]) {
        title = isMale ? genderMap[area].m : isFemale ? genderMap[area].f : genderMap[area].d;
    } else {
        if (area.endsWith('logia')) title = title.replace(/logia$/i, 'logista');
        else if (area.endsWith('iatria') && area !== 'pediatria') title = title.replace(/iatria$/i, 'iatra');
        else if (area === 'pediatria') title = 'Pediatra';
        else if (area === 'ortopedia') title = 'Ortopedista';
    }

    title = title.charAt(0).toUpperCase() + title.slice(1);
    return { prefix, title, fullName: `${prefix} ${name}` };
  };

  const handlePrintRecord = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast({ title: "Pop-up bloqueado", description: "Permita os pop-ups neste site para poder imprimir.", status: "warning" });
        return;
    }

    const doc = doctors.find(d => String(d.id) === String(currentAppointment?.doctor_id));
    const docReg = doc?.conselho_regional || doc?.numero_conselho || doc?.registro_conselho || doc?.documento || doc?.conselho || "CR não informado";
    const docInfo = formatDoctorInfo(currentAppointment?.doctor_nome, doc?.especialidade, doc?.genero);
    
    const patientAge = calculateAge(currentAppointment?.patient_id);
    const recordIdFormatted = lastSavedRecord?.id ? String(lastSavedRecord.id).padStart(9, '0') : Math.floor(Math.random() * 1000000).toString().padStart(9, '0');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Evolução - ${currentAppointment?.patient_nome}</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                .header-container { border: 1px solid #ccc; padding: 15px; margin-bottom: 25px; border-radius: 5px; font-size: 14px; background-color: #fff;}
                .header-title { text-align: center; font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; background-color: #e2e8f0; padding: 8px; border: 1px solid #cbd5e0; color: #2d3748; letter-spacing: 2px;}
                .info-row { margin-bottom: 5px; }
                .section { margin-bottom: 25px; page-break-inside: avoid; border: 1px solid #e2e8f0; padding: 15px; border-radius: 5px;}
                .title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #4a5568;}
                .content { white-space: pre-wrap; font-size: 14px; }
                
                .signature-box { margin-top: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-inside: avoid; }
                .signature-line { border-top: 1px solid #000; width: 350px; margin-bottom: 5px; }
                .signature-text { margin: 2px 0; font-size: 14px; }
                .signature-name { font-weight: bold; font-size: 15px; text-transform: uppercase;}
                
                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header-container">
                <div class="info-row"><strong>Prontuário/Paciente:</strong> ${currentAppointment?.patient_nome || 'Não informado'} ${patientAge !== '-' ? `(${patientAge})` : ''}</div>
                <div class="info-row"><strong>Registro de Atendimento:</strong> ${recordIdFormatted} - ${new Date().toLocaleString('pt-BR')}</div>
                <div class="info-row"><strong>Profissional:</strong> ${docInfo.fullName}</div>
            </div>

            <div class="header-title">Evolução Clínica</div>

            ${consultData.diagnostico_cid ? `
            <div class="section">
                <div class="title">Diagnóstico (CID-10)</div>
                <div class="content">${consultData.diagnostico_cid}</div>
            </div>` : ''}

            ${consultData.prescricao ? `
            <div class="section">
                <div class="title">Prescrição e Exames</div>
                <div class="content">${consultData.prescricao}</div>
            </div>` : ''}

            ${consultData.anamnese ? `
            <div class="section">
                <div class="title">Descrição da Evolução</div>
                <div class="content">${consultData.anamnese}</div>
            </div>` : ''}

            <div class="signature-box">
                <div class="signature-line"></div>
                <p class="signature-text signature-name">${docInfo.fullName}</p>
                <p class="signature-text">${docInfo.title}</p>
                <p class="signature-text">${docReg}</p>
            </div>

            <div class="footer">Gerado de forma segura por MedicalSaaS</div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 250);
    onPrintModalClose();
  };

  const openCancelModal = (app) => { setCurrentAppointment(app); setActionReason(''); onCancelOpen(); };
  
  const handleConfirmCancel = async () => {
    if (!actionReason) { toast({ title: 'Informe o motivo.', status: 'warning' }); return; }
    try {
        await api.patch(`/appointments/${currentAppointment.id}/status?novo_status=cancelado`);
        toast({ title: 'Cancelado.', status: 'warning' });
        onCancelClose();
        fetchData();
    } catch (error) { toast({ title: 'Erro ao cancelar', status: 'error' }); }
  };

  const openRescheduleModal = (app) => {
      setCurrentAppointment(app);
      setActionReason('');
      const currentIso = app.data_horario.split('T');
      setRescheduleData({ data: currentIso[0], hora: '' });
      onRescheduleOpen();
  };

  const handleConfirmReschedule = async () => {
      if(!rescheduleData.data || !rescheduleData.hora || !actionReason) { toast({ title: 'Preencha campos.', status: 'warning' }); return; }
      try {
        await api.patch(`/appointments/${currentAppointment.id}/reschedule`, {
            data_horario: `${rescheduleData.data}T${rescheduleData.hora}:00`,
            motivo: actionReason
        });
        toast({ title: 'Reagendado!', status: 'success' });
        onRescheduleClose();
        fetchData(); 
      } catch (error) { toast({ title: 'Erro ao reagendar.', status: 'error' }); }
  };

  const filteredAppointments = appointments.filter(app => {
      if (currentUserRole === 'superuser') {
          if (!selectedClinicId) return false;
          const doc = doctors.find(d => String(d.id) === String(app.doctor_id));
          const appClinicId = String(app.clinic_id || doc?.clinic_id || doc?.clinica_id);
          if (appClinicId !== String(selectedClinicId)) return false;
      } else if (loggedUser) {
          if (currentUserRole === 'doctor' || currentUserRole === 'medico') {
              if (String(app.doctor_id) !== String(loggedUser.doctor_id)) return false;
          } else {
              const doc = doctors.find(d => String(d.id) === String(app.doctor_id));
              if (String(app.clinic_id) !== String(loggedUser.clinic_id) && String(doc?.clinic_id) !== String(loggedUser.clinic_id)) {
                  return false;
              }
          }
      }

      const searchLower = searchTerm.toLowerCase();
      const patient = patients.find(p => p.id === app.patient_id) || {};
      
      const patientName = (app.patient_nome || patient.nome_completo || "").toLowerCase();
      const patientCpf = (patient.cpf || "").toLowerCase();
      const doctorName = (app.doctor_nome || "").toLowerCase();

      const matchesSearch = patientName.includes(searchLower) || patientCpf.includes(searchLower) || doctorName.includes(searchLower);
      const matchesDate = (filterDate && searchTerm.trim() === '') ? app.data_horario.split('T')[0] === filterDate : true; 
      
      return matchesSearch && matchesDate;
  });

  const availableDoctors = doctors.filter(d => {
      if (!d.ativo) return false;
      if (currentUserRole === 'superuser') {
          return String(d.clinic_id || d.clinica_id) === String(selectedClinicId);
      }
      if (currentUserRole === 'doctor' || currentUserRole === 'medico') return String(d.id) === String(loggedUser?.doctor_id);
      return String(d.clinic_id) === String(loggedUser?.clinic_id);
  });

  const availablePatients = patients.filter(p => {
      if (!p.ativo) return false;
      if (currentUserRole === 'superuser') {
          return String(p.clinic_id || p.clinica_id) === String(selectedClinicId);
      }
      return String(p.clinic_id) === String(loggedUser?.clinic_id);
  });

  return (
    <Box p={8} bg={bgPage} minH="100vh">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={headingColor}>Agenda</Heading>
        <Button 
            leftIcon={<FaPlus />} 
            colorScheme="blue" 
            size="sm" 
            onClick={() => {
                if(currentUserRole === 'superuser' && !selectedClinicId) {
                    toast({ title: "Selecione um cliente primeiro!", status: "warning" });
                    return;
                }
                onOpen();
            }}
        >
            Agendar
        </Button>
      </Flex>

      {/* SELETOR SUPERUSER NO TOPO */}
      {currentUserRole === 'superuser' && (
          <Box bg={bgCard} borderColor={borderColor} borderWidth={1} borderRadius="md" p={4} mb={6} shadow="sm">
              <HStack spacing={4}>
                  <Icon as={FaBuilding} color="blue.500" w={5} h={5} />
                  <Text fontWeight="bold" color={textColor}>Selecionar Clinica:</Text>
                  <Select 
                      maxW="400px" 
                      bg={inputBg} 
                      borderColor={borderColor}
                      placeholder="Escolha uma clínica para ver a agenda..."
                      value={selectedClinicId}
                      onChange={(e) => setSelectedClinicId(e.target.value)}
                  >
                      {allClinics.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                  </Select>
              </HStack>
          </Box>
      )}

      <Flex gap={4} mb={6} direction={{ base: 'column', md: 'row' }}>
        <InputGroup maxW={{ base: '100%', md: '400px' }}>
            <InputLeftElement pointerEvents="none" children={<FaSearch color="gray.300" />} />
            <Input bg={bgCard} border="1px solid" borderColor={borderColor} placeholder="Buscar paciente, CPF ou médico..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </InputGroup>
        <InputGroup maxW={{ base: '100%', md: '200px' }}>
             <InputLeftElement pointerEvents="none" children={<FaCalendarAlt color="gray.300" />} />
             <Input 
                type="date" 
                max={maxDateLimit} 
                bg={bgCard} 
                border="1px solid" 
                borderColor={borderColor} 
                value={filterDate} 
                onChange={(e) => setFilterDate(enforceDateLimit(e.target.value))} 
             />
        </InputGroup>
      </Flex>

      {loading ? <Spinner size="xl" color="blue.500" /> : (
        <Box bg={bgCard} shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor={borderColor}>
            <Table variant="simple" size="sm">
                <Thead bg={headerBg}><Tr>
                    <Th color={textColor}>Paciente</Th><Th color={textColor}>Idade</Th><Th color={textColor}>Data / Hora</Th><Th color={textColor}>Profissional</Th><Th color={textColor}>Observações</Th><Th color={textColor}>Status</Th><Th color={textColor} textAlign="center">Ações</Th>
                </Tr></Thead>
                <Tbody>
                    {filteredAppointments.length === 0 ? (
                        <Tr>
                            <Td colSpan={7} textAlign="center" py={10} color="gray.500">
                                {currentUserRole === 'superuser' && !selectedClinicId 
                                    ? <Flex direction="column" align="center"><Icon as={FaCalendarAlt} w={8} h={8} mb={3} opacity={0.3} /> Selecione uma Clínica para ver a agenda.</Flex>
                                    : 'Nenhum agendamento encontrado.'
                                }
                            </Td>
                        </Tr>
                    ) : filteredAppointments.map((app) => (
                        <Tr key={app.id} _hover={{ bg: hoverTr }}>
                            <Td fontWeight="bold" color={patientNameColor}>{app.patient_nome}</Td>
                            <Td>{calculateAge(app.patient_id)}</Td>
                            <Td fontWeight="medium">{formatDateTime(app.data_horario)}</Td>
                            <Td fontSize="xs">{app.doctor_nome}</Td>
                            <Td maxW="150px" isTruncated>{app.observacoes || '-'}</Td>
                            <Td><Text fontWeight="extrabold" fontSize="xs" color={getStatusColor(app.status)}>{app.status === 'em_andamento' ? 'EM ANDAMENTO' : app.status.toUpperCase()}</Text></Td>
                            <Td><HStack justify="center" spacing={2}>
                                {(app.status === 'agendado' || app.status === 'em_andamento') && (
                                    <>
                                        {app.status === 'agendado' && <IconButton icon={<FaTimes />} size="xs" colorScheme="red" variant="ghost" onClick={() => openCancelModal(app)} />}
                                        {app.status === 'agendado' && <IconButton icon={<FaRedo />} size="xs" colorScheme="blue" variant="ghost" onClick={() => openRescheduleModal(app)} />}
                                        
                                        {/* CORREÇÃO 2: LÓGICA DE PERMISSÃO INTELIGENTE E BLINDADA */}
                                        {(() => {
                                            const docOfApp = doctors.find(d => String(d.id) === String(app.doctor_id));

                                            const userEmail = String(loggedUser?.email || loggedUser?.sub || '').toLowerCase().trim();
                                            const docEmail = String(docOfApp?.email || '').toLowerCase().trim();

                                            const isMyOwnAppointmentByEmail = (userEmail !== '' && docEmail !== '' && userEmail === docEmail);
                                            const isMyOwnAppointmentById = String(app.doctor_id) === String(loggedUser?.doctor_id);

                                            const canStart = currentUserRole === 'superuser' || 
                                                             currentUserRole === 'doctor' || 
                                                             currentUserRole === 'medico' || 
                                                             isMyOwnAppointmentByEmail ||
                                                             isMyOwnAppointmentById;

                                            if (canStart) {
                                                return (
                                                    <Button leftIcon={app.status === 'em_andamento' ? <FaCheckDouble /> : <FaPlay />} size="xs" colorScheme={app.status === 'em_andamento' ? 'green' : 'blue'} onClick={() => handleStartConsultation(app)}>
                                                        {app.status === 'em_andamento' ? 'Retomar' : 'Iniciar'}
                                                    </Button>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </>
                                )}
                                {(app.status === 'concluido' || app.status === 'REALIZADO' || app.status === 'cancelado' || app.status === 'reagendado') && <Icon as={FaHistory} color="gray.300" />}
                            </HStack></Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
      )}

      {/* --- MODAL NOVO AGENDAMENTO --- */}
      <Modal isOpen={isOpen} onClose={() => { onClose(); resetNewAppForm(); }} size="lg">
        <ModalOverlay /><ModalContent bg={modalBg}><ModalHeader>Novo Agendamento</ModalHeader><ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
                <FormLabel>Profissional</FormLabel>
                <Select 
                    bg={inputBg} size="sm" placeholder="Selecione o profissional..." 
                    value={newApp.doctor_id} 
                    onChange={(e) => setNewApp({...newApp, doctor_id: e.target.value, hora: ''})}
                    isDisabled={currentUserRole === 'doctor' || currentUserRole === 'medico'}
                >
                    {availableDoctors.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </Select>
            </FormControl>

            <FormControl mb={4}>
                <FormLabel>Paciente</FormLabel>
                <Select bg={inputBg} size="sm" placeholder="Selecione o paciente..." value={newApp.patient_id} onChange={(e) => setNewApp({...newApp, patient_id: e.target.value})}>
                    {availablePatients.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                </Select>
            </FormControl>

            <SimpleGrid columns={2} spacing={4} mb={4}>
                <FormControl>
                    <FormLabel>Data</FormLabel>
                    <Box sx={datePickerStyles}>
                        <DatePicker
                            locale="pt-BR"
                            dateFormat="dd/MM/yyyy"
                            selected={parseLocalDate(newApp.data)}
                            onChange={(date) => {
                                if (date && !isWeekdayValid(date, newApp.doctor_id)) {
                                    toast({ title: 'Profissional não atende neste dia.', status: 'warning' });
                                    return;
                                }
                                setNewApp({ ...newApp, data: formatLocalDate(date), hora: '' });
                                setAvailableSlots([]);
                            }}
                            filterDate={(date) => isWeekdayValid(date, newApp.doctor_id)}
                            minDate={new Date()}
                            maxDate={dataLimiteObj}
                            disabled={!newApp.doctor_id}
                            placeholderText={newApp.doctor_id ? "Escolha a data" : "Escolha o profissional"}
                            customInput={
                                <Input 
                                    bg={inputBg} size="sm" borderColor={borderColor} color={textColor}
                                />
                            }
                        />
                    </Box>
                </FormControl>
                
                <FormControl>
                    <FormLabel>Horários</FormLabel>
                    <Select 
                        bg={inputBg} size="sm" 
                        placeholder={availableSlots.length > 0 ? "Selecione o horário" : "Selecione a Data"} 
                        value={newApp.hora} 
                        onChange={(e) => setNewApp({...newApp, hora: e.target.value})}
                        isDisabled={availableSlots.length === 0}
                    >
                        {availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                    </Select>
                </FormControl>
            </SimpleGrid>

            <FormControl><FormLabel>Observação</FormLabel><Input bg={inputBg} size="sm" value={newApp.observacoes} onChange={(e) => setNewApp({...newApp, observacoes: e.target.value})} /></FormControl>
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" size="sm" mr={3} onClick={handleCreate}>Agendar</Button><Button size="sm" onClick={() => { onClose(); resetNewAppForm(); }}>Cancelar</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCancelOpen} onClose={onCancelClose}><ModalOverlay /><ModalContent bg={modalBg}><ModalHeader>Cancelar</ModalHeader><ModalBody><Textarea bg={inputBg} value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Motivo..." /></ModalBody><ModalFooter><Button colorScheme="red" mr={3} onClick={handleConfirmCancel}>Confirmar</Button></ModalFooter></ModalContent></Modal>
      
      {/* --- MODAL REAGENDAR --- */}
      <Modal isOpen={isRescheduleOpen} onClose={onRescheduleClose}>
          <ModalOverlay /><ModalContent bg={modalBg}><ModalHeader>Reagendar</ModalHeader>
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <FormControl>
                  <FormLabel>Nova Data</FormLabel>
                  <Box sx={datePickerStyles}>
                      <DatePicker
                          locale="pt-BR"
                          dateFormat="dd/MM/yyyy"
                          selected={parseLocalDate(rescheduleData.data)}
                          onChange={(date) => {
                              if (date && !isWeekdayValid(date, currentAppointment?.doctor_id)) {
                                  toast({ title: 'Profissional não atende neste dia.', status: 'warning' });
                                  return;
                              }
                              setRescheduleData({...rescheduleData, data: formatLocalDate(date), hora: ''});
                              setRescheduleSlots([]);
                          }}
                          filterDate={(date) => isWeekdayValid(date, currentAppointment?.doctor_id)}
                          minDate={new Date()}
                          maxDate={dataLimiteObj}
                          placeholderText="Selecione ou digite"
                          customInput={
                              <Input 
                                  bg={inputBg} borderColor={borderColor} color={textColor}
                              />
                          }
                      />
                  </Box>
              </FormControl>
              <FormControl>
                  <FormLabel>Novo Horário</FormLabel>
                  <Select 
                      bg={inputBg} 
                      value={rescheduleData.hora} 
                      onChange={(e) => setRescheduleData({...rescheduleData, hora: e.target.value})}
                      isDisabled={rescheduleSlots.length === 0}
                      placeholder={rescheduleSlots.length > 0 ? "Selecione o horário" : "Selecione a data primeiro"}
                  >
                      {rescheduleSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </Select>
              </FormControl>
              <FormControl><FormLabel>Motivo</FormLabel><Textarea bg={inputBg} value={actionReason} onChange={(e) => setActionReason(e.target.value)} /></FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" mr={3} onClick={handleConfirmReschedule}>Confirmar</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isPrintModalOpen} onClose={onPrintModalClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader color="green.500" display="flex" alignItems="center" gap={2}>
             <Icon as={FaCheckDouble} /> Salvo com Sucesso!
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color={textColor}>O prontuário do paciente <strong>{currentAppointment?.patient_nome}</strong> foi salvo com sucesso.</Text>
            <Text color={textColor} mt={4} fontWeight="bold">Deseja imprimir o receituário ?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="sm" mr={3} onClick={onPrintModalClose}>Agora não</Button>
            <Button colorScheme="blue" size="sm" leftIcon={<FaPrint />} onClick={handlePrintRecord}>Imprimir Documento</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isConsultOpen} onClose={onConsultClose} size="5xl" closeOnOverlayClick={false} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent h="90vh" bg={modalBg} display="flex" flexDirection="column">
          <ModalHeader bg={headerBg} borderBottom="1px solid" borderColor={borderColor}>
            <Flex justify="space-between" align="center">
                <Flex align="center" gap={2}>
                    <Icon as={FaStethoscope} color="blue.500" />
                    <Text>Atendimento: {currentAppointment?.patient_nome}</Text>
                </Flex>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6} overflowY="auto">
            <Accordion allowMultiple defaultIndex={[0]} w="100%">
                <AccordionItem border="1px solid" borderColor={borderColor} borderRadius="md" mb={4} bg={bgCard}>
                    <AccordionButton _expanded={{ bg: accordionExpandedBg }} borderRadius="md" py={3}>
                        <Box flex="1" textAlign="left" fontWeight="bold" color={textColor} display="flex" alignItems="center">
                            <Icon as={FaUserMd} mr={3} color="blue.500" /> Anamnese e Avaliação Específica
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={6} pt={4}>
                        <SpecialtyFormRenderer 
                            specialty={currentDocSpecialty} 
                            settings={specialtySettings} 
                            data={specialtyData} 
                            onChange={setSpecialtyData} 
                        />

                        <FormControl mt={6} display="flex" flexDirection="column">
                          <Flex justify="space-between" align="center" mb={2}>
                            <FormLabel color={textColor} mb={0} fontWeight="bold">Evolução / Observações Livres:</FormLabel>
                            {minhasMacros.length > 0 && (
                              <Menu>
                                <MenuButton as={Button} size="xs" colorScheme="blue.700" variant="solid" leftIcon={<FaBolt />}>
                                  Inserir Atalho
                                </MenuButton>
                                <MenuList bg={bgCard} borderColor={borderColor}>
                                  {minhasMacros.map(macro => (
                                    <MenuItem 
                                      key={macro.id} 
                                      bg={bgCard} 
                                      _hover={{ bg: menuItemHoverBg }}
                                      onClick={() => {
                                        const textoAtual = consultData.anamnese;
                                        const novoTexto = textoAtual ? `${textoAtual}\n\n${macro.texto_padrao}` : macro.texto_padrao;
                                        setConsultData({...consultData, anamnese: novoTexto});
                                      }}
                                    >
                                      <Text fontWeight="bold" fontSize="sm">{macro.titulo}</Text>
                                    </MenuItem>
                                  ))}
                                </MenuList>
                              </Menu>
                            )}
                          </Flex>
                          <Textarea 
                              size="sm" 
                              minH="250px"
                              value={consultData.anamnese} 
                              onChange={(e) => setConsultData({...consultData, anamnese: e.target.value})} 
                              bg={tabBg} 
                              borderColor={borderColor} 
                              placeholder="Evolução, observações adicionais..."
                              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                          />
                        </FormControl>
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="1px solid" borderColor={borderColor} borderRadius="md" mb={4} bg={bgCard}>
                    <AccordionButton _expanded={{ bg: accordionExpandedBg }} borderRadius="md" py={3}>
                        <Box flex="1" textAlign="left" fontWeight="bold" color={textColor} display="flex" alignItems="center">
                            <Icon as={FaPrescriptionBottleAlt} mr={3} color="green.500" /> Prescrição e Diagnóstico (CID)
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={6} pt={4}>
                        <FormControl mb={6}>
                            <FormLabel color={textColor} fontWeight="bold">Diagnóstico (CID-10):</FormLabel>
                            <CidAutocomplete 
                                value={consultData.diagnostico_cid}
                                onChange={(val) => setConsultData({...consultData, diagnostico_cid: val})}
                                specialty={currentDocSpecialty}
                            />
                        </FormControl>

                        <FormControl display="flex" flexDirection="column">
                            <FormLabel color={textColor} fontWeight="bold">Prescrição Médica e Pedido de Exames:</FormLabel>
                            <Textarea 
                                size="sm" 
                                minH="250px"
                                value={consultData.prescricao} 
                                onChange={(e) => setConsultData({...consultData, prescricao: e.target.value})} 
                                bg={tabBg} 
                                borderColor={borderColor} 
                                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                            />
                        </FormControl>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
          </ModalBody>
          
          <ModalFooter borderTop="1px solid" borderColor={borderColor} bg={headerBg}>
            <Button variant="ghost" size="sm" mr={3} onClick={onConsultClose}>Cancelar</Button>
            <Button colorScheme="green" size="sm" leftIcon={<FaCheckDouble />} onClick={handleFinishConsultation}>Salvar e Finalizar Prontuário</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}