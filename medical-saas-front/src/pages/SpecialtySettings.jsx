import React, { useEffect, useState } from "react";
import {
  Box, Heading, Button, VStack, HStack, Switch, FormControl,
  FormLabel, Spinner, useToast, Text, Divider, Flex, Badge, Card, CardBody,
  useColorModeValue
} from "@chakra-ui/react";
// Importamos a lista mestra daqui
import { listRules, createRule, updateRule, MASTER_SPECIALTIES } from "../services/specialtyService";

// Configurações padrão
const DEFAULT_SETTINGS = {
  require_patient_cpf: true,
  require_responsible_cpf: false,
  enable_birth_data: false,      
  enable_gestation_data: false,  
  require_laterality: false,     
  require_blood_pressure: true,  
  enable_vision_data: false,     
  enable_session_control: false  
};

export default function SpecialtySettings() {
  const [rules, setRules] = useState([]); 
  const [selectedSpec, setSelectedSpec] = useState(MASTER_SPECIALTIES[0]); // Pega o primeiro da lista mestra
  const [currentSettings, setCurrentSettings] = useState(DEFAULT_SETTINGS); 
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const toast = useToast();

  // --- CORES (DARK MODE COMPATIBLE) ---
  const bgPage = useColorModeValue("gray.50", "gray.900");
  const bgCard = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  
  // Cores da Lista Lateral
  const itemHover = useColorModeValue("gray.100", "whiteAlpha.100"); // Ajustado para hover mais suave
  const itemActiveBg = useColorModeValue("blue.50", "blue.900");
  const itemActiveText = useColorModeValue("blue.700", "blue.200");
  const itemBorderActive = useColorModeValue("blue.500", "blue.300");

  // --- AJUSTE DE FUNDO DAS OPÇÕES ---
  // Usamos whiteAlpha.50 no dark mode para um fundo sutil e elegante sobre o card cinza
  const blockBg = useColorModeValue("gray.50", "whiteAlpha.50"); 

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const foundRule = rules.find(r => r.specialty === selectedSpec);
    if (foundRule) {
      setCurrentSettings({ ...DEFAULT_SETTINGS, ...foundRule.settings });
    } else {
      setCurrentSettings(DEFAULT_SETTINGS);
    }
  }, [selectedSpec, rules]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listRules();
      setRules(data || []);
    } catch (e) {
      // Silencioso ou toast
    } finally {
      setLoading(false);
    }
  }

  const toggleFlag = (key) => {
    setCurrentSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const existingRule = rules.find(r => r.specialty === selectedSpec);
      const payload = {
        specialty: selectedSpec,
        settings: currentSettings,
        active: true
      };

      if (existingRule) {
        await updateRule(existingRule.id, payload);
      } else {
        await createRule(payload);
      }
      toast({ title: 'Salvo com sucesso!', status: 'success' });
      loadData(); 
    } catch (e) {
      toast({ title: 'Erro ao salvar', status: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Flex h="85vh" gap={6} p={6} bg={bgPage}>
      
      {/* --- PAINEL ESQUERDO: LISTA --- */}
      <Card w="300px" h="full" variant="outline" bg={bgCard} borderColor={borderColor}>
        <Box p={4} borderBottomWidth={1} borderColor={borderColor}>
          <Heading size="md" color={textColor}>Especialidades</Heading>
          <Text fontSize="xs" color={subTextColor}>Selecione para configurar</Text>
        </Box>
        <VStack align="stretch" spacing={0} overflowY="auto">
          {MASTER_SPECIALTIES.map(spec => {
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
      <Card flex={1} variant="outline" bg={bgCard} borderColor={borderColor}>
        <CardBody display="flex" flexDirection="column" h="full">
          <Flex justify="space-between" align="center" mb={6}>
            <Box>
              <Heading size="md" color={textColor}>Configurações: {selectedSpec}</Heading>
              <Text fontSize="sm" color={subTextColor}>Regras aplicadas aos formulários médicos.</Text>
            </Box>
            <Button 
              colorScheme="blue" 
              onClick={handleSave} 
              isLoading={saving}
            >
              Salvar Configurações
            </Button>
          </Flex>

          {loading ? (
            <Flex justify="center" align="center" h="200px"><Spinner /></Flex>
          ) : (
            <VStack align="stretch" spacing={8} overflowY="auto" px={2} pb={4}>
              
              {/* GRUPO 1 */}
              <Box>
                <Text fontWeight="bold" fontSize="lg" mb={4} color={textColor}>
                Validação de Documentos
                </Text>
                <Flex wrap="wrap" gap={6}>
                  <FormControl display="flex" alignItems="center" w="auto" bg={blockBg} p={3} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <Switch 
                      id="cpf-paciente" 
                      isChecked={currentSettings.require_patient_cpf}
                      onChange={() => toggleFlag("require_patient_cpf")}
                      colorScheme="green" 
                      mr={3} 
                    />
                    <FormLabel htmlFor="cpf-paciente" mb={0} cursor="pointer" color={textColor}>Exigir CPF do Paciente</FormLabel>
                  </FormControl>

                  <FormControl display="flex" alignItems="center" w="auto" bg={blockBg} p={3} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <Switch 
                      id="cpf-resp" 
                      isChecked={currentSettings.require_responsible_cpf}
                      onChange={() => toggleFlag("require_responsible_cpf")}
                      colorScheme="green" 
                      mr={3} 
                    />
                    <FormLabel htmlFor="cpf-resp" mb={0} cursor="pointer" color={textColor}>Exigir CPF Responsável</FormLabel>
                  </FormControl>
                </Flex>
              </Box>

              <Divider borderColor={borderColor} />

              {/* GRUPO 2 */}
              <Box>
                <Text fontWeight="bold" fontSize="lg" mb={4} color={textColor}>
                Campos Clínicos Específicos
                </Text>
                
                <Flex direction="column" gap={3}>
                  {/* Item Helper Component */}
                  <ConfigItem 
                    title="Habilitar Dados de Nascimento"
                    desc="Exibe Peso, Altura, PC, APGAR (Pediatria)"
                    isChecked={currentSettings.enable_birth_data}
                    onChange={() => toggleFlag("enable_birth_data")}
                    colorScheme="blue"
                    bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor}
                  />

                  <ConfigItem 
                    title="Habilitar Campos de Gestação"
                    desc="Exibe DUM e DPP (Ginecologia/Obstetrícia)"
                    isChecked={currentSettings.enable_gestation_data}
                    onChange={() => toggleFlag("enable_gestation_data")}
                    colorScheme="blue"
                    bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor}
                  />

                  <ConfigItem 
                    title="Habilitar Campos de Visão"
                    desc="Exibe campos para Olho Direito (OD) e Esquerdo (OE)"
                    isChecked={currentSettings.enable_vision_data}
                    onChange={() => toggleFlag("enable_vision_data")}
                    colorScheme="blue"
                    bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor}
                  />

                  <ConfigItem 
                    title="Habilitar Controle de Sessões"
                    desc="Para tratamentos recorrentes (Fono/Fisio)"
                    isChecked={currentSettings.enable_session_control}
                    onChange={() => toggleFlag("enable_session_control")}
                    colorScheme="blue"
                    bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor}
                  />

                  <ConfigItem 
                    title="Exigir Lateralidade"
                    desc="Obrigatório informar lado afetado (Ortopedia)"
                    isChecked={currentSettings.require_laterality}
                    onChange={() => toggleFlag("require_laterality")}
                    colorScheme="orange"
                    bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor}
                  />

                  <ConfigItem 
                    title="Pressão Arterial Obrigatória"
                    desc="Impede finalizar sem aferir PA"
                    isChecked={currentSettings.require_blood_pressure}
                    onChange={() => toggleFlag("require_blood_pressure")}
                    colorScheme="red"
                    bg={blockBg} textColor={textColor} subColor={subTextColor} borderColor={borderColor}
                  />
                </Flex>
              </Box>

            </VStack>
          )}
        </CardBody>
      </Card>
    </Flex>
  );
}

// Componente auxiliar atualizado para receber borderColor
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