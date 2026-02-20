import React, { useState, useEffect } from 'react';
import { 
  Box, Heading, Button, VStack, useToast, Spinner, Divider, 
  Container, useColorModeValue, Text, Flex
} from '@chakra-ui/react';
import { FaSave } from 'react-icons/fa';
import api from '../services/api';
import AgendaConfigFields from '../components/profissionais/AgendaConfigFields';

export default function ProfessionalProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  
  // Estado inicial padrão para evitar erro de leitura de propriedade nula
  const [agendaConfig, setAgendaConfig] = useState({
    seg: { ativo: true, inicio: "08:00", fim: "18:00" },
    ter: { ativo: true, inicio: "08:00", fim: "18:00" },
    qua: { ativo: true, inicio: "08:00", fim: "18:00" },
    qui: { ativo: true, inicio: "08:00", fim: "18:00" },
    sex: { ativo: true, inicio: "08:00", fim: "18:00" },
    sab: { ativo: false, inicio: "08:00", fim: "12:00" },
    dom: { ativo: false, inicio: "08:00", fim: "12:00" },
    intervalo: 30 
  });
  
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/doctors/me');
        if (response.data) {
          setDoctorData(response.data);
          if (response.data.agenda_config) {
            setAgendaConfig(response.data.agenda_config);
          }
        }
      } catch (error) {
        toast({ title: "Erro ao carregar perfil", status: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const handleSave = async () => {
    if (!doctorData?.id) return;
    setSaving(true);
    try {
      await api.put(`/doctors/${doctorData.id}`, {
        ...doctorData,
        agenda_config: agendaConfig
      });
      toast({ title: "Agenda atualizada com sucesso!", status: "success" });
    } catch (error) {
      toast({ title: "Erro ao salvar agenda", status: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Se estiver carregando, mostra o Spinner centralizado usando o FLEX
  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box p={8}>
      <Container maxW="container.md">
        <VStack align="stretch" spacing={6} bg={bgCard} p={8} borderRadius="xl" shadow="lg">
          <Heading size="md" color="blue.400">Minha Disponibilidade</Heading>
          <Text color={textColor} fontSize="sm">Ajuste seus dias e horários de atendimento.</Text>
          
          <Divider />

          {/* Renderização condicional segura */}
          {agendaConfig && (
            <AgendaConfigFields 
              config={agendaConfig} 
              setConfig={setAgendaConfig} 
              textColor={textColor}
              bgInput="gray.700"
              borderColor="gray.600"
            />
          )}

          <Button 
            leftIcon={<FaSave />} 
            colorScheme="blue" 
            onClick={handleSave} 
            isLoading={saving}
            size="lg"
            mt={4}
          >
            Salvar Minha Agenda
          </Button>
        </VStack>
      </Container>
    </Box>
  );
}