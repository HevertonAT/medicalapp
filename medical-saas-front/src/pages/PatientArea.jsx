import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Heading, Text, Button, VStack, HStack, Icon, useToast,
  Badge, Spinner, useColorModeValue, Tabs, TabList, TabPanels, Tab, TabPanel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, FormControl, FormLabel, Input, Textarea, useDisclosure,
  Divider, SimpleGrid, Select, Container
} from '@chakra-ui/react';
import { FaCalendarAlt, FaClock, FaUserMd, FaHistory, FaCalendarPlus, FaTimes, FaCheckCircle } from 'react-icons/fa';

// IMPORTAÇÃO CORRETA DA API
import api from '../services/api';

export default function PatientArea() {
  // --- ESTADOS DE DADOS ---
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DO FORMULÁRIO DE NOVO AGENDAMENTO ---
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [newAppointment, setNewAppointment] = useState({
    doctor_id: '',
    data: '',
    hora: '',
    observacoes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0); 

  // --- ESTADOS DE MODAIS ---
  const { isOpen: isRescheduleOpen, onOpen: onRescheduleOpen, onClose: onRescheduleClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();

  const [selectedApp, setSelectedApp] = useState(null);
  
  // Dados dos formulários de modal
  const [rescheduleData, setRescheduleData] = useState({ data: '', hora: '', motivo: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  // --- CORES ---
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'REALIZADO': return 'green.300'; 
      case 'AGENDADO': return 'purple.400';
      case 'REAGENDADO': return 'cyan.300';
      case 'CANCELADO': return 'red.400';
      default: return 'gray.400';
    }
  };

  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = 'gray.700'; 

  // --- BUSCAR DADOS (Usando api.get) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, docRes] = await Promise.all([
        api.get('/appointments/me'), // Rota corrigida para usar api.js
        api.get('/doctors/') 
      ]);
      setAppointments(appRes.data);
      setDoctors(docRes.data || []);
    } catch (error) {
      console.error(error);
      // Não exibimos toast de erro se for apenas "não autorizado" (redireciona no login)
      if (error.response?.status !== 401) {
          toast({ title: 'Erro ao carregar dados.', status: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- LÓGICA DE FILTRO ---
  const specialties = [...new Set(doctors.map(d => d.especialidade).filter(Boolean))];
  const filteredDoctors = selectedSpecialty 
    ? doctors.filter(d => d.especialidade === selectedSpecialty)
    : doctors;

  // --- CRIAR NOVO AGENDAMENTO ---
  const handleCreateAppointment = async () => {
    if (!newAppointment.doctor_id || !newAppointment.data || !newAppointment.hora) {
      toast({ title: 'Preencha todos os campos obrigatórios.', status: 'warning' });
      return;
    }

    setBookingLoading(true);
    try {
      const dataHorario = `${newAppointment.data}T${newAppointment.hora}:00`;
      
      // Uso direto da api
      await api.post('/appointments/', {
        doctor_id: newAppointment.doctor_id,
        data_horario: dataHorario,
        observacoes: newAppointment.observacoes,
        duracao: 30 
      });

      toast({ 
        title: 'Agendamento Confirmado!', 
        description: 'Sua consulta foi marcada com sucesso.', 
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      setNewAppointment({ doctor_id: '', data: '', hora: '', observacoes: '' });
      setSelectedSpecialty('');
      
      fetchData();
      setTabIndex(0); 

    } catch (error) {
      const msg = error.response?.data?.detail || 'Erro ao realizar agendamento.';
      toast({ title: 'Erro ao agendar', description: msg, status: 'error' });
    } finally {
      setBookingLoading(false);
    }
  };

  // --- LÓGICA REAGENDAMENTO ---
  const openReschedule = (app) => {
    setSelectedApp(app);
    const currentIso = app.data_horario.split('T');
    setRescheduleData({ 
      data: currentIso[0], 
      hora: currentIso[1].slice(0, 5),
      motivo: '' 
    });
    onRescheduleOpen();
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleData.data || !rescheduleData.hora || !rescheduleData.motivo) {
      toast({ title: 'Preencha todos os campos.', status: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const dataHorario = `${rescheduleData.data}T${rescheduleData.hora}:00`;
      await api.patch(`/appointments/${selectedApp.id}/reschedule`, {
        data_horario: dataHorario,
        motivo: rescheduleData.motivo
      });
      toast({ title: 'Solicitação enviada!', status: 'success' });
      onRescheduleClose();
      fetchData();
    } catch (error) {
      toast({ title: 'Falha no reagendamento', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- LÓGICA CANCELAMENTO ---
  const openCancel = (app) => {
      setSelectedApp(app);
      setCancelReason('');
      onCancelOpen();
  };

  const handleConfirmCancel = async () => {
    setSubmitting(true);
    try {
        await api.patch(`/appointments/${selectedApp.id}/status`, null, {
            params: { novo_status: 'CANCELADO' }
        });
        toast({ title: 'Consulta cancelada.', status: 'success' });
        onCancelClose();
        fetchData();
    } catch (error) {
        toast({ title: 'Erro ao cancelar.', status: 'error' });
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Heading size="lg" mb={8} color={useColorModeValue("gray.700", "white")}>Área do Paciente</Heading>

      <Tabs variant="line" colorScheme="blue" index={tabIndex} onChange={(index) => setTabIndex(index)}>
        <TabList mb={6}>
          <Tab fontWeight="bold">Meus Agendamentos</Tab>
          <Tab fontWeight="bold">Novo Agendamento</Tab>
        </TabList>

        <TabPanels>
          {/* ABA 1: MEUS AGENDAMENTOS */}
          <TabPanel px={0}>
            {loading ? (
              <Flex justify="center" p={10}><Spinner color="blue.500" /></Flex>
            ) : appointments.length === 0 ? (
              <Text color="gray.500">Você ainda não possui agendamentos.</Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {appointments.map((app) => (
                  <Box 
                    key={app.id} 
                    p={5} 
                    bg={bgCard} 
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor={borderColor}
                    boxShadow="sm"
                  >
                    <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
                      <HStack spacing={6}>
                        <VStack align="start" spacing={1}>
                          <HStack color={useColorModeValue("gray.700", "white")}>
                            <Icon as={FaCalendarAlt} />
                            <Text fontWeight="bold" fontSize="lg">
                              {new Date(app.data_horario).toLocaleDateString('pt-BR')} às {new Date(app.data_horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </HStack>
                          <HStack color="gray.400" fontSize="sm">
                            <Icon as={FaUserMd} />
                            <Text>Dr(a). {app.doctor?.nome || app.doctor_nome || "Não informado"}</Text>
                          </HStack>
                        </VStack>
                      </HStack>

                      <HStack spacing={4}>
                        <Text 
                          fontWeight="extrabold" 
                          fontSize="xs" 
                          letterSpacing="wider"
                          color={getStatusColor(app.status)}
                          textTransform="uppercase"
                        >
                          {app.status}
                        </Text>
                        
                        {(app.status.toUpperCase() === 'AGENDADO' || app.status.toUpperCase() === 'REAGENDADO') && (
                          <>
                              <Button 
                                leftIcon={<FaCalendarPlus />} 
                                size="sm" 
                                variant="outline" 
                                colorScheme="blue"
                                onClick={() => openReschedule(app)}
                              >
                                Reagendar
                              </Button>

                              <Button 
                                leftIcon={<FaTimes />} 
                                size="sm" 
                                variant="outline" 
                                borderColor="red.400" 
                                color="red.400"
                                _hover={{ bg: 'red.900', borderColor: 'red.300', color: 'red.300' }}
                                onClick={() => openCancel(app)}
                              >
                                Cancelar
                              </Button>
                          </>
                        )}
                      </HStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* ABA 2: NOVO AGENDAMENTO */}
          <TabPanel px={0}>
            <Container maxW="container.md" p={0}>
              <Box bg={bgCard} p={8} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="lg">
                <Heading size="md" mb={6} color="blue.300" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaCalendarPlus} /> Agende sua consulta
                </Heading>

                <VStack spacing={5}>
                  
                  {/* Filtro de Especialidade */}
                  <FormControl>
                    <FormLabel color="gray.300">Especialidade</FormLabel>
                    <Select 
                      placeholder="Todas as especialidades" 
                      bg={inputBg} 
                      border="none"
                      color="white"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                      {specialties.map((spec, idx) => (
                        <option key={idx} value={spec} style={{ color: 'black' }}>{spec}</option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Seleção de Profissional */}
                  <FormControl isRequired>
                    <FormLabel color="gray.300">Profissional</FormLabel>
                    <Select 
                      placeholder="Selecione o médico..." 
                      bg={inputBg} 
                      border="none"
                      color="white"
                      value={newAppointment.doctor_id}
                      onChange={(e) => setNewAppointment({ ...newAppointment, doctor_id: e.target.value })}
                    >
                      {filteredDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id} style={{ color: 'black' }}>
                          {doc.nome} {doc.especialidade ? `(${doc.especialidade})` : ''}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} w="full">
                    <FormControl isRequired>
                      <FormLabel color="gray.300">Data</FormLabel>
                      <Input 
                        type="date" 
                        bg={inputBg} 
                        border="none"
                        color="white"
                        value={newAppointment.data}
                        onChange={(e) => setNewAppointment({ ...newAppointment, data: e.target.value })}
                        css={{ '::-webkit-calendar-picker-indicator': { filter: 'invert(1)' } }}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel color="gray.300">Horário</FormLabel>
                      <Input 
                        type="time" 
                        bg={inputBg} 
                        border="none"
                        color="white"
                        value={newAppointment.hora}
                        onChange={(e) => setNewAppointment({ ...newAppointment, hora: e.target.value })}
                        css={{ '::-webkit-calendar-picker-indicator': { filter: 'invert(1)' } }}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel color="gray.300">Observações (Opcional)</FormLabel>
                    <Textarea 
                      placeholder="Ex: Primeira consulta, sintomas, etc..." 
                      bg={inputBg} 
                      border="none"
                      color="white"
                      rows={3}
                      value={newAppointment.observacoes}
                      onChange={(e) => setNewAppointment({ ...newAppointment, observacoes: e.target.value })}
                    />
                  </FormControl>

                  <Button 
                    colorScheme="blue" 
                    size="lg" 
                    w="full" 
                    mt={4}
                    onClick={handleCreateAppointment}
                    isLoading={bookingLoading}
                    loadingText="Confirmando..."
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

      {/* MODAL DE REAGENDAMENTO */}
      <Modal isOpen={isRescheduleOpen} onClose={onRescheduleClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.700">Solicitar Reagendamento</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Nova Data</FormLabel>
                  <Input type="date" bg="gray.700" border="none" value={rescheduleData.data} onChange={(e) => setRescheduleData({...rescheduleData, data: e.target.value})} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Nova Hora</FormLabel>
                  <Input type="time" bg="gray.700" border="none" value={rescheduleData.hora} onChange={(e) => setRescheduleData({...rescheduleData, hora: e.target.value})} />
                </FormControl>
              </SimpleGrid>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Motivo do Reagendamento</FormLabel>
                <Textarea placeholder="Explique o motivo..." bg="gray.700" border="none" rows={4} value={rescheduleData.motivo} onChange={(e) => setRescheduleData({...rescheduleData, motivo: e.target.value})} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.700">
            <Button variant="ghost" mr={3} onClick={onRescheduleClose} isDisabled={submitting}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleConfirmReschedule} isLoading={submitting}>Confirmar Alteração</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL DE CANCELAMENTO */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose} isCentered>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent bg="gray.800" color="white" border="1px solid" borderColor="red.500">
          <ModalHeader color="red.400" display="flex" alignItems="center" gap={2}><Icon as={FaTimes} /> Cancelar Consulta</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>Tem certeza que deseja cancelar o agendamento com <Text as="span" fontWeight="bold" color="red.300"> Dr(a). {selectedApp?.doctor?.nome || selectedApp?.doctor_nome}</Text>?</Text>
            <FormControl mt={4}><FormLabel fontSize="sm">Motivo (Opcional)</FormLabel><Input placeholder="Ex: Imprevisto..." bg="gray.700" border="none" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} /></FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCancelClose} isDisabled={submitting}>Manter Consulta</Button>
            <Button colorScheme="red" onClick={handleConfirmCancel} isLoading={submitting}>Confirmar Cancelamento</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}