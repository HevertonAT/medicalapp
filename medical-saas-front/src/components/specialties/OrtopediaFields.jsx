import React from "react";
import { 
  FormControl, FormLabel, Textarea, Select, VStack, Heading, SimpleGrid 
} from "@chakra-ui/react";

export default function OrtopediaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="orange.500">
        Avaliação Ortopédica e Traumatológica
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        {/* Lateralidade - Campo Crítico em Ortopedia */}
        <FormControl isRequired>
          <FormLabel color={textColor} fontWeight="bold">Lado Acometido (Lateralidade)</FormLabel>
          <Select 
            name="laterality" 
            value={formData.laterality || ""} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "orange.400" }}
          >
            <option value="">Selecione o Lado</option>
            <option value="right">Direito</option>
            <option value="left">Esquerdo</option>
            <option value="bilateral">Bilateral</option>
            <option value="axial">Axial / Central</option>
          </Select>
        </FormControl>

        {/* Descrição de Sintomas / Exame Físico Motor */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Sintomas e Exame Físico Osteomuscular</FormLabel>
          <Textarea 
            name="ortho_physical_exam" 
            value={formData.ortho_physical_exam || ""} 
            onChange={handleChange} 
            placeholder="Descreva dor (local, escala), limitação de ADM, força muscular, testes específicos (Lachman, Phalen, etc) e estabilidade articular..."
            resize="none"
            minH="150px"
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "orange.400" }}
          />
        </FormControl>

        {/* Laudos de Imagem Detalhados */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Laudos de Exames de Imagem (RX, TC, RM)</FormLabel>
          <Textarea 
            name="imaging_notes" 
            value={formData.imaging_notes || ""} 
            onChange={handleChange} 
            placeholder="Transcreva ou resuma os achados relevantes de Radiografias, Tomografias ou Ressonâncias Magnéticas..."
            resize="none" 
            minH="150px"  // <-- MAIOR ESPAÇO PARA TRANSCRIÇÃO DE LAUDOS
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "orange.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}