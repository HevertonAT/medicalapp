import { useState, useEffect } from 'react';
import {
  Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, useToast, Spinner, VStack, Text, 
  HStack, Icon, Badge, FormControl, FormLabel, Input, ModalFooter, Tooltip,
  useColorModeValue, Divider, InputGroup, InputRightElement 
} from '@chakra-ui/react';
import { FaPlus, FaFileMedical, FaHistory, FaPrescriptionBottleAlt, FaEdit, FaBan, FaCheck, FaPrint, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; // <-- IMPORTAÇÃO ADICIONADA AQUI

import api from '../services/api';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADO PARA SABER QUEM ESTÁ LOGADO ---
  const [currentUserRole, setCurrentUserRole] = useState('');

  const { isOpen, onOpen, onClose } = useDisclosure(); 
  const { isOpen: isRecordOpen, onOpen: onRecordOpen, onClose: onRecordClose } = useDisclosure(); 

  const [currentPatient, setCurrentPatient] = useState({ 
    id: '', nome_completo: '', telefone: '', cpf: '', data_nascimento: '', email: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [cpfError, setCpfError] = useState('');
  const [isFetchingCep, setIsFetchingCep] = useState(false); 
  
  const [filter, setFilter] = useState('ativos'); 

  const toast = useToast();
  const navigate = useNavigate();

  const bgCard = useColorModeValue('white', 'gray.800');
  const bgHeader = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');
  const hoverTr = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const activeColor = useColorModeValue('green.600', 'green.300'); 
  const inactiveColor = useColorModeValue('red.600', 'red.300');   
  
  const recordListBg = useColorModeValue('gray.50', 'gray.900');
  const recordDetailBg = useColorModeValue('white', 'gray.800');
  const anamneseBg = useColorModeValue('gray.50', 'gray.700');
  const prescricaoBg = useColorModeValue('orange.50', 'orange.900');
  const prescricaoText = useColorModeValue('orange.800', 'orange.100');

  // --- TRAVA DE ANO MÁXIMO (Hoje + 4 anos) ---
  const maxYear = new Date().getFullYear() + 4;
  const maxDateLimit = `${maxYear}-12-31`;

  const enforceDateLimit = (dateString) => {
      if (!dateString) return dateString;
      const partes = dateString.split('-');
      if (partes[0].length > 4) {
          partes[0] = partes[0].slice(0, 4);
      }
      if (parseInt(partes[0]) > maxYear) {
          partes[0] = maxYear.toString();
      }
      return partes.join('-');
  };

  const calculateAge = (dataNascimento) => {
    if (!dataNascimento) return '-';
    const today = new Date();
    const birthDate = new Date(dataNascimento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age + ' anos';
  };

  const isValidCPF = (cpf) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    let sum = 0; let remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(10, 11))) return false;
    return true;
  };
  
  const formatCPF = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value) => {
    return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').substring(0, 15);
  };

  const formatCEP = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 9);
  };

  const handleCepBlur = async () => {
    const rawCep = currentPatient.cep.replace(/\D/g, '');
    if (rawCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCurrentPatient(prev => ({
            ...prev,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
          }));
          toast({ title: "Endereço encontrado!", status: "success", duration: 2000, position: "top" });
        } else {
          toast({ title: "CEP não encontrado.", status: "warning", position: "top" });
        }
      } catch (error) {
        toast({ title: "Erro ao buscar CEP.", status: "error", position: "top" });
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients/');
      setPatients(response.data);
    } catch (error) { 
        console.error(error); 
        if(error.response?.status === 401) navigate('/');
    } finally { 
        setLoading(false); 
    }
  };

  // --- BUSCA OS PACIENTES E IDENTIFICA QUEM ESTÁ LOGADO ---
  useEffect(() => { 
      const token = localStorage.getItem('medical_token');
      if (token) {
          try {
              const decoded = jwtDecode(token);
              setCurrentUserRole(decoded.role || localStorage.getItem('user_role'));
          } catch (e) {
              console.error("Erro ao decodificar token", e);
          }
      }
      fetchPatients(); 
  }, []);

  const filteredPatients = patients.filter(p => {
    if (filter === 'ativos') return p.ativo === true;
    if (filter === 'inativos') return p.ativo === false;
    return true; 
  });

  const handleSave = async () => {
    if (currentPatient.cpf && !isValidCPF(currentPatient.cpf)) {
        setCpfError('CPF inválido. Insira um CPF válido.');
        return;
    }
    
    try {
        const payload = {
            nome_completo: currentPatient.nome_completo,
            cpf: currentPatient.cpf || null, 
            telefone: currentPatient.telefone,
            email: currentPatient.email,
            data_nascimento: currentPatient.data_nascimento || null,
            cep: currentPatient.cep || null,
            logradouro: currentPatient.logradouro || null,
            numero: currentPatient.numero || null,
            complemento: currentPatient.complemento || null,
            bairro: currentPatient.bairro || null,
            cidade: currentPatient.cidade || null,
            estado: currentPatient.estado || null
        };

        if (isEditing && currentPatient.id) {
            await api.put(`/patients/${currentPatient.id}`, payload);
            toast({ title: 'Atualizado!', status: 'success' });
        } else {
            await api.post('/patients/', payload);
            toast({ title: 'Criado!', status: 'success' });
        }
        onClose();
        setCpfError('');
        fetchPatients();
    } catch (error) {
        toast({ title: 'Erro ao salvar.', description: error.response?.data?.detail || 'Verifique os dados informados.', status: 'error' });
    }
  };

  const handleInactivate = async (id) => {
    if (window.confirm('Inativar este paciente?')) {
        try {
            await api.delete(`/patients/${id}`);
            toast({ title: 'Inativado.', status: 'warning' });
            fetchPatients();
        } catch (error) { toast({ title: 'Erro.', status: 'error' }); }
    }
  };

  const handleReactivate = async (id) => {
    if (window.confirm('Reativar este paciente?')) {
        try {
            await api.patch(`/patients/${id}/reactivate`, {});
            toast({ title: 'Paciente reativado!', status: 'success' });
            fetchPatients();
        } catch (error) { toast({ title: 'Erro.', status: 'error' }); }
    }
  };

  const openModal = (patient = null) => {
      if (patient) {
          setCurrentPatient({
            id: patient.id,
            nome_completo: patient.nome_completo || '',
            telefone: patient.telefone || '',
            cpf: patient.cpf || '',
            data_nascimento: patient.data_nascimento || '',
            email: patient.email || '',
            cep: patient.cep || '',
            logradouro: patient.logradouro || '',
            numero: patient.numero || '',
            complemento: patient.complemento || '',
            bairro: patient.bairro || '',
            cidade: patient.cidade || '',
            estado: patient.estado || ''
          });
          setIsEditing(true);
      } else {
          setCurrentPatient({ 
            id: '', nome_completo: '', telefone: '', cpf: '', data_nascimento: '', email: '',
            cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' 
          });
          setIsEditing(false);
      }
      onOpen();
  };

  const handleOpenRecord = async (patient) => {
    setCurrentPatient(patient);
    setSelectedRecord(null);
    onRecordOpen();
    try {
        const res = await api.get(`/medical-records/patient/${patient.id}`);
        setRecords(res.data);
    } catch (error) { console.error("Erro prontuário"); }
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

  const handlePrintEvolution = (record) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Pop-up bloqueado", description: "Permita os pop-ups para imprimir.", status: "warning" });
      return;
    }

    const patientAge = calculateAge(currentPatient.data_nascimento);
    const docReg = record.doctor_document || record.doctor_crm || record.crm || "CR não informado";
    const docInfo = formatDoctorInfo(record.doctor_nome, record.doctor_specialty, record.doctor_gender);
    const recordIdFormatted = record.id ? String(record.id).padStart(9, '0') : "000000000";

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Evolução - ${currentPatient.nome_completo}</title>
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
                <div class="info-row"><strong>Prontuário/Paciente:</strong> ${currentPatient.nome_completo} ${patientAge !== '-' ? `(${patientAge})` : ''}</div>
                <div class="info-row"><strong>Registro de Atendimento:</strong> ${recordIdFormatted} - ${record.created_at}</div>
                <div class="info-row"><strong>Profissional:</strong> ${docInfo.fullName}</div>
            </div>

            <div class="header-title">Evolução Clínica</div>

            ${record.diagnostico_cid ? `
            <div class="section">
                <div class="title">Diagnóstico (CID-10)</div>
                <div class="content">${record.diagnostico_cid}</div>
            </div>` : ''}

            ${record.prescricao ? `
            <div class="section">
                <div class="title">Prescrição e Exames</div>
                <div class="content">${record.prescricao}</div>
            </div>` : ''}

            ${record.anamnese ? `
            <div class="section">
                <div class="title">Descrição da Evolução</div>
                <div class="content">${record.anamnese}</div>
            </div>` : ''}

            <div class="signature-box">
                <div class="signature-line"></div>
                <p class="signature-text signature-name">${docInfo.fullName}</p>
                <p class="signature-text">${docInfo.title}</p>
                <p class="signature-text">${docReg}</p>
            </div>

            <div class="footer">Gerado de forma segura por VezzCare</div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  const handleDownloadPDF = async (recordId) => {
    try {
        const response = await api.get(`/medical-records/${recordId}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receita_${recordId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        toast({ title: 'Erro ao gerar receita.', status: 'error' });
    }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>Pacientes</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => openModal()}>Novo Paciente</Button>
      </Flex>

      <HStack mb={4} spacing={4}>
        <Button size="sm" variant={filter === 'todos' ? 'solid' : 'outline'} colorScheme="blue" onClick={() => setFilter('todos')}>Todos</Button>
        <Button size="sm" variant={filter === 'ativos' ? 'solid' : 'outline'} colorScheme="green" onClick={() => setFilter('ativos')}>Ativos</Button>
        <Button size="sm" variant={filter === 'inativos' ? 'solid' : 'outline'} colorScheme="red" onClick={() => setFilter('inativos')}>Inativos</Button>
      </HStack>

      <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="hidden" border="1px solid" borderColor={borderColor}>
        <Table variant="simple" size="sm"> 
            <Thead bg={bgHeader}>
            <Tr>
                <Th color={textColor} py={3}>Nome</Th>
                <Th color={textColor} py={3}>Idade</Th>
                <Th color={textColor} py={3}>CPF</Th>
                <Th color={textColor} py={3}>Telefone</Th>
                <Th color={textColor} py={3}>Status</Th>
                <Th color={textColor} py={3} textAlign="center">Ações</Th>
            </Tr>
            </Thead>
            <Tbody>
            {filteredPatients.map((p) => (
                <Tr 
                key={p.id} 
                opacity={p.ativo ? 1 : 0.6} 
                _hover={{ bg: hoverTr }}
                transition="background 0.2s"
                >
                <Td py={2} fontWeight="bold" fontSize="xs">{p.nome_completo}</Td>
                <Td py={2} fontSize="xs">{calculateAge(p.data_nascimento)}</Td>
                <Td py={2} fontSize="xs">{p.cpf || '-'}</Td>
                <Td py={2} fontSize="xs">{p.telefone || '-'}</Td>
                
                <Td py={2}>
                    <Text 
                    fontWeight="extrabold" fontSize="2xs" letterSpacing="wider"
                    color={p.ativo ? activeColor : inactiveColor}
                    >
                    {p.ativo ? 'ATIVO' : 'INATIVO'}
                    </Text>
                </Td>

                <Td py={2}>
                    <HStack justify="center" spacing={1}>
                    
                    {/* --- A MÁGICA: O botão só aparece se não for recepcionista --- */}
                    {currentUserRole !== 'recepcionista' && (
                        <Button 
                            size="xs" leftIcon={<FaFileMedical />} colorScheme="teal" 
                            onClick={() => handleOpenRecord(p)}
                        >
                            Prontuário
                        </Button>
                    )}
                    
                    <IconButton 
                        icon={<FaEdit />} size="xs" colorScheme="yellow" variant="ghost"
                        onClick={() => openModal(p)} isDisabled={!p.ativo} 
                    />
                    
                    {p.ativo ? (
                        <Tooltip label="Inativar">
                        <IconButton 
                            icon={<FaBan />} size="xs" colorScheme="red" variant="ghost"
                            onClick={() => handleInactivate(p.id)} 
                        />
                        </Tooltip>
                    ) : (
                        <Tooltip label="Reativar">
                        <IconButton 
                            icon={<FaCheck />} size="xs" colorScheme="green" variant="ghost"
                            onClick={() => handleReactivate(p.id)} 
                        />
                        </Tooltip>
                    )}
                    </HStack>
                </Td>
                </Tr>
            ))}
            </Tbody>
        </Table>
      </Box>

      {/* MODAL CADASTRO / EDIÇÃO */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <VStack spacing={4} align="stretch">
              
              <Text fontWeight="bold" color={textColor} fontSize="sm" textTransform="uppercase">Dados Pessoais</Text>
              
              <FormControl isRequired>
                  <FormLabel fontSize="sm">Nome Completo</FormLabel>
                  <Input 
                      size="sm" bg={inputBg} borderColor={borderColor} 
                      value={currentPatient.nome_completo} 
                      onChange={(e) => setCurrentPatient({...currentPatient, nome_completo: e.target.value})} 
                      placeholder="Digite o nome do Paciente"
                  />
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isInvalid={cpfError !== ''}>
                    <FormLabel fontSize="sm">CPF</FormLabel>
                    <Input 
                        size="sm" bg={inputBg} borderColor={cpfError ? 'red.500' : borderColor}
                        value={currentPatient.cpf} 
                        onChange={(e) => {
                            const newCpf = formatCPF(e.target.value);
                            setCurrentPatient({...currentPatient, cpf: newCpf});
                            if (!newCpf || isValidCPF(newCpf)) setCpfError('');
                        }} 
                        placeholder="000.000.000-00" maxLength={14}
                    />
                    {cpfError && <Text fontSize="xs" color="red.500" mt={1}>{cpfError}</Text>}
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="sm">Data de Nascimento</FormLabel>
                    <Input 
                        size="sm" 
                        type="date" 
                        max={maxDateLimit}
                        bg={inputBg} 
                        borderColor={borderColor} 
                        value={currentPatient.data_nascimento} 
                        onChange={(e) => setCurrentPatient({...currentPatient, data_nascimento: enforceDateLimit(e.target.value)})} 
                    />
                </FormControl>
              </HStack>

              <HStack w="full" spacing={4}>
                <FormControl>
                    <FormLabel fontSize="sm">E-mail</FormLabel>
                    <Input 
                        size="sm" type="email" bg={inputBg} borderColor={borderColor} 
                        value={currentPatient.email} 
                        onChange={(e) => setCurrentPatient({...currentPatient, email: e.target.value})} 
                        placeholder="email@paciente.com"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="sm">Telefone</FormLabel>
                    <Input 
                        size="sm" bg={inputBg} borderColor={borderColor} 
                        value={currentPatient.telefone} 
                        onChange={(e) => setCurrentPatient({...currentPatient, telefone: formatPhone(e.target.value)})} 
                        placeholder="(00) 00000-0000" maxLength={15}
                    />
                </FormControl>
              </HStack>

              <Divider my={2} />

              <Text fontWeight="bold" color={textColor} fontSize="sm" textTransform="uppercase">Endereço</Text>
              
              <HStack w="full" spacing={4} align="flex-end">
                <FormControl w={{ base: "100%", md: "35%" }}>
                    <FormLabel fontSize="sm">CEP</FormLabel>
                    <InputGroup size="sm">
                        <Input 
                            bg={inputBg} borderColor={borderColor} 
                            value={currentPatient.cep} 
                            onChange={(e) => setCurrentPatient({...currentPatient, cep: formatCEP(e.target.value)})} 
                            onBlur={handleCepBlur}
                            placeholder="00000-000" maxLength={9}
                        />
                        <InputRightElement>
                            {isFetchingCep ? <Spinner size="xs" color="blue.500" /> : <Icon as={FaSearch} color="gray.400" />}
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <FormControl w={{ base: "100%", md: "65%" }}>
                    <FormLabel fontSize="sm">Logradouro / Rua</FormLabel>
                    <Input 
                        size="sm" bg={inputBg} borderColor={borderColor} 
                        value={currentPatient.logradouro} 
                        onChange={(e) => setCurrentPatient({...currentPatient, logradouro: e.target.value})} 
                    />
                </FormControl>
              </HStack>

              <HStack w="full" spacing={4}>
                <FormControl w="30%">
                    <FormLabel fontSize="sm">Número</FormLabel>
                    <Input 
                        size="sm" bg={inputBg} borderColor={borderColor} 
                        value={currentPatient.numero} 
                        onChange={(e) => setCurrentPatient({...currentPatient, numero: e.target.value})} 
                    />
                </FormControl>

                <FormControl w="70%">
                    <FormLabel fontSize="sm">Complemento</FormLabel>
                    <Input 
                        size="sm" bg={inputBg} borderColor={borderColor} 
                        value={currentPatient.complemento} 
                        onChange={(e) => setCurrentPatient({...currentPatient, complemento: e.target.value})} 
                        placeholder="Apto, Bloco, etc."
                    />
                </FormControl>
              </HStack>

              <HStack w="full" spacing={4}>
                <FormControl w="40%">
                    <FormLabel fontSize="sm">Bairro</FormLabel>
                    <Input 
                        size="sm" bg={inputBg} borderColor={borderColor} 
                        value={currentPatient.bairro} 
                        onChange={(e) => setCurrentPatient({...currentPatient, bairro: e.target.value})} 
                    />
                </FormControl>

                <FormControl w="45%">
                    <FormLabel fontSize="sm">Cidade</FormLabel>
                    <Input 
                        size="sm" bg={inputBg} borderColor={borderColor} 
                        value={currentPatient.cidade} 
                        onChange={(e) => setCurrentPatient({...currentPatient, cidade: e.target.value})} 
                    />
                </FormControl>

                <FormControl w="15%">
                    <FormLabel fontSize="sm">UF</FormLabel>
                    <Input 
                        size="sm" bg={inputBg} borderColor={borderColor} 
                        value={currentPatient.estado} 
                        onChange={(e) => setCurrentPatient({...currentPatient, estado: e.target.value.toUpperCase()})} 
                        maxLength={2} placeholder="SP"
                    />
                </FormControl>
              </HStack>

            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor={borderColor}>
            <Button variant="ghost" onClick={onClose} mr={3}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSave}>Salvar Paciente</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL PRONTUÁRIO */}
      <Modal isOpen={isRecordOpen} onClose={onRecordClose} size="6xl">
        <ModalOverlay />
        <ModalContent h="80vh" bg={modalBg}>
          <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
            <Flex align="center" gap={2}>
                <FaFileMedical color="teal" />
                <Text>Histórico Clínico: {currentPatient.nome_completo}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" p={0}>
            <Box w="35%" borderRight="1px solid" borderColor={borderColor} bg={recordListBg} p={4} overflowY="auto">
                <Heading size="sm" mb={4} color={textColor}><Icon as={FaHistory} mr={2}/>Atendimentos</Heading>
                {records.length === 0 ? <Text fontSize="sm" color="gray.500">Nenhum registro.</Text> : (
                    <VStack spacing={3} align="stretch">
                        {records.map(rec => (
                            <Box 
                                key={rec.id} 
                                bg={selectedRecord?.id === rec.id ? "teal.500" : bgCard} 
                                color={selectedRecord?.id === rec.id ? "white" : textColor}
                                p={4} 
                                borderRadius="md" 
                                shadow="sm" 
                                borderLeft="4px solid" 
                                borderColor={selectedRecord?.id === rec.id ? "teal.200" : "gray.300"}
                                cursor="pointer"
                                onClick={() => setSelectedRecord(rec)}
                                _hover={{ opacity: 0.8 }}
                            >
                                <Text fontSize="xs" fontWeight="bold">{rec.created_at}</Text>
                                <Text fontSize="sm" fontWeight="bold" mt={1}>Dr(a) {rec.doctor_nome}</Text>
                            </Box>
                        ))}
                    </VStack>
                )}
            </Box>
            
            <Box w="65%" p={8} overflowY="auto" bg={recordDetailBg}>
                {selectedRecord ? (
                    <Box>
                        <Flex justify="space-between" align="center" mb={6}>
                            <Badge colorScheme="teal" fontSize="0.9em" p={1}>REALIZADO EM {selectedRecord.created_at}</Badge>
                            
                            <HStack spacing={3}>
                                <Button 
                                    size="sm" leftIcon={<FaPrint />} colorScheme="blue" variant="solid" 
                                    onClick={() => handlePrintEvolution(selectedRecord)}
                                >
                                    Imprimir Evolução
                                </Button>

                                <Button 
                                    size="sm" leftIcon={<FaPrescriptionBottleAlt />} variant="outline" 
                                    onClick={() => handleDownloadPDF(selectedRecord.id)}
                                >
                                    Ver Receita
                                </Button>
                            </HStack>
                        </Flex>
                        
                        <Box mb={6}>
                            <Text fontWeight="bold" color={textColor} mb={2}>Evolução:</Text>
                            <Box p={4} bg={anamneseBg} borderRadius="md" border="1px solid" borderColor={borderColor} minH="100px">
                                <Text whiteSpace="pre-wrap" color={textColor}>{selectedRecord.anamnese}</Text>
                            </Box>
                        </Box>
                        
                        <Box>
                            <Text fontWeight="bold" color={textColor} mb={2}>Prescrição / Receita:</Text>
                            <Box p={4} bg={prescricaoBg} borderRadius="md" border="1px solid" borderColor="orange.200" minH="80px">
                                <Text whiteSpace="pre-wrap" color={prescricaoText}>{selectedRecord.prescricao || "Nenhuma prescrição."}</Text>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Flex direction="column" align="center" justify="center" h="100%" color="gray.400">
                        <Icon as={FaFileMedical} w={12} h={12} mb={4} opacity={0.3} />
                        <Text>Selecione um atendimento.</Text>
                    </Flex>
                )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}