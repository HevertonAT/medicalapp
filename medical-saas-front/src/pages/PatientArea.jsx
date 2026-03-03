import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Heading, Text, Button, VStack, HStack, Icon, useToast,
  Spinner, useColorModeValue, Tabs, TabList, TabPanels, Tab, TabPanel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, FormControl, FormLabel, Input, Textarea, useDisclosure,
  SimpleGrid, Select, Container
} from '@chakra-ui/react';
import { FaCalendarAlt, FaUserMd, FaCalendarPlus, FaCheckCircle, FaClock } from 'react-icons/fa';

// --- IMPORTAÇÕES DO CALENDÁRIO INTELIGENTE ---
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ptBR from 'date-fns/locale/pt-BR';

import api from '../services/api';

// Configura o calendário para o idioma Português do Brasil
registerLocale('pt-BR', ptBR);

export default function PatientArea() {
  const dataLimiteObj = new Date();
  dataLimiteObj.setFullYear(dataLimiteObj.getFullYear() + 1);

  // --- ESTADOS EXISTENTES ---
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0); 

  // --- ESTADOS PARA NOVO AGENDAMENTO ---
  const [availableSlots, setAvailableSlots] = useState([]); 
  const [fetchingSlots, setFetchingSlots] = useState(false); 
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [newAppointment, setNewAppointment] = useState({
    doctor_id: '', data: '', hora: '', observacoes: ''
  });

  // --- ESTADOS PARA REAGENDAMENTO ---
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [fetchingRescheduleSlots, setFetchingRescheduleSlots] = useState(false);

  const [bookingLoading, setBookingLoading] = useState(false);
  const { isOpen: isRescheduleOpen, onOpen: onRescheduleOpen, onClose: onRescheduleClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const [selectedApp, setSelectedApp] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ data: '', hora: '', motivo: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // --- DEFINIÇÃO DINÂMICA DE CORES (CLARO / ESCURO) ---
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700'); 
  const inputBorder = useColorModeValue('gray.300', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const highlightColor = useColorModeValue('blue.600', 'blue.300');

  // =========================================================================
  // --- A MÁGICA DO CALENDÁRIO: VERIFICAR DIAS ATIVOS DO MÉDICO ---
  // =========================================================================
  const isWeekdayValid = (date, docId) => {
    if (!docId) return false; // Se não escolheu médico, não clica em nada
    
    const day = date.getDay(); // 0 = Domingo, 1 = Segunda ... 6 = Sábado
    const dayMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };

    const doc = doctors.find(d => String(d.id) === String(docId));
    if (!doc || !doc.agenda_config) return true; // Se o médico não tiver config, libera tudo por padrão

    let config = doc.agenda_config;
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch(e) {}
    }

    const dayConfig = config[dayMap[day]];
    return dayConfig && dayConfig.ativo === true; // Só retorna true (clicável) se o dia estiver ativo
  };

  // Converte data Local para String (YYYY-MM-DD) sem bugar o Fuso Horário
  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Converte String (YYYY-MM-DD) para Data Local para mostrar no Calendário
  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    const [y, m, d] = dateString.split('-');
    return new Date(y, m - 1, d);
  };
  // =========================================================================

  const fetchAvailableSlots = useCallback(async () => {
    if (!newAppointment.doctor_id || !newAppointment.data) {
      setAvailableSlots([]);
      return;
    }
    setFetchingSlots(true);
    try {
      const response = await api.get('/appointments/available-slots', {
        params: { doctor_id: newAppointment.doctor_id, data: newAppointment.data }
      });
      setAvailableSlots(response.data || []);
    } catch (error) { setAvailableSlots([]); } 
    finally { setFetchingSlots(false); }
  }, [newAppointment.doctor_id, newAppointment.data]);

  useEffect(() => { fetchAvailableSlots(); }, [fetchAvailableSlots]);

  const fetchRescheduleSlots = useCallback(async () => {
    const doctorId = selectedApp?.doctor?.id || selectedApp?.doctor_id;
    if (!doctorId || !rescheduleData.data) {
      setRescheduleSlots([]);
      return;
    }
    setFetchingRescheduleSlots(true);
    try {
      const response = await api.get('/appointments/available-slots', {
        params: { doctor_id: doctorId, data: rescheduleData.data }
      });
      setRescheduleSlots(response.data || []);
    } catch (error) { setRescheduleSlots([]); } 
    finally { setFetchingRescheduleSlots(false); }
  }, [selectedApp, rescheduleData.data]);

  useEffect(() => { fetchRescheduleSlots(); }, [fetchRescheduleSlots]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, docRes] = await Promise.all([
        api.get('/appointments/me'),
        api.get('/doctors/') 
      ]);
      setAppointments(appRes.data);
      setDoctors(docRes.data || []);
    } catch (error) {
      if (error.response?.status !== 401) toast({ title: 'Erro ao carregar dados.', status: 'error' });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const specialties = [...new Set(doctors.map(d => d.especialidade).filter(Boolean))];
  const filteredDoctors = selectedSpecialty 
    ? doctors.filter(d => d.especialidade === selectedSpecialty)
    : doctors;

  const handleCreateAppointment = async () => {
    if (!newAppointment.doctor_id || !newAppointment.data || !newAppointment.hora) {
      toast({ title: 'Preencha todos os campos obrigatórios.', status: 'warning' });
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/appointments/', {
        doctor_id: newAppointment.doctor_id,
        data_horario: `${newAppointment.data}T${newAppointment.hora}:00`,
        observacoes: newAppointment.observacoes,
        duracao: 30 
      });
      toast({ title: 'Agendamento Confirmado!', status: 'success' });
      setNewAppointment({ doctor_id: '', data: '', hora: '', observacoes: '' });
      fetchData(); 
      setTabIndex(0); 
    } catch (error) {
      toast({ title: 'Erro ao agendar', description: error.response?.data?.detail || '', status: 'error' });
    } finally { setBookingLoading(false); }
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason) {
      toast({ title: 'Por favor, informe o motivo do cancelamento.', status: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/appointments/${selectedApp.id}/cancel`, { motivo: cancelReason });
      toast({ title: 'Consulta cancelada com sucesso.', status: 'success' });
      fetchData();
      onCancelClose();
      setCancelReason('');
    } catch (error) { toast({ title: 'Erro ao cancelar consulta.', status: 'error' }); } 
    finally { setSubmitting(false); }
  };

  const handleRescheduleAppointment = async () => {
    if (!rescheduleData.data || !rescheduleData.hora) {
      toast({ title: 'Preencha a nova data e horário.', status: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/appointments/${selectedApp.id}/reschedule`, {
        data_horario: `${rescheduleData.data}T${rescheduleData.hora}:00`,
        motivo: rescheduleData.motivo
      });
      toast({ title: 'Consulta reagendada com sucesso!', status: 'success' });
      fetchData();
      onRescheduleClose();
      setRescheduleData({ data: '', hora: '', motivo: '' });
    } catch (error) { toast({ title: 'Erro ao reagendar consulta.', status: 'error' }); } 
    finally { setSubmitting(false); }
  };

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Heading size="lg" mb={8} color={textColor}>Área do Paciente</Heading>

      <Tabs variant="line" colorScheme="blue" index={tabIndex} onChange={setTabIndex}>
        <TabList mb={6}>
          <Tab fontWeight="bold" color={textColor}>Meus Agendamentos</Tab>
          <Tab fontWeight="bold" color={textColor}>Novo Agendamento</Tab>
        </TabList>

        <TabPanels>
          {/* ABA 1: MEUS AGENDAMENTOS */}
          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              {loading ? (
                <Flex justify="center" p={8}><Spinner color="blue.500" size="xl" /></Flex>
              ) : appointments.length === 0 ? (
                <Box bg={bgCard} p={8} borderRadius="xl" textAlign="center" border="1px solid" borderColor={borderColor}>
                  <Icon as={FaCalendarAlt} boxSize={10} color={subTextColor} mb={4} />
                  <Text color={subTextColor} fontSize="lg">Você ainda não possui agendamentos.</Text>
                </Box>
              ) : (
                appointments.map((app) => (
                  <Box key={app.id} p={5} bg={bgCard} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                    <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
                      <Box>
                        <Text fontWeight="bold" fontSize="lg" color={highlightColor} display="flex" alignItems="center" gap={2}>
                          <Icon as={FaUserMd} />
                          {app.doctor?.nome || 'Profissional não informado'}
                        </Text>
                        
                        <Text color={subTextColor} display="flex" alignItems="center" gap={2} mt={2}>
                          <Icon as={FaClock} />
                          {app.data_horario ? new Date(app.data_horario).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Data indefinida'}
                        </Text>
                        
                        <Text fontSize="sm" mt={1}
                          color={app.status?.toLowerCase() === 'cancelado' ? 'red.500' : subTextColor} 
                          fontWeight={app.status?.toLowerCase() === 'cancelado' ? 'bold' : 'normal'}
                        >
                          Status: {
                            app.status?.toLowerCase() === 'cancelado' ? 'CANCELADO' : 
                            (app.status?.toLowerCase() === 'concluido' || app.status?.toLowerCase() === 'finalizado') ? 'CONCLUÍDO' : 
                            'AGENDADO'
                          }
                        </Text>
                      </Box>
                      
                      {app.status?.toLowerCase() !== 'cancelado' && (
                        <HStack spacing={3} mt={{ base: 4, md: 0 }}>
                          <Button size="sm" colorScheme="blue" variant="outline" onClick={() => {
                            setSelectedApp(app);
                            setRescheduleData({ data: '', hora: '', motivo: '' });
                            setRescheduleSlots([]);
                            onRescheduleOpen();
                          }}>
                            Reagendar
                          </Button>
                          <Button size="sm" colorScheme="red" variant="outline" onClick={() => {
                            setSelectedApp(app);
                            onCancelOpen();
                          }}>
                            Cancelar
                          </Button>
                        </HStack>
                      )}
                    </Flex>
                  </Box>
                ))
              )}
            </VStack>
          </TabPanel>

          {/* ABA 2: NOVO AGENDAMENTO */}
          <TabPanel px={0}>
            <Container maxW="container.md" p={0}>
              <Box bg={bgCard} p={8} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="lg">
                <Heading size="md" mb={6} color={highlightColor} display="flex" alignItems="center" gap={2}>
                  <Icon as={FaCalendarPlus} /> Agende sua consulta
                </Heading>

                <VStack spacing={5}>
                  <FormControl>
                    <FormLabel color={labelColor}>Especialidade</FormLabel>
                    <Select 
                      placeholder="Todas as especialidades" 
                      bg={inputBg} color={textColor} border="1px solid" borderColor={inputBorder}
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                      {specialties.map((spec, idx) => (
                        <option key={idx} value={spec}>{spec}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={labelColor}>Profissional</FormLabel>
                    <Select 
                      placeholder="Selecione o médico..." 
                      bg={inputBg} color={textColor} border="1px solid" borderColor={inputBorder}
                      value={newAppointment.doctor_id}
                      onChange={(e) => {
                        setNewAppointment({ ...newAppointment, doctor_id: e.target.value, data: '', hora: '' });
                        setAvailableSlots([]);
                      }}
                    >
                      {filteredDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.nome}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} w="full">
                    
                    {/* --- O NOVO CALENDÁRIO INTELIGENTE --- */}
                    <FormControl isRequired>
                      <FormLabel color={labelColor}>Data</FormLabel>
                      {/* Box com truque CSS para o calendário ocupar 100% da largura no Chakra UI */}
                      <Box sx={{ '.react-datepicker-wrapper': { width: '100%' } }}>
                        <DatePicker
                          locale="pt-BR"
                          dateFormat="dd/MM/yyyy"
                          selected={parseLocalDate(newAppointment.data)}
                          onChange={(date) => {
                            setNewAppointment({ ...newAppointment, data: formatLocalDate(date), hora: '' });
                            setAvailableSlots([]);
                          }}
                          filterDate={(date) => isWeekdayValid(date, newAppointment.doctor_id)}
                          minDate={new Date()}
                          maxDate={dataLimiteObj}
                          disabled={!newAppointment.doctor_id}
                          placeholderText={newAppointment.doctor_id ? "Selecione uma data disponível" : "Escolha o profissional primeiro"}
                          customInput={
                            <Input 
                              bg={inputBg} color={textColor} border="1px solid" borderColor={inputBorder}
                              _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                            />
                          }
                        />
                      </Box>
                    </FormControl>

                    <FormControl isRequired isDisabled={!newAppointment.data || fetchingSlots}>
                      <FormLabel color={labelColor}>Horários Disponíveis</FormLabel>
                      {fetchingSlots ? (
                        <HStack bg={inputBg} p={2} borderRadius="md" justify="center" border="1px solid" borderColor={inputBorder}>
                          <Spinner size="xs" color={highlightColor} /><Text fontSize="xs" color={textColor}>Buscando horários...</Text>
                        </HStack>
                      ) : (
                        <Select 
                          placeholder={availableSlots.length > 0 ? "Escolha um horário" : "Nenhum horário disponível"}
                          bg={inputBg} color={textColor} border="1px solid" borderColor={inputBorder}
                          value={newAppointment.hora}
                          onChange={(e) => setNewAppointment({ ...newAppointment, hora: e.target.value })}
                        >
                          {availableSlots.map((hora) => (
                            <option key={hora} value={hora}>{hora}</option>
                          ))}
                        </Select>
                      )}
                    </FormControl>
                  </SimpleGrid>

                  <Button 
                    colorScheme="blue" size="lg" w="full" mt={4}
                    onClick={handleCreateAppointment}
                    isLoading={bookingLoading}
                    leftIcon={<FaCheckCircle />}
                  >
                    Confirmar Agendamento
                  </Button>
                </VStack>
              </Box>
            </Container>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* --- MODAIS DE AÇÃO --- */}

      {/* MODAL DE CANCELAMENTO */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={bgCard} border="1px solid" borderColor={borderColor}>
          <ModalHeader color={textColor}>Cancelar Consulta</ModalHeader>
          <ModalCloseButton color={subTextColor} />
          <ModalBody>
            <Text mb={4} color={subTextColor}>
              Deseja realmente cancelar sua consulta com o(a) <b>{selectedApp?.doctor?.nome}</b> no dia <b>{selectedApp?.data_horario ? new Date(selectedApp.data_horario).toLocaleDateString('pt-BR') : ''}</b>?
            </Text>
            <FormControl isRequired>
              <FormLabel color={labelColor}>Motivo do Cancelamento</FormLabel>
              <Textarea
                bg={inputBg} color={textColor} border="1px solid" borderColor={inputBorder}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo brevemente..."
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCancelClose} color={subTextColor}>Voltar</Button>
            <Button colorScheme="red" onClick={handleCancelAppointment} isLoading={submitting}>
              Confirmar Cancelamento
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL DE REAGENDAMENTO */}
      <Modal isOpen={isRescheduleOpen} onClose={onRescheduleClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={bgCard} border="1px solid" borderColor={borderColor}>
          <ModalHeader color={textColor}>Reagendar Consulta</ModalHeader>
          <ModalCloseButton color={subTextColor} />
          <ModalBody>
            <Text mb={4} color={subTextColor}>
              Escolha uma nova data e horário para a consulta com o(a) <b>{selectedApp?.doctor?.nome}</b>.
            </Text>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color={labelColor}>Nova Data</FormLabel>
                <Box sx={{ '.react-datepicker-wrapper': { width: '100%' } }}>
                  <DatePicker
                    locale="pt-BR"
                    dateFormat="dd/MM/yyyy"
                    selected={parseLocalDate(rescheduleData.data)}
                    onChange={(date) => {
                      setRescheduleData({...rescheduleData, data: formatLocalDate(date), hora: ''});
                      setRescheduleSlots([]);
                    }}
                    filterDate={(date) => isWeekdayValid(date, selectedApp?.doctor?.id || selectedApp?.doctor_id)}
                    minDate={new Date()}
                    maxDate={dataLimiteObj}
                    placeholderText="Selecione uma data disponível"
                    customInput={
                      <Input bg={inputBg} color={textColor} border="1px solid" borderColor={inputBorder} />
                    }
                  />
                </Box>
              </FormControl>
              
              <FormControl isRequired isDisabled={!rescheduleData.data || fetchingRescheduleSlots}>
                <FormLabel color={labelColor}>Horários Disponíveis</FormLabel>
                {fetchingRescheduleSlots ? (
                  <HStack bg={inputBg} p={2} borderRadius="md" justify="center" border="1px solid" borderColor={inputBorder}>
                    <Spinner size="xs" color={highlightColor} /><Text fontSize="xs" color={textColor}>Buscando vagas...</Text>
                  </HStack>
                ) : (
                  <Select 
                    placeholder={rescheduleSlots.length > 0 ? "Escolha um horário" : "Nenhuma vaga"}
                    bg={inputBg} color={textColor} border="1px solid" borderColor={inputBorder}
                    value={rescheduleData.hora}
                    onChange={(e) => setRescheduleData({...rescheduleData, hora: e.target.value})}
                  >
                    {rescheduleSlots.map((hora) => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </Select>
                )}
              </FormControl>

              <FormControl>
                <FormLabel color={labelColor}>Motivo (Opcional)</FormLabel>
                <Input 
                  type="text" bg={inputBg} color={textColor} border="1px solid" borderColor={inputBorder}
                  value={rescheduleData.motivo}
                  onChange={(e) => setRescheduleData({...rescheduleData, motivo: e.target.value})}
                  placeholder="Ex: Imprevisto no trabalho"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRescheduleClose} color={subTextColor}>Voltar</Button>
            <Button colorScheme="blue" onClick={handleRescheduleAppointment} isLoading={submitting}>
              Confirmar Reagendamento
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}