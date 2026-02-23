import React from "react";
import { 
  Box, FormControl, FormLabel, Input, HStack, SimpleGrid, 
  Textarea, Select, Heading, Divider, useColorModeValue 
} from "@chakra-ui/react";

// --- IMPORTAÇÕES DOS COMPONENTES ---
import CardiologiaFields from "./specialties/CardiologiaFields";
import ClinicoGeralFields from "./specialties/ClinicoGeralFields";
import DermatologiaFields from "./specialties/DermatologiaFields";
import FonoaudiologiaFields from "./specialties/FonoaudiologiaFields";
import GinecoFields from "./specialties/GinecoFields";
import OftalmologiaFields from "./specialties/OftalmologiaFields";
import OrtopediaFields from "./specialties/OrtopediaFields";
import PediatriaFields from "./specialties/PediatriaFields";
import EndocrinologiaFields from "./specialties/EndocrinologiaFields";
import GastroenterologiaFields from "./specialties/GastroenterologiaFields";
import GeriatriaFields from "./specialties/GeriatriaFields";
import HematologiaFields from "./specialties/HematologiaFields";
import InfectologiaFields from "./specialties/InfectologiaFields";
import NefrologiaFields from "./specialties/NefrologiaFields";
import NeurologiaFields from "./specialties/NeurologiaFields";
import NutrologiaFields from "./specialties/NutrologiaFields";
import PneumologiaFields from "./specialties/PneumologiaFields";
import PsiquiatriaFields from "./specialties/PsiquiatriaFields";
import ReumatologiaFields from "./specialties/ReumatologiaFields";
import UrologiaFields from "./specialties/UrologiaFields";

export default function SpecialtyFormRenderer({ specialty, settings = {}, data = {}, onChange }) {
  
  // --- DEFINIÇÃO DINÂMICA DE CORES (MODO CLARO / ESCURO) ---
  const bgContainer = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const headingColor = useColorModeValue("gray.600", "gray.400");
  const inputBg = useColorModeValue("white", "gray.700");

  // Cores para os blocos coloridos
  const blueBlock = useColorModeValue("blue.50", "blue.900");
  const pinkBlock = useColorModeValue("pink.50", "pink.900");
  const tealBlock = useColorModeValue("teal.50", "teal.900");
  const orangeBlock = useColorModeValue("orange.50", "orange.900");
  const redBlock = useColorModeValue("red.50", "red.900");

  const updateField = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleSpecificChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  const renderSpecificFields = () => {
    const commonProps = {
      formData: data,
      handleChange: handleSpecificChange,
      bgInput: inputBg,
      borderColor: borderColor,
      textColor: textColor
    };

    switch (specialty) {
      case "Cardiologia": return <CardiologiaFields {...commonProps} />;
      case "Clínico Geral": return <ClinicoGeralFields {...commonProps} />;
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
      default: return null;
    }
  };

  return (
    <Box mt={4} p={4} borderWidth={1} borderRadius="md" bg={bgContainer} borderColor={borderColor} boxShadow="sm">
      <Heading size="sm" mb={4} color={headingColor}>Dados Clínicos Específicos: {specialty || "Geral"}</Heading>

      <SimpleGrid columns={[1, 2]} spacing={6}>
        
        {settings.enable_birth_data && (
          <Box gridColumn="span 2" p={4} bg={blueBlock} borderRadius="md">
            <Heading size="xs" mb={3} color={useColorModeValue("blue.700", "blue.200")}>👶 Dados de Nascimento / Crescimento</Heading>
            <HStack>
              <FormControl>
                <FormLabel fontSize="sm" color={textColor}>Peso (kg)</FormLabel>
                <Input type="number" bg={inputBg} color={textColor} borderColor={borderColor} value={data.peso || ""} onChange={e => updateField("peso", e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={textColor}>Altura (cm)</FormLabel>
                <Input type="number" bg={inputBg} color={textColor} borderColor={borderColor} value={data.altura || ""} onChange={e => updateField("altura", e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={textColor}>Perím. Cefálico</FormLabel>
                <Input type="number" bg={inputBg} color={textColor} borderColor={borderColor} value={data.pc || ""} onChange={e => updateField("pc", e.target.value)} />
              </FormControl>
            </HStack>
          </Box>
        )}

        {settings.enable_gestation_data && (
          <Box gridColumn="span 2" p={4} bg={pinkBlock} borderRadius="md">
            <Heading size="xs" mb={3} color={useColorModeValue("pink.700", "pink.200")}>🤰 Dados Obstétricos</Heading>
            <HStack>
              <FormControl>
                <FormLabel fontSize="sm" color={textColor}>DUM</FormLabel>
                <Input type="date" bg={inputBg} color={textColor} borderColor={borderColor} value={data.dum || ""} onChange={e => updateField("dum", e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={textColor}>DPP</FormLabel>
                <Input type="date" bg={inputBg} color={textColor} borderColor={borderColor} value={data.dpp || ""} onChange={e => updateField("dpp", e.target.value)} />
              </FormControl>
            </HStack>
          </Box>
        )}

        {settings.enable_vision_data && (
          <Box gridColumn="span 2" p={4} bg={tealBlock} borderRadius="md">
            <Heading size="xs" mb={3} color={useColorModeValue("teal.700", "teal.200")}>👁️ Acuidade Visual</Heading>
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" color={textColor}>Olho Direito (OD)</FormLabel>
                <Input bg={inputBg} color={textColor} borderColor={borderColor} placeholder="Ex: 20/20" value={data.od || ""} onChange={e => updateField("od", e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={textColor}>Olho Esquerdo (OE)</FormLabel>
                <Input bg={inputBg} color={textColor} borderColor={borderColor} placeholder="Ex: 20/20" value={data.oe || ""} onChange={e => updateField("oe", e.target.value)} />
              </FormControl>
            </SimpleGrid>
          </Box>
        )}

        {settings.require_laterality && (
          <FormControl isRequired>
            <FormLabel fontWeight="bold" color={textColor}>Lado Acometido</FormLabel>
            <Select 
              placeholder="Selecione..." 
              bg={orangeBlock} 
              color={textColor}
              borderColor={useColorModeValue("orange.300", "orange.700")}
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

        {/* --- CORREÇÃO: O campo P.A agora fica totalmente oculto se não for exigido --- */}
        {(settings.require_blood_pressure || settings.enable_blood_pressure) && (
          <FormControl isRequired>
            <FormLabel color={textColor}>
              Pressão Arterial (PA) <Box as="span" color="red.500" ml={1}>*</Box>
            </FormLabel>
            <Input 
              placeholder="Ex: 120x80" 
              bg={redBlock}
              borderColor="red.200"
              color={textColor}
              value={data.pa || ""} 
              onChange={e => updateField("pa", e.target.value)} 
            />
          </FormControl>
        )}

      </SimpleGrid>

      <Divider my={6} borderColor={borderColor} />

      <Box mt={4}>
        {renderSpecificFields()}
      </Box>

    <Box mt={6}>
      <FormControl>
        <FormLabel color={textColor}>Observações Clínicas Gerais Adicionais</FormLabel>
        <Textarea 
          rows={6}
          minH="150px" 
          resize="none" 
          placeholder="Descreva observações adicionais..." 
          value={data.obs_geral || ""}
          onChange={e => updateField("obs_geral", e.target.value)}
          bg={inputBg}
          color={textColor}
          borderColor={borderColor}
          _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
        />
      </FormControl>
    </Box> 
  </Box>
  );
}