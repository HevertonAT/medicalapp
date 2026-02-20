import React from 'react';
import { FormControl, FormLabel, Textarea, VStack } from '@chakra-ui/react';

export default function HematologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel color={textColor}>Histórico de Sangramentos / Trombose</FormLabel>
        <Textarea name="historico_sangramento" value={formData.historico_sangramento || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} rows={2} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Avaliação de Linfonodos e Organomegalias</FormLabel>
        <Textarea name="linfonodos" value={formData.linfonodos || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Presença de linfonodomegalia, esplenomegalia, hepatomegalia..." rows={2} />
      </FormControl>
    </VStack>
  );
}