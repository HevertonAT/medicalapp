import React from "react";
import { 
  FormControl, FormLabel, Textarea, Input, VStack, Heading, SimpleGrid, HStack, Box 
} from "@chakra-ui/react";

export default function FonoaudiologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="teal.400">
        Avaliação e Evolução Fonoaudiológica
      </Heading>

      {/* Controle de Sessões em Linha */}
      <SimpleGrid columns={[1, 2]} spacing={4}>
        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Controle de Sessão</FormLabel>
          <HStack>
            <Input 
              type="number" 
              name="session_number" 
              value={formData.session_number || ""} 
              onChange={handleChange} 
              placeholder="Atual" 
              bg={bgInput} 
              color={textColor} 
              borderColor={borderColor}
              _focus={{ borderColor: "teal.400" }}
            />
            <Box color={textColor}>de</Box>
            <Input 
              type="number" 
              name="session_total" 
              value={formData.session_total || ""} 
              onChange={handleChange} 
              placeholder="Total" 
              bg={bgInput} 
              color={textColor} 
              borderColor={borderColor}
              _focus={{ borderColor: "teal.400" }}
            />
          </HStack>
        </FormControl>

        {/* Audiometria / Observações Auditivas */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Audiometria e Observações Auditivas</FormLabel>
          <Textarea 
            name="audiometry" 
            value={formData.audiometry || ""} 
            onChange={handleChange} 
            placeholder="Registre limiares auditivos, testes realizados e percepção sonora..."
            resize="none"
            minH="100px"
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "teal.400" }}
          />
        </FormControl>

        {/* Evolução da Fala e Linguagem */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Evolução da Fala e Linguagem</FormLabel>
          <Textarea 
            name="speech_evolution" 
            value={formData.speech_evolution || ""} 
            onChange={handleChange} 
            placeholder="Descreva o progresso fonológico, semântico e motor oral do paciente..."
            resize="none" 
            minH="180px"  // <-- MAIOR ESPAÇO PARA RELATOS DE EVOLUÇÃO
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "teal.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}