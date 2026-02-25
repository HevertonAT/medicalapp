import { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Flex, Heading, Text, useToast, Spinner,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select, ModalFooter, useDisclosure,
  VStack, HStack, IconButton, Icon, Textarea, Tabs, TabList, TabPanels, Tab, TabPanel,
  useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, InputGroup, InputLeftElement,
  SimpleGrid, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { 
  FaPlus, FaUserMd, FaSearch, FaPlay, FaCheckDouble, 
  FaTimes, FaStethoscope, FaPrescriptionBottleAlt, FaRedo, 
  FaCalendarAlt, FaHistory, FaBolt, FaPrint
} from 'react-icons/fa';
import React from 'react'; 
import { useNavigate } from 'react-router-dom';

// IMPORTS CORRIGIDOS PARA A PASTA src/pages/
import api from '../services/api';
import SpecialtyFormRenderer from '../components/SpecialtyFormRenderer';
import CidAutocomplete from '../components/profissionais/CidAutocomplete';

export default function Agenda() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const { isOpen, onOpen, onClose } = useDisclosure(); 
  const { isOpen: isConsultOpen, onOpen: onConsultOpen, onClose: onConsultClose } = useDisclosure(); 
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const { isOpen: isRescheduleOpen, onOpen: onRescheduleOpen, onClose: onRescheduleClose } = useDisclosure();
  
  // Controle do Modal de Impressão
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

  const getStatusColor = (status) => {
    switch (status) {
        case 'concluido': case 'REALIZADO': return useColorModeValue('green.600', 'green.300');
        case 'cancelado': return useColorModeValue('red.600', 'red.300');
        case 'em_andamento': return useColorModeValue('orange.500', 'orange.300');
        case 'reagendado': return useColorModeValue('cyan.600', 'cyan.300');
        default: return useColorModeValue('blue.600', 'blue.300');
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

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const handleCreate = async () => {
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
      setNewApp({ doctor_id: '', patient_id: '', data: '', hora: '', duracao: '40', observacoes: '' });
      fetchData();
    } catch (error) { toast({ title: 'Erro ao agendar.', status: 'error' }); }
  };

  const handleStartConsultation = async (app) => {
    setCurrentAppointment(app);
    setStartTime(new Date()); 
    
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

  // FUNÇÃO FINALIZAR: SALVA PRIMEIRO, ABRE IMPRESSÃO DEPOIS
  const handleFinishConsultation = async () => {
    if (!consultData.anamnese && Object.keys(specialtyData).length === 0 && !consultData.prescricao) {
        toast({ title: 'Preencha algum dado antes de finalizar.', status: 'warning' });
        return;
    }

    try {
        const endTime = new Date(); 

        // PASSO 1: Salva no Banco de Dados com Segurança Total
        await api.post('/medical-records/', {
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

        // PASSO 2: Se deu certo, atualiza a tela e fecha o prontuário
        toast({ title: 'Atendimento finalizado com sucesso! ✅', status: 'success' });
        onConsultClose();
        fetchData();

        // PASSO 3: Abre a tela perguntando se deseja imprimir
        onPrintModalOpen();

    } catch (error) {
        const errorMsg = error.response?.data?.detail || 'Erro ao finalizar atendimento.';
        toast({ title: 'Erro ao finalizar.', description: errorMsg, status: 'error' });
    }
  };

  // GERA O RECEITUÁRIO PARA IMPRESSÃO
  const handlePrintRecord = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast({ title: "Pop-up bloqueado", description: "Por favor, permita os pop-ups neste site para poder imprimir.", status: "warning" });
        return;
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receituário - ${currentAppointment?.patient_nome}</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #3182CE; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #3182CE; font-size: 24px; text-transform: uppercase; }
                .header p { margin: 5px 0 0 0; font-size: 14px; color: #666; }
                .section { margin-bottom: 25px; page-break-inside: avoid; }
                .title { font-size: 16px; font-weight: bold; color: #3182CE; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                .content { white-space: pre-wrap; font-size: 14px; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                .signature-block { margin-top: 80px; text-align: center; width: 300px; float: right; }
                .signature-line { border-top: 1px solid #333; margin-bottom: 5px; }
                .clear { clear: both; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Prontuario Médico</h1>
                <p>Resumo do Atendimento</p>
            </div>
            
            <div class="section">
                <div class="content"><strong>Paciente:</strong> ${currentAppointment?.patient_nome || 'Não informado'}</div>
                <div class="content"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>

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
            <div class="section" style="margin-top: 40px;">
                <div class="title">Evolução / Observações</div>
                <div class="content">${consultData.anamnese}</div>
            </div>` : ''}

            <div class="signature-block">
                <div class="signature-line"></div>
                <div>Assinatura e Carimbo do Profissional</div>
            </div>

            <div class="clear"></div>

            <div class="footer">
                Gerado de forma segura por MedicalApp
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);

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
      setRescheduleData({ data: currentIso[0], hora: currentIso[1].slice(0, 5) });
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
      const patientName = app.patient_nome || "";
      const matchesName = patientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = filterDate ? app.data_horario.split('T')[0] === filterDate : true; 
      return matchesName && matchesDate;
  });

  return (
    <Box p={8} bg={bgPage} minH="100vh">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={headingColor}>Agenda de Atendimentos</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" size="sm" onClick={onOpen}>Agendar</Button>
      </Flex>

      <Flex gap={4} mb={6} direction={{ base: 'column', md: 'row' }}>
        <InputGroup maxW={{ base: '100%', md: '400px' }}>
            <InputLeftElement pointerEvents="none" children={<FaSearch color="gray.300" />} />
            <Input bg={bgCard} border="1px solid" borderColor={borderColor} placeholder="Pesquisar paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </InputGroup>
        <InputGroup maxW={{ base: '100%', md: '200px' }}>
             <InputLeftElement pointerEvents="none" children={<FaCalendarAlt color="gray.300" />} />
             <Input type="date" bg={bgCard} border="1px solid" borderColor={borderColor} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </InputGroup>
      </Flex>

      {loading ? <Spinner size="xl" color="blue.500" /> : (
        <Box bg={bgCard} shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor={borderColor}>
            <Table variant="simple" size="sm">
                <Thead bg={headerBg}><Tr>
                    <Th color={textColor}>Paciente</Th><Th color={textColor}>Idade</Th><Th color={textColor}>Data / Hora</Th><Th color={textColor}>Profissional</Th><Th color={textColor}>Obs</Th><Th color={textColor}>Status</Th><Th color={textColor} textAlign="center">Ações</Th>
                </Tr></Thead>
                <Tbody>
                    {filteredAppointments.length === 0 ? <Tr><Td colSpan={7} textAlign="center" py={4}>Nenhum agendamento.</Td></Tr> : filteredAppointments.map((app) => (
                        <Tr key={app.id} _hover={{ bg: hoverTr }}>
                            <Td fontWeight="bold" color={useColorModeValue('gray.700', 'white')}>{app.patient_nome}</Td>
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
                                        <Button leftIcon={app.status === 'em_andamento' ? <FaCheckDouble /> : <FaPlay />} size="xs" colorScheme={app.status === 'em_andamento' ? 'green' : 'blue'} onClick={() => handleStartConsultation(app)}>
                                            {app.status === 'em_andamento' ? 'Retomar' : 'Iniciar'}
                                        </Button>
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

      {/* MODAL NOVO AGENDAMENTO */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay /><ModalContent bg={modalBg}><ModalHeader>Novo Agendamento</ModalHeader><ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={2} spacing={4} mb={4}>
                <FormControl><FormLabel>Data</FormLabel><Input type="date" bg={inputBg} size="sm" value={newApp.data} onChange={(e) => setNewApp({...newApp, data: e.target.value})} /></FormControl>
                <FormControl><FormLabel>Hora</FormLabel><Input type="time" bg={inputBg} size="sm" value={newApp.hora} onChange={(e) => setNewApp({...newApp, hora: e.target.value})} /></FormControl>
            </SimpleGrid>
            <FormControl mb={4}><FormLabel>Profissional</FormLabel><Select bg={inputBg} size="sm" placeholder="Selecione..." value={newApp.doctor_id} onChange={(e) => setNewApp({...newApp, doctor_id: e.target.value})}>{doctors.filter(d => d.ativo).map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}</Select></FormControl>
            <FormControl mb={4}><FormLabel>Paciente</FormLabel><Select bg={inputBg} size="sm" placeholder="Selecione..." value={newApp.patient_id} onChange={(e) => setNewApp({...newApp, patient_id: e.target.value})}>{patients.filter(p => p.ativo).map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}</Select></FormControl>
            <FormControl><FormLabel>Obs</FormLabel><Input bg={inputBg} size="sm" value={newApp.observacoes} onChange={(e) => setNewApp({...newApp, observacoes: e.target.value})} /></FormControl>
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" size="sm" mr={3} onClick={handleCreate}>Agendar</Button><Button size="sm" onClick={onClose}>Cancelar</Button></ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAIS AUXILIARES */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose}><ModalOverlay /><ModalContent bg={modalBg}><ModalHeader>Cancelar</ModalHeader><ModalBody><Textarea bg={inputBg} value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Motivo..." /></ModalBody><ModalFooter><Button colorScheme="red" mr={3} onClick={handleConfirmCancel}>Confirmar</Button></ModalFooter></ModalContent></Modal>
      <Modal isOpen={isRescheduleOpen} onClose={onRescheduleClose}><ModalOverlay /><ModalContent bg={modalBg}><ModalHeader>Reagendar</ModalHeader><ModalBody><VStack spacing={3}><FormControl><FormLabel>Data</FormLabel><Input type="date" bg={inputBg} value={rescheduleData.data} onChange={(e) => setRescheduleData({...rescheduleData, data: e.target.value})}/></FormControl><FormControl><FormLabel>Hora</FormLabel><Input type="time" bg={inputBg} value={rescheduleData.hora} onChange={(e) => setRescheduleData({...rescheduleData, hora: e.target.value})}/></FormControl><FormControl><FormLabel>Motivo</FormLabel><Textarea bg={inputBg} value={actionReason} onChange={(e) => setActionReason(e.target.value)} /></FormControl></VStack></ModalBody><ModalFooter><Button colorScheme="blue" mr={3} onClick={handleConfirmReschedule}>Confirmar</Button></ModalFooter></ModalContent></Modal>

      {/* --- MODAL DE PERGUNTA: IMPRIMIR --- */}
      <Modal isOpen={isPrintModalOpen} onClose={onPrintModalClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader color="green.500" display="flex" alignItems="center" gap={2}>
             <Icon as={FaCheckDouble} /> Salvo com Sucesso!
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color={textColor}>O prontuário do paciente <strong>{currentAppointment?.patient_nome}</strong> foi salvo de forma segura no banco de dados.</Text>
            <Text color={textColor} mt={4} fontWeight="bold">Deseja imprimir o receituário / resumo do atendimento agora?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="sm" mr={3} onClick={onPrintModalClose}>Agora não</Button>
            <Button colorScheme="blue" size="sm" leftIcon={<FaPrint />} onClick={handlePrintRecord}>Imprimir Documento</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- MODAL DO PRONTUÁRIO --- */}
      <Modal isOpen={isConsultOpen} onClose={onConsultClose} size="5xl" closeOnOverlayClick={false}>
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
          
          <ModalBody py={4} display="flex" flexDirection="column" overflowY="hidden">
            <Tabs variant="enclosed" colorScheme="blue" h="100%" display="flex" flexDirection="column">
                <TabList>
                    <Tab fontWeight="bold" color={textColor}><Icon as={FaUserMd} mr={2}/> Anamnese</Tab>
                    <Tab fontWeight="bold" color={textColor}><Icon as={FaPrescriptionBottleAlt} mr={2}/> Prescrição</Tab>
                </TabList>
                
                <TabPanels flex="1" overflowY="auto" mt={2}>
                    
                    {/* ABA DE ANAMNESE E FORMULÁRIO DINÂMICO */}
                    <TabPanel h="full" display="flex" flexDirection="column">
                        <SpecialtyFormRenderer 
                            specialty={currentDocSpecialty} 
                            settings={specialtySettings} 
                            data={specialtyData} 
                            onChange={setSpecialtyData} 
                        />

                        {/* Texto livre com o botão de Macros */}
                        <FormControl mt={6} display="flex" flexDirection="column" flex="1">
                          <Flex justify="space-between" align="center" mb={2}>
                            <FormLabel color={textColor} mb={0}>Evolução / Observações Livres:</FormLabel>
                            
                            {minhasMacros.length > 0 && (
                              <Menu>
                                <MenuButton as={Button} size="xs" colorScheme="yellow" variant="solid" leftIcon={<FaBolt />}>
                                  Inserir Atalho
                                </MenuButton>
                                <MenuList bg={bgCard} borderColor={borderColor}>
                                  {minhasMacros.map(macro => (
                                    <MenuItem 
                                      key={macro.id} 
                                      bg={bgCard} 
                                      _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
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
                              h="250px"
                              resize="none" 
                              value={consultData.anamnese} 
                              onChange={(e) => setConsultData({...consultData, anamnese: e.target.value})} 
                              bg={tabBg} 
                              borderColor={borderColor} 
                              placeholder="Evolução, observações adicionais..."
                              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                          />
                      </FormControl>
                    </TabPanel>

                    {/* ABA DE PRESCRIÇÃO E CID */}
                    <TabPanel h="full" display="flex" flexDirection="column" gap={4}>
                        
                        <FormControl>
                            <FormLabel color={textColor} fontWeight="bold">Diagnóstico (CID-10):</FormLabel>
                            <CidAutocomplete 
                                value={consultData.diagnostico_cid}
                                onChange={(val) => setConsultData({...consultData, diagnostico_cid: val})}
                                specialty={currentDocSpecialty}
                            />
                        </FormControl>

                        <FormControl h="full" display="flex" flexDirection="column">
                            <FormLabel color={textColor} fontWeight="bold">Prescrição Médica e Pedido de Exames:</FormLabel>
                            <Textarea 
                                size="sm" 
                                flex="1" 
                                minH="250px"
                                value={consultData.prescricao} 
                                onChange={(e) => setConsultData({...consultData, prescricao: e.target.value})} 
                                bg={tabBg} 
                                borderColor={borderColor} 
                                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                            />
                        </FormControl>
                    </TabPanel>

                </TabPanels>
            </Tabs>
          </ModalBody>
          
          <ModalFooter borderTop="1px solid" borderColor={borderColor}>
            <Button variant="ghost" size="sm" mr={3} onClick={onConsultClose}>Cancelar</Button>
            <Button colorScheme="green" size="sm" leftIcon={<FaCheckDouble />} onClick={handleFinishConsultation}>Salvar e Finalizar Prontuário</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}