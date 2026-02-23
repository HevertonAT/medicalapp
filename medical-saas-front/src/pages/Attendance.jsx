import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Text, Textarea, Button, VStack, HStack,
  useToast, Badge, Divider, useColorModeValue
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSave, FaClock, FaPrescriptionBottleAlt, FaFileMedical } from 'react-icons/fa';
import api from '../services/api';
import SpecialtyFormRenderer from '../components/SpecialtyFormRenderer'; // Trazendo o renderizador de especialidades

export default function Attendance() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Recebe dados do paciente via navegação (state)
  const { appointment, patient } = location.state || {};

  // Estados do Prontuário
  const [historico, setHistorico] = useState('');
  const [prescricao, setPrescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('anamnese');

  // Lógica de Especialidades (Configurações Dinâmicas)
  const [specialty, setSpecialty] = useState("");
  const [specialtySettings, setSpecialtySettings] = useState({});
  const [specialtyData, setSpecialtyData] = useState({});

  // Tempo Real
  const [startTime, setStartTime] = useState(null);

  // Ao montar a tela, marca o horário de início e busca as configurações da especialidade
  useEffect(() => {
    if (!appointment && !patient) {
       toast({ title: 'Erro', description: 'Nenhum atendimento selecionado.', status: 'error' });
       navigate('/agenda');
       return;
    }
    setStartTime(new Date());

    async function loadSettings() {
      // Pega a especialidade do médico que está no appointment
      const docSpecialty = appointment?.doctor_especialidade || appointment?.doctor?.especialidade || "Clínico Geral";
      setSpecialty(docSpecialty);
      
      try {
        // Busca as regras que você salvou naquela tela de botões
        const response = await api.get(`/specialties/rules/${docSpecialty}`);
        setSpecialtySettings(response.data);
      } catch (e) {
        // Se a especialidade não tiver regras salvas, não quebra a tela
        setSpecialtySettings({});
      }
    }
    
    loadSettings();
  }, [appointment, patient, navigate, toast]);

  // Função para lidar com mudanças nos campos dinâmicos da especialidade
  const handleSpecialtyChange = (newData) => {
    setSpecialtyData((prev) => ({ ...prev, ...newData }));
  };

  const formatFullDate = (date) => {
    if (!date) return "--";
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  };

  const handleFinish = async () => {
    if (!historico.trim()) {
      toast({ title: 'Atenção', description: 'Preencha o histórico clínico.', status: 'warning' });
      return;
    }

    if (!confirm("Deseja finalizar este atendimento?")) return;

    setLoading(true);
    try {
      const endTime = new Date(); 

      const payload = {
        patient_id: patient?.id,
        appointment_id: appointment?.id,
        historico: historico,
        prescricao: prescricao,
        specialty_data: specialtyData, // Envia os dados extras preenchidos
        data_inicio: startTime, 
        data_fim: endTime
      };

      await api.post('/medical-records/', payload);

      toast({ 
        title: 'Atendimento Finalizado!', 
        description: `Início: ${formatFullDate(startTime)} | Fim: ${formatFullDate(endTime)}`,
        status: 'success',
        duration: 5000
      });

      navigate('/agenda');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Erro ao salvar prontuário.';
      toast({ title: 'Erro ao finalizar.', description: msg, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6} bg="blue.600" p={4} borderRadius="md" color="white" shadow="md">
        <HStack spacing={4}>
            <FaFileMedical size={24} />
            <Box>
                <Heading size="md">Atendimento: {patient?.nome_completo || 'Paciente'}</Heading>
                <Text fontSize="sm" opacity={0.9}>
                    Iniciado em: {formatFullDate(startTime)}
                </Text>
            </Box>
        </HStack>
        <Badge colorScheme="green" variant="solid" p={2} borderRadius="full">
            EM ANDAMENTO
        </Badge>
      </Flex>

      <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
        
        <VStack w={{ base: '100%', md: '250px' }} align="stretch" spacing={2}>
            <Button 
                leftIcon={<FaFileMedical />} 
                justifyContent="flex-start" 
                variant={activeTab === 'anamnese' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setActiveTab('anamnese')}
            >
                Anamnese
            </Button>
            <Button 
                leftIcon={<FaPrescriptionBottleAlt />} 
                justifyContent="flex-start" 
                variant={activeTab === 'prescricao' ? 'solid' : 'ghost'}
                colorScheme="teal"
                onClick={() => setActiveTab('prescricao')}
            >
                Prescrição
            </Button>
        </VStack>

        <Box flex="1" bg={bgCard} p={6} borderRadius="lg" border="1px" borderColor={borderColor} shadow="sm">
            
            {activeTab === 'anamnese' && (
                <VStack align="stretch" spacing={6}>
                    
                    <Box>
                      <Heading size="sm" color="gray.500" mb={2}>Histórico e Queixas Principais:</Heading>
                      <Textarea 
                          placeholder="Descreva os sintomas, histórico da doença atual (HDA) e observações gerais..." 
                          minH="150px"
                          value={historico}
                          onChange={(e) => setHistorico(e.target.value)}
                          borderColor={borderColor}
                          _focus={{ borderColor: 'blue.400' }}
                      />
                    </Box>

                    {/* Aqui entra a mágica: O componente vai ler as regras e mostrar apenas o que foi ativado para a especialidade */}
                    <SpecialtyFormRenderer 
                      specialty={specialty} 
                      settings={specialtySettings} 
                      data={specialtyData} 
                      onChange={handleSpecialtyChange} 
                    />

                </VStack>
            )}

            {activeTab === 'prescricao' && (
                <VStack align="stretch" spacing={4}>
                    <Heading size="sm" color="gray.500">Prescrição Médica e Exames:</Heading>
                    <Textarea 
                        placeholder="Medicamentos, posologia, encaminhamentos ou exames solicitados..." 
                        minH="300px"
                        value={prescricao}
                        onChange={(e) => setPrescricao(e.target.value)}
                        borderColor={borderColor}
                        _focus={{ borderColor: 'teal.400' }}
                    />
                </VStack>
            )}

            <Divider my={6} />

            <Flex justify="flex-end" gap={4}>
                <Button variant="ghost" colorScheme="red" onClick={() => navigate('/agenda')}>
                    Cancelar / Sair
                </Button>
                <Button 
                    leftIcon={<FaSave />} 
                    colorScheme="green" 
                    size="lg" 
                    onClick={handleFinish}
                    isLoading={loading}
                    loadingText="Salvando..."
                >
                    Finalizar Prontuário
                </Button>
            </Flex>

        </Box>
      </Flex>
    </Box>
  );
}