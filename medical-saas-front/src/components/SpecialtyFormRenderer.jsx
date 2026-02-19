import React from "react";
import { 
  Box, FormControl, FormLabel, Input, HStack, SimpleGrid, 
  Textarea, Select, Heading, Divider, Alert, AlertIcon 
} from "@chakra-ui/react";

/*
  Este componente agora é 100% DINÂMICO.
  Ele renderiza blocos baseados nas flags 'settings' vindas do banco.
*/
export default function SpecialtyFormRenderer({ settings = {}, data = {}, onChange }) {
  
  // Função auxiliar para atualizar o JSON de dados clínicos
  const updateField = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Box mt={4} p={4} borderWidth={1} borderRadius="md" bg="white" boxShadow="sm">
      <Heading size="sm" mb={4} color="gray.600">Dados Clínicos Específicos</Heading>

      <SimpleGrid columns={[1, 2]} spacing={6}>
        
        {/* --- BLOCO 1: DADOS DE NASCIMENTO (PEDIATRIA) --- */}
        {settings.enable_birth_data && (
          <Box gridColumn="span 2" p={4} bg="blue.50" borderRadius="md">
            <Heading size="xs" mb={3} color="blue.700">👶 Dados de Nascimento / Crescimento</Heading>
            <HStack>
              <FormControl>
                <FormLabel fontSize="sm">Peso (kg)</FormLabel>
                <Input type="number" bg="white" value={data.peso || ""} onChange={e => updateField("peso", e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Altura (cm)</FormLabel>
                <Input type="number" bg="white" value={data.altura || ""} onChange={e => updateField("altura", e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Perím. Cefálico</FormLabel>
                <Input type="number" bg="white" value={data.pc || ""} onChange={e => updateField("pc", e.target.value)} />
              </FormControl>
            </HStack>
          </Box>
        )}

        {/* --- BLOCO 2: GESTAÇÃO (GINECOLOGIA) --- */}
        {settings.enable_gestation_data && (
          <Box gridColumn="span 2" p={4} bg="pink.50" borderRadius="md">
            <Heading size="xs" mb={3} color="pink.700">🤰 Dados Obstétricos</Heading>
            <HStack>
              <FormControl>
                <FormLabel fontSize="sm">DUM (Data Última Menstruação)</FormLabel>
                <Input type="date" bg="white" value={data.dum || ""} onChange={e => updateField("dum", e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">DPP (Data Provável Parto)</FormLabel>
                <Input type="date" bg="white" value={data.dpp || ""} onChange={e => updateField("dpp", e.target.value)} />
              </FormControl>
            </HStack>
          </Box>
        )}

        {/* --- BLOCO 3: VISÃO (OFTALMOLOGIA) --- */}
        {settings.enable_vision_data && (
          <Box gridColumn="span 2" p={4} bg="teal.50" borderRadius="md">
            <Heading size="xs" mb={3} color="teal.700">👁️ Acuidade Visual</Heading>
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Olho Direito (OD)</FormLabel>
                <Input bg="white" placeholder="Ex: 20/20" value={data.od || ""} onChange={e => updateField("od", e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Olho Esquerdo (OE)</FormLabel>
                <Input bg="white" placeholder="Ex: 20/20" value={data.oe || ""} onChange={e => updateField("oe", e.target.value)} />
              </FormControl>
            </SimpleGrid>
          </Box>
        )}

        {/* --- BLOCO 4: LATERALIDADE (ORTOPEDIA) --- */}
        {settings.require_laterality && (
          <FormControl isRequired>
            <FormLabel fontWeight="bold">Lado Acometido (Lateralidade)</FormLabel>
            <Select 
              placeholder="Selecione..." 
              bg="orange.50" 
              borderColor="orange.300"
              value={data.lateralidade || ""} 
              onChange={e => updateField("lateralidade", e.target.value)}
            >
              <option value="direito">Direito</option>
              <option value="esquerdo">Esquerdo</option>
              <option value="bilateral">Bilateral</option>
              <option value="axial">Axial / Central</option>
            </Select>
          </FormControl>
        )}

        {/* --- BLOCO 5: CONTROLE DE SESSÕES (FONO/FISIO) --- */}
        {settings.enable_session_control && (
          <FormControl>
            <FormLabel>Controle de Sessão</FormLabel>
            <HStack>
              <Input type="number" w="80px" placeholder="Atual" value={data.sessao_atual || ""} onChange={e => updateField("sessao_atual", e.target.value)} />
              <Box>/</Box>
              <Input type="number" w="80px" placeholder="Total" value={data.sessao_total || ""} onChange={e => updateField("sessao_total", e.target.value)} />
            </HStack>
          </FormControl>
        )}

        {/* --- BLOCO 6: PRESSÃO ARTERIAL (COMUM) --- */}
        <FormControl isRequired={settings.require_blood_pressure}>
          <FormLabel>
            Pressão Arterial (PA) 
            {settings.require_blood_pressure && <Box as="span" color="red.500" ml={1}>*</Box>}
          </FormLabel>
          <Input 
            placeholder="Ex: 120x80" 
            bg={settings.require_blood_pressure ? "red.50" : "white"}
            borderColor={settings.require_blood_pressure ? "red.200" : "gray.200"}
            value={data.pa || ""} 
            onChange={e => updateField("pa", e.target.value)} 
          />
        </FormControl>

      </SimpleGrid>

      {/* Exemplo de alerta se nenhuma configuração específica estiver ativa */}
      {!settings.enable_birth_data && !settings.enable_gestation_data && !settings.enable_vision_data && (
        <Box mt={6}>
          <Divider mb={4} />
          <FormControl>
            <FormLabel>Observações Clínicas Gerais</FormLabel>
            <Textarea 
              rows={4} 
              placeholder="Descreva o quadro clínico..." 
              value={data.obs_geral || ""}
              onChange={e => updateField("obs_geral", e.target.value)}
            />
          </FormControl>
        </Box>
      )}

    </Box>
  );
}