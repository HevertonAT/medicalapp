import React from 'react';
import { FormControl, FormLabel, Textarea, VStack, Heading } from '@chakra-ui/react';

export default function GastroenterologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="orange.400">
        Avaliação Gastrointestinal
      </Heading>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Ritmo Intestinal e Aspecto das Fezes</FormLabel>
        <Textarea 
          name="ritmo_intestinal" 
          value={formData.ritmo_intestinal || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Escala de Bristol, frequência evacuatória, presença de sangue, muco ou restos alimentares..." 
          resize="none"
          minH="120px"
          _focus={{ borderColor: "orange.400" }}
        />
      </FormControl>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Sintomas Dis pépticos / Dor Abdominal</FormLabel>
        <Textarea 
          name="dor_abdominal" 
          value={formData.dor_abdominal || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Localização, irradiação, tipo da dor (cólica, queimação), fatores de melhora/piora, azia e náuseas..." 
          resize="none" // <-- REMOVE A REGULAGEM MANUAL
          minH="160px"  // <-- MAIOR ESPAÇO PARA DESCRIÇÃO SEMIOLÓGICA DA DOR
          _focus={{ borderColor: "orange.400" }}
        />
      </FormControl>
    </VStack>
  );
}