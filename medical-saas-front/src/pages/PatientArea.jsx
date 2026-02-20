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

  // --- NOVOS ESTADOS PARA AGENDA INTELIGENTE ---
  const [availableSlots, setAvailableSlots] = useState([]); 
  const [fetchingSlots, setFetchingSlots] = useState(false); 

  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [newAppointment, setNewAppointment] = useState({
    doctor_id: '',
    data: '',
    hora: '',
    observacoes: ''
  });

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

  // --- BUSCA DE HORÁRIOS DISPONÍVEIS ---
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
      toast({ title: 'Erro ao agendar', status: 'error' });
    } finally { setBookingLoading(false); }
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
          <TabPanel px={0}>
            {/* Listagem de agendamentos omitida para brevidade, mas mantida no seu arquivo */}
          </TabPanel>

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
                        min={hoje} // Impede retroativos
                        max={dataMaxima} // Impede mais de 1 ano à frente
                        value={newAppointment.data}
                        onChange={(e) => {
                          const val = e.target.value;
                          const year = val.split('-')[0];
                          // Trava para evitar anos com mais de 4 dígitos
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
    </Box>
  );
}