import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Heading, Text, Button, VStack, HStack, Icon, useToast,
  Spinner, useColorModeValue, Tabs, TabList, TabPanels, Tab, TabPanel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, FormControl, FormLabel, Input, Textarea, useDisclosure,
  Divider, SimpleGrid, Select, Container
} from '@chakra-ui/react';
import { FaCalendarAlt, FaUserMd, FaCalendarPlus, FaTimes, FaCheckCircle, FaClock } from 'react-icons/fa';
import api from '../services/api';

export default function PatientArea() {
  // --- LÓGICA DE LIMITES DE DATA ---
  const hoje = new Date().toISOString().split('T')[0];
  const dataLimiteObj = new Date();
  dataLimiteObj.setFullYear(dataLimiteObj.getFullYear() + 1);
  const dataMaxima = dataLimiteObj.toISOString().split('T')[0];

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
    doctor_id: '',
    data: '',
    hora: '',
    observacoes: ''
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

  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = 'gray.700'; 

  // --- BUSCA DE HORÁRIOS DISPONÍVEIS (NOVO AGENDAMENTO) ---
  const fetchAvailableSlots = useCallback(async () => {
    if (!newAppointment.doctor_id || !newAppointment.data) {
      setAvailableSlots([]);
      return;
    }

    setFetchingSlots(true);
    try {
      const response = await api.get('/appointments/available-slots', {
        params: {
          doctor_id: newAppointment.doctor_id,
          data: newAppointment.data
        }
      });
      setAvailableSlots(response.data || []);
    } catch (error) {
      console.error(error);
      setAvailableSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  }, [newAppointment.doctor_id, newAppointment.data]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  // --- BUSCA DE HORÁRIOS DISPONÍVEIS (REAGENDAMENTO) ---
  const fetchRescheduleSlots = useCallback(async () => {
    const doctorId = selectedApp?.doctor?.id || selectedApp?.doctor_id;

    if (!doctorId || !rescheduleData.data) {
      setRescheduleSlots([]);
      return;
    }

    setFetchingRescheduleSlots(true);
    try {
      const response = await api.get('/appointments/available-slots', {
        params: {
          doctor_id: doctorId,
          data: rescheduleData.data
        }
      });
      setRescheduleSlots(response.data || []);
    } catch (error) {
      console.error(error);
      setRescheduleSlots([]);
    } finally {
      setFetchingRescheduleSlots(false);
    }
  }, [selectedApp, rescheduleData.data]);

  useEffect(() => {
    fetchRescheduleSlots();
  }, [fetchRescheduleSlots]);


  // --- CARREGAMENTO INICIAL DOS DADOS ---
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

  // --- FUNÇÕES DE AÇÃO (CRIAR, CANCELAR, REAGENDAR) ---
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
    } catch (error) {
      toast({ title: 'Erro ao cancelar consulta.', status: 'error' });
    } finally {
      setSubmitting(false);
    }
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
    } catch (error) {
      toast({ title: 'Erro ao reagendar consulta.', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Heading size="lg" mb={8} color={useColorModeValue("gray.700", "white")}>Área do Paciente</Heading>

      <Tabs variant="line" colorScheme="blue" index={tabIndex} onChange={setTabIndex}>
        <TabList mb={6}>
          <Tab fontWeight="bold">Meus Agendamentos</Tab>
          <Tab fontWeight="bold">Novo Agendamento</Tab>
        </TabList>

        <TabPanels>
          {/* ABA 1: MEUS AGENDAMENTOS */}
          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              {loading ? (
                <Flex justify="center" p={8}><Spinner color="blue.500" size="xl" /></Flex>
              ) : appointments.length === 0 ? (
                <Box bg={bgCard} p={8} borderRadius="xl" textAlign="center" border="1px solid" borderColor={borderColor}>
                  <Icon as={FaCalendarAlt} boxSize={10} color="gray.400" mb={4} />
                  <Text color="gray.400" fontSize="lg">Você ainda não possui agendamentos.</Text>
                </Box>
              ) : (
                appointments.map((app) => (
                  <Box key={app.id} p={5} bg={bgCard} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                    <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
                      <Box>
                        <Text fontWeight="bold" fontSize="lg" color="blue.300" display="flex" alignItems="center" gap={2}>
                          <Icon as={FaUserMd} />
                          {app.doctor?.nome || 'Profissional não informado'}
                        </Text>
                        
                        <Text color="gray.300" display="flex" alignItems="center" gap={2} mt={2}>
                          <Icon as={FaClock} />
                          {app.data_horario ? new Date(app.data_horario).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          }) : 'Data indefinida'}
                        </Text>
                        
                        {/* A Mágica de Ocultar Status Internos Acontece Aqui */}
                        <Text 
                          fontSize="sm" 
                          color={app.status?.toLowerCase() === 'cancelado' ? 'red.400' : 'gray.400'} 
                          fontWeight={app.status?.toLowerCase() === 'cancelado' ? 'bold' : 'normal'}
                          mt={1}
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
                            // Reseta os dados de reagendamento ao abrir o modal
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
                <Heading size="md" mb={6} color="blue.300" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaCalendarPlus} /> Agende sua consulta
                </Heading>

                <VStack spacing={5}>
                  <FormControl>
                    <FormLabel color="gray.300">Especialidade</FormLabel>
                    <Select 
                      placeholder="Todas as especialidades" 
                      bg={inputBg} border="none" color="white"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                      {specialties.map((spec, idx) => (
                        <option key={idx} value={spec} style={{ color: 'black' }}>{spec}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="gray.300">Profissional</FormLabel>
                    <Select 
                      placeholder="Selecione o médico..." 
                      bg={inputBg} border="none" color="white"
                      value={newAppointment.doctor_id}
                      onChange={(e) => {
                        setNewAppointment({ ...newAppointment, doctor_id: e.target.value, hora: '' });
                        setAvailableSlots([]);
                      }}
                    >
                      {filteredDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id} style={{ color: 'black' }}>{doc.nome}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} w="full">
                    <FormControl isRequired>
                      <FormLabel color="gray.300">Data</FormLabel>
                      <Input 
                        type="date" bg={inputBg} border="none" color="white"
                        min={hoje} max={dataMaxima}
                        value={newAppointment.data}
                        onChange={(e) => {
                          const val = e.target.value;
                          const year = val.split('-')[0];
                          if (year.length > 4) return;
                          
                          setNewAppointment({ ...newAppointment, data: val, hora: '' });
                          setAvailableSlots([]);
                        }}
                      />
                    </FormControl>

                    <FormControl isRequired isDisabled={!newAppointment.data || fetchingSlots}>
                      <FormLabel color="gray.300">Horários Disponíveis</FormLabel>
                      {fetchingSlots ? (
                        <HStack bg={inputBg} p={2} borderRadius="md" justify="center">
                          <Spinner size="xs" /><Text fontSize="xs">Buscando vagas...</Text>
                        </HStack>
                      ) : (
                        <Select 
                          placeholder={availableSlots.length > 0 ? "Escolha um horário" : "Nenhuma vaga"}
                          bg={inputBg} border="none" color="white"
                          value={newAppointment.hora}
                          onChange={(e) => setNewAppointment({ ...newAppointment, hora: e.target.value })}
                        >
                          {availableSlots.map((hora) => (
                            <option key={hora} value={hora} style={{ color: 'black' }}>{hora}</option>
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
          <ModalHeader color={useColorModeValue('gray.700', 'white')}>Cancelar Consulta</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Text mb={4} color="gray.300">
              Deseja realmente cancelar sua consulta com Dr(a) <b>{selectedApp?.doctor?.nome}</b> no dia <b>{selectedApp?.data_horario ? new Date(selectedApp.data_horario).toLocaleDateString('pt-BR') : ''}</b>?
            </Text>
            <FormControl isRequired>
              <FormLabel color="gray.300">Motivo do Cancelamento</FormLabel>
              <Textarea
                bg={inputBg} color="white" border="none"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo brevemente..."
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCancelClose} color="gray.400">Voltar</Button>
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
          <ModalHeader color={useColorModeValue('gray.700', 'white')}>Reagendar Consulta</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Text mb={4} color="gray.300">
              Escolha uma nova data e horário para a consulta com Dr(a) <b>{selectedApp?.doctor?.nome}</b>.
            </Text>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color="gray.300">Nova Data</FormLabel>
                <Input 
                  type="date" bg={inputBg} color="white" border="none" 
                  min={hoje} max={dataMaxima}
                  value={rescheduleData.data}
                  onChange={(e) => {
                    setRescheduleData({...rescheduleData, data: e.target.value, hora: ''});
                    setRescheduleSlots([]);
                  }}
                />
              </FormControl>
              
              <FormControl isRequired isDisabled={!rescheduleData.data || fetchingRescheduleSlots}>
                <FormLabel color="gray.300">Horários Disponíveis</FormLabel>
                {fetchingRescheduleSlots ? (
                  <HStack bg={inputBg} p={2} borderRadius="md" justify="center">
                    <Spinner size="xs" /><Text fontSize="xs">Buscando vagas...</Text>
                  </HStack>
                ) : (
                  <Select 
                    placeholder={rescheduleSlots.length > 0 ? "Escolha um horário" : "Nenhuma vaga"}
                    bg={inputBg} border="none" color="white"
                    value={rescheduleData.hora}
                    onChange={(e) => setRescheduleData({...rescheduleData, hora: e.target.value})}
                  >
                    {rescheduleSlots.map((hora) => (
                      <option key={hora} value={hora} style={{ color: 'black' }}>{hora}</option>
                    ))}
                  </Select>
                )}
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">Motivo (Opcional)</FormLabel>
                <Input 
                  type="text" bg={inputBg} color="white" border="none"
                  value={rescheduleData.motivo}
                  onChange={(e) => setRescheduleData({...rescheduleData, motivo: e.target.value})}
                  placeholder="Ex: Imprevisto no trabalho"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRescheduleClose} color="gray.400">Voltar</Button>
            <Button colorScheme="blue" onClick={handleRescheduleAppointment} isLoading={submitting}>
              Confirmar Reagendamento
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}