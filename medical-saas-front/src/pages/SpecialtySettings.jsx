import React, { useEffect, useState } from "react";
import {
  Box, Heading, Button, VStack, HStack, Switch, FormControl,
  FormLabel, Spinner, useToast, Text, Divider, Flex, Badge, Card, CardBody,
  useColorModeValue, SimpleGrid, Select, Icon
} from "@chakra-ui/react";
import { FaStethoscope, FaBuilding } from 'react-icons/fa';
import { jwtDecode } from "jwt-decode";
import api from '../services/api';
import { listRules, createRule, updateRule, MASTER_SPECIALTIES } from "../services/specialtyService";

const DEFAULT_SETTINGS = {
  require_patient_cpf: true, require_responsible_cpf: false, enable_birth_data: false,      
  enable_gestation_data: false, require_laterality: false, require_blood_pressure: true,  
  enable_vision_data: false, enable_session_control: false, enable_advanced_vitals: false,
  enable_anthropometry: false, enable_mental_status: false, enable_isolation_alerts: false
};

export default function SpecialtySettings() {
  const [loggedUser, setLoggedUser] = useState(null);
  
  // Estados para o Superuser
  const [allClinics, setAllClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");

  const [availableSpecialties, setAvailableSpecialties] = useState([]); // A lista inteligente
  const [rules, setRules] = useState([]); 
  const [selectedSpec, setSelectedSpec] = useState(""); 
  const [currentSettings, setCurrentSettings] = useState(DEFAULT_SETTINGS); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const toast = useToast();

  const bgPage = useColorModeValue("gray.50", "gray.900");
  const bgCard = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const itemHover = useColorModeValue("gray.100", "whiteAlpha.100"); 
  const itemActiveBg = useColorModeValue("blue.50", "blue.900");
  const itemActiveText = useColorModeValue("blue.700", "blue.200");
  const itemBorderActive = useColorModeValue("blue.500", "blue.300");
  const blockBg = useColorModeValue("gray.50", "whiteAlpha.50"); 
  const inputBg = useColorModeValue("white", "gray.700");
  // 1. Descobrir quem está logado
  useEffect(() => {
      const token = localStorage.getItem('medical_token');
      if (token) {
          const decoded = jwtDecode(token);
          setLoggedUser(decoded);
          
          if (decoded.role === 'superuser') {
              fetchClinicsForSuperuser();
          } else {
              // Se for admin, já carrega a própria clínica
              setSelectedClinicId(decoded.clinic_id);
          }
      }
  }, []);

  const fetchClinicsForSuperuser = async () => {
      try {
          const res = await api.get('/clinics/');
          setAllClinics(Array.isArray(res.data) ? res.data : []);
      } catch (e) { console.error("Erro ao buscar clínicas", e); }
  };

  // 2. Quando a clínica mudar, buscar médicos e regras
  useEffect(() => {
      if (selectedClinicId) {
          loadClinicData(selectedClinicId);
      } else {
          setAvailableSpecialties([]);
          setRules([]);
          setSelectedSpec("");
          setLoading(false);
      }
  }, [selectedClinicId]);

  async function loadClinicData(clinicId) {
    setLoading(true);
    try {
      // Busca médicos daquela clínica
      const docRes = await api.get('/doctors/');
      const clinicDoctors = docRes.data.filter(d => String(d.clinic_id) === String(clinicId));
      
      // Extrai especialidades únicas dos médicos
      const uniqueSpecs = [...new Set(clinicDoctors.map(d => {
          let spec = d.especialidade || 'Clínico Geral';
          return spec.charAt(0).toUpperCase() + spec.slice(1);
      }))];

      // Filtra apenas as especialidades que existem na nossa MASTER LIST
      const filteredSpecs = MASTER_SPECIALTIES.filter(masterSpec => uniqueSpecs.includes(masterSpec));
      
      setAvailableSpecialties(filteredSpecs);
      if (filteredSpecs.length > 0) setSelectedSpec(filteredSpecs[0]);
      else setSelectedSpec("");

      // Busca as regras passando a clínica na URL (Para o Superuser poder ver)
      const ruleRes = await api.get(`/specialties/?clinic_id=${clinicId}`);
      setRules(ruleRes.data || []);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // 3. Atualizar o formulário quando a especialidade muda
  useEffect(() => {
    if (selectedSpec) {
        const foundRule = rules.find(r => r.specialty === selectedSpec);
        if (foundRule) {
            setCurrentSettings({ ...DEFAULT_SETTINGS, ...foundRule.settings });
        } else {
            setCurrentSettings(DEFAULT_SETTINGS);
        }
    }
  }, [selectedSpec, rules]);

  const toggleFlag = (key) => {
    setCurrentSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function handleSave() {
    if (!selectedSpec || !selectedClinicId) return;
    setSaving(true);
    try {
      const payload = {
        specialty: selectedSpec,
        settings: currentSettings,
        active: true,
        clinic_id: loggedUser?.role === 'superuser' ? parseInt(selectedClinicId) : null
      };

      await api.post("/specialties/", payload);
      toast({ title: 'Configurações salvas com sucesso!', status: 'success' });
      loadClinicData(selectedClinicId); 
    } catch (e) {
      toast({ title: 'Erro ao salvar', status: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Flex h="85vh" gap={6} p={6} bg={bgPage} direction="column">
      
      {/* SELETOR SUPERUSER NO TOPO (Escondido para Admin) */}
      {loggedUser?.role === 'superuser' && (
          <Card bg={bgCard} borderColor={borderColor} variant="outline" p={4} mb={2}>
              <HStack spacing={4}>
                  <Icon as={FaBuilding} color="blue.500" w={5} h={5} />
                  <Text fontWeight="bold" color={textColor}>Selecionar Cliente:</Text>
                  <Select 
                      maxW="400px" 
                      bg={inputBg} 
                      borderColor={borderColor}
                      placeholder="Escolha uma clínica para configurar..."
                      value={selectedClinicId}
                      onChange={(e) => setSelectedClinicId(e.target.value)}
                  >
                      {allClinics.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                  </Select>
              </HStack>
          </Card>
      )}

      <Flex flex={1} gap={6} overflow="hidden">
        {/* --- PAINEL ESQUERDO: LISTA INTELIGENTE --- */}
        <Card w="300px" h="full" variant="outline" bg={bgCard} borderColor={borderColor}>
          <Box p={4} borderBottomWidth={1} borderColor={borderColor}>
            <Heading size="md" color={textColor}>Especialidades</Heading>
            <Text fontSize="xs" color={subTextColor}>
                {loggedUser?.role === 'superuser' && !selectedClinicId 
                    ? "Selecione um cliente acima" 
                    : "Detectadas automaticamente"}
            </Text>
          </Box>
          <VStack align="stretch" spacing={0} overflowY="auto" h="full">
            
            {loading && <Spinner alignSelf="center" mt={10} color="blue.500" />}
            
            {!loading && availableSpecialties.length === 0 && selectedClinicId && (
                <Box p={6} textAlign="center">
                    <Icon as={FaStethoscope} color="gray.300" w={8} h={8} mb={3} />
                    <Text fontSize="sm" color="gray.500">
                        Nenhuma especialidade detectada. Cadastre médicos na tela "Profissionais" primeiro.
                    </Text>
                </Box>
            )}

            {!loading && availableSpecialties.map(spec => {
              const hasConfig = rules.some(r => r.specialty === spec);
              const isSelected = selectedSpec === spec;
              
              return (
                <Box 
                  key={spec} 
                  p={4} 
                  cursor="pointer"
                  bg={isSelected ? itemActiveBg : "transparent"}
                  borderLeftWidth={4}
                  borderLeftColor={isSelected ? itemBorderActive : "transparent"}
                  _hover={{ bg: isSelected ? itemActiveBg : itemHover }}
                  onClick={() => setSelectedSpec(spec)}
                  transition="all 0.2s"
                >
                  <Flex justify="space-between" align="center">
                    <Text fontWeight={isSelected ? "bold" : "normal"} color={isSelected ? itemActiveText : textColor}>
                      {spec}
                    </Text>
                    {hasConfig && <Badge colorScheme="green" variant="solid" fontSize="0.5em">CONFIG</Badge>}
                  </Flex>
                </Box>
              )
            })}
          </VStack>
        </Card>

        {/* --- PAINEL DIREITO: CONFIG --- */}
        <Card flex={1} h="full" variant="outline" bg={bgCard} borderColor={borderColor}>
          {selectedSpec ? (
              <CardBody display="flex" flexDirection="column" h="full">
                <Flex justify="space-between" align="center" mb={6}>
                  <Box>
                    <Heading size="md" color={textColor}>Configurações: {selectedSpec}</Heading>
                    <Text fontSize="sm" color={subTextColor}>Regras aplicadas aos formulários médicos.</Text>
                  </Box>
                  <Button colorScheme="blue" onClick={handleSave} isLoading={saving}>
                    Salvar Configurações
                  </Button>
                </Flex>

                {loading ? (
                  <Flex justify="center" align="center" flex={1}><Spinner size="xl" color="blue.500" /></Flex>
                ) : (
                  <VStack align="stretch" spacing={8} overflowY="auto" px={4} pb={8}>
                    
                    {/* GRUPO 1: VALIDAÇÃO */}
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" mb={4} color={textColor}>Validação de Documentos</Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl display="flex" alignItems="center" bg={blockBg} p={4} borderRadius="md" border="1px solid" borderColor={borderColor}>
                          <Switch id="cpf-paciente" isChecked={currentSettings.require_patient_cpf} onChange={() => toggleFlag("require_patient_cpf")} colorScheme="green" mr={3} />
                          <FormLabel htmlFor="cpf-paciente" mb={0} cursor="pointer" color={textColor} fontSize="sm" fontWeight="medium">Exigir CPF do Paciente</FormLabel>
                        </FormControl>
                        <FormControl display="flex" alignItems="center" bg={blockBg} p={4} borderRadius="md" border="1px solid" borderColor={borderColor}>
                          <Switch id="cpf-resp" isChecked={currentSettings.require_responsible_cpf} onChange={() => toggleFlag("require_responsible_cpf")} colorScheme="green" mr={3} />
                          <FormLabel htmlFor="cpf-resp" mb={0} cursor="pointer" color={textColor} fontSize="sm" fontWeight="medium">Exigir CPF Responsável</FormLabel>
                        </FormControl>
                      </SimpleGrid>
                    </Box>

                    <Divider borderColor={borderColor} />

                    {/* GRUPO 2: CAMPOS BÁSICOS */}
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" mb={4} color={textColor}>Campos Clínicos Básicos</Text>
                      <Flex direction="column" gap={3}>
                        <ConfigItem title="Habilitar Dados de Nascimento" desc="Exibe Peso, Altura, PC, APGAR (Pediatria)" isChecked={currentSettings.enable_birth_data} onChange={() => toggleFlag("enable_birth_data")} colorScheme="blue" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                        <ConfigItem title="Habilitar Campos de Gestação" desc="Exibe DUM e DPP (Ginecologia/Obstetrícia)" isChecked={currentSettings.enable_gestation_data} onChange={() => toggleFlag("enable_gestation_data")} colorScheme="blue" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                        <ConfigItem title="Habilitar Campos de Visão" desc="Exibe campos para Olho Direito (OD) e Esquerdo (OE)" isChecked={currentSettings.enable_vision_data} onChange={() => toggleFlag("enable_vision_data")} colorScheme="blue" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                        <ConfigItem title="Habilitar Controle de Sessões" desc="Para tratamentos recorrentes (Fono/Fisio)" isChecked={currentSettings.enable_session_control} onChange={() => toggleFlag("enable_session_control")} colorScheme="blue" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                        <ConfigItem title="Exigir Lateralidade" desc="Obrigatório informar lado afetado (Ortopedia)" isChecked={currentSettings.require_laterality} onChange={() => toggleFlag("require_laterality")} colorScheme="orange" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                        <ConfigItem title="Pressão Arterial Obrigatória" desc="Impede finalizar sem aferir PA" isChecked={currentSettings.require_blood_pressure} onChange={() => toggleFlag("require_blood_pressure")} colorScheme="red" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                      </Flex>
                    </Box>

                    <Divider borderColor={borderColor} />

                    {/* GRUPO 3: AVANÇADOS */}
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" mb={4} color={textColor}>Módulos Avançados</Text>
                      <Flex direction="column" gap={3}>
                        <ConfigItem title="Sinais Vitais Avançados" desc="Habilita Freq. Cardíaca, Freq. Respiratória, SatO2 e Temperatura" isChecked={currentSettings.enable_advanced_vitals} onChange={() => toggleFlag("enable_advanced_vitals")} colorScheme="purple" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                        <ConfigItem title="Módulo Antropometria" desc="Cálculo de IMC, Circunferência Abdominal e Composição" isChecked={currentSettings.enable_anthropometry} onChange={() => toggleFlag("enable_anthropometry")} colorScheme="purple" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                        <ConfigItem title="Alertas de Saúde Mental" desc="Flags de rastreio de Risco Suicida e Humor" isChecked={currentSettings.enable_mental_status} onChange={() => toggleFlag("enable_mental_status")} colorScheme="red" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                        <ConfigItem title="Protocolos de Isolamento" desc="Indicadores de precaução (Gotículas, Aerossóis, Contato)" isChecked={currentSettings.enable_isolation_alerts} onChange={() => toggleFlag("enable_isolation_alerts")} colorScheme="yellow" bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor} />
                      </Flex>
                    </Box>
                  </VStack>
                )}
              </CardBody>
          ) : (
              <Flex flex={1} justify="center" align="center" direction="column" color={subTextColor}>
                  <Icon as={FaStethoscope} w={12} h={12} mb={4} opacity={0.3} />
                  {selectedClinicId 
                      ? <Text>Selecione uma especialidade na lista à esquerda.</Text>
                      : <Text>Por favor, selecione uma clínica no menu superior.</Text>
                  }
              </Flex>
          )}
        </Card>
      </Flex>
    </Flex>
  );
}

function ConfigItem({ title, desc, isChecked, onChange, colorScheme, bg, textColor, subColor, borderColor }) {
  return (
    <HStack justify="space-between" bg={bg} p={3} borderRadius="md" border="1px solid" borderColor={borderColor}>
      <Box>
        <Text fontWeight="medium" color={textColor}>{title}</Text>
        <Text fontSize="xs" color={subColor}>{desc}</Text>
      </Box>
      <Switch isChecked={isChecked} onChange={onChange} colorScheme={colorScheme} />
    </HStack>
  );
}