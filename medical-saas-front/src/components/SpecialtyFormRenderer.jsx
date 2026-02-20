import React from "react";
import { Box, FormControl, FormLabel, Input, HStack,
SimpleGrid,Textarea, Select, Heading, Divider
} from "@chakra-ui/react";
import CardiologiaFields from "./CardiologiaFields";
import ClinicoGeralFields from "./ClinicoGeralFields";
import DermatologiaFields from "./DermatologiaFields";
import FonoaudiologiaFields from "./FonoaudiologiaFields";
import GinecoFields from "./GinecoFields";
import OftalmologiaFields from "./OftalmologiaFields";
import OrtopediaFields from "./OrtopediaFields";
import PediatriaFields from "./PediatriaFields";
import ClinicaMedicaFields from "./ClinicaMedicaFields";
import EndocrinologiaFields from "./EndocrinologiaFields";
import GastroenterologiaFields from "./GastroenterologiaFields";
import GeriatriaFields from "./GeriatriaFields";
import HematologiaFields from "./HematologiaFields";
import InfectologiaFields from "./InfectologiaFields";
import NefrologiaFields from "./NefrologiaFields";
import NeurologiaFields from "./NeurologiaFields";
import NutrologiaFields from "./NutrologiaFields";
import PneumologiaFields from "./PneumologiaFields";
import PsiquiatriaFields from "./PsiquiatriaFields";
import ReumatologiaFields from "./ReumatologiaFields";
import UrologiaFields from "./UrologiaFields";


export default function SpecialtyFormRenderer({ specialty, settings = {}, data = {}, onChange }) {
  
  // Função auxiliar para atualizar o JSON de dados clínicos (usado pelos inputs manuais)
  const updateField = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  // Função auxiliar para atualizar os dados vindos dos componentes específicos (que usam e.target)
  const handleSpecificChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  // Renderiza o componente específico baseado na string da especialidade
  const renderSpecificFields = () => {
    // Props padrão que todos os componentes específicos vão receber
    const commonProps = {
      formData: data,
      handleChange: handleSpecificChange,
      bgInput: "white",
      borderColor: "gray.200",
      textColor: "gray.700"
    };

    switch (specialty) {
      case "Cardiologia": return <CardiologiaFields {...commonProps} />;
      case "Clínica Geral": return <ClinicoGeralFields {...commonProps} />;
      case "Clínica Médica": return <ClinicaMedicaFields {...commonProps} />;
      case "Dermatologia": return <DermatologiaFields {...commonProps} />;
      case "Endocrinologia": return <EndocrinologiaFields {...commonProps} />;
      case "Fonoaudiologia": return <FonoaudiologiaFields {...commonProps} />;
      case "Gastroenterologia": return <GastroenterologiaFields {...commonProps} />;
      case "Geriatria": return <GeriatriaFields {...commonProps} />;
      case "Ginecologia": return <GinecoFields {...commonProps} />;
      case "Hematologia": return <HematologiaFields {...commonProps} />;
      case "Infectologia": return <InfectologiaFields {...commonProps} />;
      case "Nefrologia": return <NefrologiaFields {...commonProps} />;
      case "Neurologia": return <NeurologiaFields {...commonProps} />;
      case "Nutrologia": return <NutrologiaFields {...commonProps} />;
      case "Oftalmologia": return <OftalmologiaFields {...commonProps} />;
      case "Ortopedia": return <OrtopediaFields {...commonProps} />;
      case "Pediatria": return <PediatriaFields {...commonProps} />;
      case "Pneumologia": return <PneumologiaFields {...commonProps} />;
      case "Psiquiatria": return <PsiquiatriaFields {...commonProps} />;
      case "Reumatologia": return <ReumatologiaFields {...commonProps} />;
      case "Urologia": return <UrologiaFields {...commonProps} />;
      default: return null; // Retorna null se não tiver arquivo específico ainda
    }
  };

  return (
    <Box mt={4} p={4} borderWidth={1} borderRadius="md" bg="white" boxShadow="sm">
      <Heading size="sm" mb={4} color="gray.600">Dados Clínicos Específicos: {specialty || "Geral"}</Heading>

      <SimpleGrid columns={[1, 2]} spacing={6}>
        
        {/* --- BLOCO DE CONFIGURAÇÕES DINÂMICAS DO BANCO (SETTINGS) --- */}

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

      <Divider my={6} />

      {/* --- BLOCO DE CAMPOS TEXTUAIS ESPECÍFICOS --- */}
      <Box mt={4}>
        {renderSpecificFields()}
      </Box>

      {/* Observação Geral de Backup (Aparece junto com os campos para anotações extras) */}
      <Box mt={6}>
        <FormControl>
          <FormLabel>Observações Clínicas Gerais Adicionais</FormLabel>
          <Textarea 
            rows={3} 
            placeholder="Descreva observações adicionais, exames físicos extras..." 
            value={data.obs_geral || ""}
            onChange={e => updateField("obs_geral", e.target.value)}
          />
        </FormControl>
      </Box>

    </Box>
  );
}