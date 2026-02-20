import React from "react";
import { FormControl, FormLabel, Textarea, Input, VStack, Heading, SimpleGrid } from "@chakra-ui/react";

export default function CardiologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="blue.400">
        Avaliação Cardiovascular
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        {/* Histórico Familiar - Tamanho Médio/Grande */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Histórico Familiar (Cardiopatias, HAS, Diabetes)</FormLabel>
          <Textarea 
            name="family_history" 
            value={formData.family_history || ""} 
            onChange={handleChange} 
            placeholder="Relate histórico de infarto, morte súbita, hipertensão em parentes de 1º grau..."
            resize="none"
            minH="120px"
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>

        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Sintomas e Queixas Cardíacas</FormLabel>
          <Textarea 
            name="cardio_symptoms" 
            value={formData.cardio_symptoms || ""} 
            onChange={handleChange} 
            placeholder="Dor precordial, palpitações, dispneia aos esforços, síncope..."
            resize="none" 
            minH="120px" 
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>

        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Exame Físico: Ausculta Cardíaca</FormLabel>
          <Textarea 
            name="ausculta_cardiaca" 
            value={formData.ausculta_cardiaca || ""} 
            onChange={handleChange} 
            placeholder="Ritmo, bulhas, presença de sopros (localização e intensidade)..."
            resize="none" 
            minH="80px" 
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}